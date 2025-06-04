# personal_finance_api/database/models.py
# IMPORTANTE: Garanta que Enum seja importado do módulo 'enum' padrão do Python
from enum import Enum # <--- Certifique-se de que esta linha está presente e correta

# Importar o Enum da SQLAlchemy, que é diferente do Enum do Python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric, Date, Boolean, Enum as SQLEnum # <--- RENOMEADO para evitar conflito

from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base # Se estiver usando declarative_base em outro lugar, mantenha.
from sqlalchemy.sql import func
from database.db import Base # Assumindo que Base é importada daqui
from decimal import Decimal
import json
from datetime import datetime, date # Importar datetime e date para tipos de colunas e defaults

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(512), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    dashboard_layout_order = Column(
        Text,
        default=json.dumps([
            'totalBalanceCard',
            'quickActionsCard',
            'accountsCard',
            'categoriesCard',
            'incomeVsExpenseChart',
        ]),
        nullable=True
    )

    contas = relationship("Conta", back_populates="usuario", cascade="all, delete-orphan")
    transacoes = relationship("Transacao", back_populates="usuario", cascade="all, delete-orphan")
    categorias = relationship("Categoria", back_populates="usuario", cascade="all, delete-orphan")
    listas_de_compras = relationship("ListaDeCompras", back_populates="usuario", cascade="all, delete-orphan")
    contas_a_pagar = relationship("ContaAPagar", back_populates="usuario", cascade="all, delete-orphan")
    metas_financeiras = relationship("MetaFinanceira", back_populates="usuario", cascade="all, delete-orphan")
    estoque_pessoal = relationship("EstoquePessoal", back_populates="usuario", cascade="all, delete-orphan")
    produtos = relationship("Produto", backref="usuario", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"

    def to_dict(self):
        layout_order = []
        if self.dashboard_layout_order:
            try:
                layout_order = json.loads(self.dashboard_layout_order)
            except json.JSONDecodeError:
                layout_order = [
                    'totalBalanceCard',
                    'quickActionsCard',
                    'accountsCard',
                    'categoriesCard',
                    'incomeVsExpenseChart',
                ]
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "dashboard_layout_order": layout_order,
        }

class Conta(Base):
    __tablename__ = "contas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    saldo_inicial = Column(Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    saldo_atual = Column(Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    tipo = Column(String(50), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    instituicao = Column(String(255), nullable=True)
    observacoes = Column(Text, nullable=True)

    usuario = relationship("User", back_populates="contas")
    transacoes = relationship("Transacao", back_populates="conta", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conta(id={self.id}, nome='{self.nome}', saldo_atual={self.saldo_atual}, tipo='{self.tipo}', user_id={self.user_id})>"

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "saldo_inicial": float(self.saldo_inicial),
            "saldo_atual": float(self.saldo_atual),
            "tipo": self.tipo,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "instituicao": self.instituicao,
            "observacoes": self.observacoes,
        }

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    tipo = Column(String(50), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    usuario = relationship("User", back_populates="categorias")
    transacoes = relationship("Transacao", back_populates="categoria", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Categoria(id={self.id}, nome='{self.nome}', tipo='{self.tipo}', user_id={self.user_id})>"

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "tipo": self.tipo,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

# ENUMS Python
class TipoTransacaoEnum(Enum):
    RECEITA = 'RECEITA'
    DESPESA = 'DESPESA'

class StatusTransacaoEnum(Enum):
    PENDENTE = 'PENDENTE'
    PAGO = 'PAGO'
    RECEBIDO = 'RECEBIDO'
    CANCELADO = 'CANCELADO'


class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    valor = Column(Numeric(10, 2), nullable=False)
    descricao = Column(Text, nullable=False)
    data = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # CORREÇÃO para o tipo de transação (incluindo name e create_type)
    tipo = Column(SQLEnum(TipoTransacaoEnum, name="tipo_transacao_enum", create_type=True), nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conta_id = Column(Integer, ForeignKey("contas.id"), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    observacoes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    data_vencimento = Column(Date, nullable=True)
    entidade = Column(String(255), nullable=True)
    
    # CORREÇÃO para o status da transação (incluindo name e create_type)
    status = Column(SQLEnum(StatusTransacaoEnum, name="status_transacao_enum", create_type=True), default=StatusTransacaoEnum.PENDENTE, nullable=False)
    
    data_pagamento_recebimento = Column(Date, nullable=True)

    parcelado = Column(Boolean, default=False)
    numero_parcela = Column(Integer, nullable=True)
    total_parcelas = Column(Integer, nullable=True)
    id_transacao_pai = Column(Integer, ForeignKey('transacoes.id'), nullable=True)

    usuario = relationship("User", back_populates="transacoes")
    conta = relationship("Conta", back_populates="transacoes")
    categoria = relationship("Categoria", back_populates="transacoes")
    
    # --- CORREÇÃO AQUI: Relações auto-referenciais para parcelas ---
    # Relação para a transação PAI (uma parcela aponta para seu pai)
    # use_list=False assegura que esta relação retorne um único objeto (o pai), não uma lista.
    parent_transaction = relationship(
        'Transacao',
        remote_side=[id], # 'id' é a coluna da tabela 'remota' (o pai)
        foreign_keys=[id_transacao_pai], # 'id_transacao_pai' é a FK nesta tabela que aponta para o pai
        back_populates='child_installments', # Nome da relação no lado pai (que será uma coleção de filhos)
        uselist=False # Uma transação filha tem APENAS UM pai
    )

    # Relação para as parcelas FILHAS (uma transação pai lista suas parcelas)
    # Aqui, a foreign_keys é a coluna *nesta* tabela que aponta para o pai (seu próprio ID).
    # O id_transacao_pai é a coluna na transação FILHA.
    child_installments = relationship(
        'Transacao',
        primaryjoin="Transacao.id == Transacao.id_transacao_pai", # Como ligar pai com filho
        foreign_keys=[id_transacao_pai], # A coluna FK na tabela *filha*
        back_populates='parent_transaction', # Nome da relação no lado filho (que será um único pai)
        cascade="all, delete-orphan" # Opcional: Se o pai for deletado, as parcelas filhas também são
    )


    def __repr__(self):
        return (
            f"<Transacao(id={self.id}, descricao='{self.descricao}', valor={self.valor}, "
            f"tipo='{self.tipo.value if self.tipo else None}', data='{self.data}', conta_id={self.conta_id}, " # Usar .value
            f"categoria_id={self.categoria_id}, user_id={self.user_id}, "
            f"status='{self.status.value if self.status else None}')>"
        )

    def to_dict(self, include_related=True):
        data_dict = {
            "id": self.id,
            "descricao": self.descricao,
            "valor": float(self.valor), # Correção Decimal para float (ou str, se preferir)
            "tipo": self.tipo.value if self.tipo else None, # Usar .value para o tipo
            "data": self.data.isoformat() if self.data else None,
            "conta_id": self.conta_id,
            "categoria_id": self.categoria_id,
            "user_id": self.user_id,
            "observacoes": self.observacoes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "data_vencimento": self.data_vencimento.isoformat() if self.data_vencimento else None,
            "entidade": self.entidade,
            "status": self.status.value if self.status else None, # Usar .value para o status
            "data_pagamento_recebimento": self.data_pagamento_recebimento.isoformat() if self.data_pagamento_recebimento else None,
            "parcelado": self.parcelado,
            "numero_parcela": self.numero_parcela,
            "total_parcelas": self.total_parcelas,
            "id_transacao_pai": self.id_transacao_pai,
        }
        if include_related:
            if self.conta:
                data_dict['conta'] = {
                    "id": self.conta.id,
                    "nome": self.conta.nome,
                    "tipo": self.conta.tipo,
                    "saldo_atual": float(self.conta.saldo_atual)
                }
            if self.categoria:
                data_dict['categoria'] = {
                    "id": self.categoria.id,
                    "nome": self.categoria.nome,
                    "tipo": self.categoria.tipo
                }
            # Adicionado o parent_transaction para a transação filha
            if self.id_transacao_pai and self.parent_transaction:
                # Evitar recursão infinita (não necessário aqui, pois parent_transaction já é uselist=False)
                # mas é boa prática ter em mente
                data_dict['parent_transaction'] = self.parent_transaction.to_dict(include_related=False)
            
            # Use child_installments para a lista de parcelas
            if self.parcelado and self.child_installments: # Verifica se é uma transação pai e se tem parcelas carregadas
                data_dict['child_installments'] = [parcela.to_dict(include_related=False) for parcela in list(self.child_installments)]
            elif self.parcelado: # Se parcelado for True mas não há child_installments carregados (ou vazios)
                data_dict['child_installments'] = []
                
        return data_dict

class ListaDeCompras(Base):
    __tablename__ = "listas_de_compras"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"))
    nome = Column(String(100))
    tipo_lista = Column(String(50))
    meta_valor = Column(Numeric(10, 2))
    ativa = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    observacoes = Column(Text)

    usuario = relationship("User", back_populates="listas_de_compras")
    itens = relationship("ItemDaLista", back_populates="lista", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ListaDeCompras(id={self.id}, nome='{self.nome}', tipo='{self.tipo_lista}')>"

    def to_dict(self, include_related=True):
        data_dict = {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "nome": self.nome,
            "tipo_lista": self.tipo_lista,
            "meta_valor": float(self.meta_valor) if self.meta_valor else None,
            "ativa": self.ativa,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
            "observacoes": self.observacoes
        }
        if include_related:
            data_dict['itens'] = [item.to_dict() for item in self.itens]
        return data_dict

class ItemDaLista(Base):
    __tablename__ = "itens_da_lista"

    id = Column(Integer, primary_key=True, index=True)
    lista_id = Column(Integer, ForeignKey("listas_de_compras.id", ondelete="CASCADE"))
    nome = Column(String(100))
    categoria = Column(String(50))
    quantidade = Column(Integer, default=1)
    unidade = Column(String(20))
    preco_estimado = Column(Numeric(10, 2))
    comprado = Column(Boolean, default=False)
    preco_real = Column(Numeric(10, 2))
    data_compra = Column(DateTime(timezone=True), nullable=True)
    observacoes = Column(Text)
    prioridade = Column(String(20))

    lista = relationship("ListaDeCompras", back_populates="itens")

    def __repr__(self):
        return f"<ItemDaLista(id={self.id}, nome='{self.nome}', lista_id={self.lista_id})>"

    def to_dict(self):
        return {
            "id": self.id,
            "lista_id": self.lista_id,
            "nome": self.nome,
            "categoria": self.categoria,
            "quantidade": self.quantidade,
            "unidade": self.unidade,
            "preco_estimado": float(self.preco_estimado) if self.preco_estimado else None,
            "comprado": self.comprado,
            "preco_real": float(self.preco_real) if self.preco_real else None,
            "data_compra": self.data_compra.isoformat() if self.data_compra else None,
            "observacoes": self.observacoes,
            "prioridade": self.prioridade,
        }

class ContaAPagar(Base):
    __tablename__ = "contas_a_pagar"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"))
    descricao = Column(Text)
    valor_total = Column(Numeric(10, 2))
    numero_parcelas = Column(Integer)
    valor_parcela = Column(Numeric(10, 2))
    data_inicio = Column(Date)
    data_fim = Column(Date)
    recorrente = Column(Boolean, default=False)

    usuario = relationship("User", back_populates="contas_a_pagar")

    def __repr__(self):
        return f"<ContaAPagar(id={self.id}, descricao='{self.descricao}', valor_total={self.valor_total})>"

    def to_dict(self):
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "descricao": self.descricao,
            "valor_total": float(self.valor_total) if self.valor_total else None,
            "numero_parcelas": self.numero_parcelas,
            "valor_parcela": float(self.valor_parcela) if self.valor_parcela else None,
            "data_inicio": self.data_inicio.isoformat() if self.data_inicio else None,
            "data_fim": self.data_fim.isoformat() if self.data_fim else None,
            "recorrente": self.recorrente,
        }

class MetaFinanceira(Base):
    __tablename__ = "metas_financeiras"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"))
    titulo = Column(String(100))
    descricao = Column(Text)
    valor_necessario = Column(Numeric(10, 2))
    valor_reservado = Column(Numeric(10, 2), default=Decimal('0.00'))
    conta_destino = Column(String(50))
    atingido = Column(Boolean, default=False)
    data_meta = Column(Date)

    usuario = relationship("User", back_populates="metas_financeiras")

    def __repr__(self):
        return f"<MetaFinanceira(id={self.id}, titulo='{self.titulo}', valor_necessario={self.valor_necessario})>"

    def to_dict(self):
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "titulo": self.titulo,
            "descricao": self.descricao,
            "valor_necessario": float(self.valor_necessario) if self.valor_necessario else None,
            "valor_reservado": float(self.valor_reservado) if self.valor_reservado else None,
            "conta_destino": self.conta_destino,
            "atingido": self.atingido,
            "data_meta": self.data_meta.isoformat() if self.data_meta else None,
        }

class EstoquePessoal(Base):
    __tablename__ = "estoque_pessoal"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"))
    nome = Column(String(100))
    categoria = Column(String(50))
    quantidade = Column(Integer)
    unidade = Column(String(20))
    prioridade = Column(String(20))
    tipo_lista = Column(String(50))
    data_adicionado = Column(Date, server_default=func.now())
    data_necessaria = Column(Date, nullable=True)
    meta_valor = Column(Numeric(10, 2), nullable=True)
    comprado = Column(Boolean, default=False)
    observacoes = Column(Text)

    usuario = relationship("User", back_populates="estoque_pessoal")

    def __repr__(self):
        return f"<EstoquePessoal(id={self.id}, nome='{self.nome}', quantidade={self.quantidade})>"

    def to_dict(self):
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "nome": self.nome,
            "categoria": self.categoria,
            "quantidade": self.quantidade,
            "unidade": self.unidade,
            "prioridade": self.prioridade,
            "tipo_lista": self.tipo_lista,
            "data_adicionado": self.data_adicionado.isoformat() if self.data_adicionado else None,
            "data_necessaria": self.data_necessaria.isoformat() if self.data_necessaria else None,
            "meta_valor": float(self.meta_valor) if self.meta_valor else None,
            "comprado": self.comprado,
            "observacoes": self.observacoes,
        }

class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nome = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=True)
    unidade_medida = Column(String(50), nullable=True)
    categoria_produto = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    historico_precos = relationship("HistoricoPrecoProduto", back_populates="produto", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Produto(id={self.id}, nome='{self.nome}', usuario_id={self.usuario_id})>"

    def to_dict(self):
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "nome": self.nome,
            "descricao": self.descricao,
            "unidade_medida": self.unidade_medida,
            "categoria_produto": self.categoria_produto,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class HistoricoPrecoProduto(Base):
    __tablename__ = "historico_preco_produto"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    data_registro = Column(Date, server_default=func.now(), nullable=False)
    preco = Column(Numeric(10, 2), nullable=False)
    local_compra = Column(String(100), nullable=True)

    produto = relationship("Produto", back_populates="historico_precos")

    def __repr__(self):
        return f"<HistoricoPrecoProduto(id={self.id}, produto_id={self.produto_id}, data_registro='{self.data_registro}', preco={self.preco})>"

    def to_dict(self):
        return {
            "id": self.id,
            "produto_id": self.produto_id,
            "data_registro": self.data_registro.isoformat(),
            "preco": str(self.preco),
            "local_compra": self.local_compra
        }