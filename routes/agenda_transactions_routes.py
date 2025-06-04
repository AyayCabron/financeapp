# personal_finance_api/routes/agenda_transactions_routes.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from datetime import datetime, date
from decimal import Decimal, InvalidOperation

from database.db import SessionLocal
# Importe os modelos que você definiu em models.py
from database.models import Transacao, Conta, User, TipoTransacaoEnum, StatusTransacaoEnum

agenda_transaction_bp = Blueprint('agenda_transactions', __name__, url_prefix='/agenda/transactions')

# --- Rotas para Transações (Gerenciadas pela Agenda Financeira) ---
# Estas rotas usarão todos os novos campos de Transacao e a lógica de atualização de saldo.

@agenda_transaction_bp.route('', methods=['POST'])
@jwt_required()
def create_agenda_transacao():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    descricao = data.get('descricao')
    valor_str = data.get('valor')
    tipo_str = data.get('tipo') # 'receita' ou 'despesa'
    data_vencimento_str = data.get('data_vencimento')
    conta_id = data.get('conta_id')
    entidade = data.get('entidade')

    if not all([descricao, valor_str, tipo_str, data_vencimento_str, conta_id, entidade]):
        return jsonify({"message": "Todos os campos obrigatórios (descricao, valor, tipo, data_vencimento, conta_id, entidade) são necessários."}), 400

    db = SessionLocal()
    try:
        # Validação do tipo de transação (usando Enum para nova lógica)
        try:
            tipo_enum = TipoTransacaoEnum[tipo_str.upper()] # Converte string para Enum
        except KeyError:
            return jsonify({"message": "Tipo de transação inválido. Deve ser 'receita' ou 'despesa'."}), 400

        # Validação do valor
        try:
            valor = Decimal(str(valor_str))
            if valor <= 0:
                return jsonify({"message": "Valor da transação deve ser positivo."}), 400
        except InvalidOperation:
            return jsonify({"message": "Valor da transação inválido."}), 400

        # Validação da data de vencimento
        try:
            data_vencimento = datetime.strptime(data_vencimento_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "Formato de data de vencimento inválido. UsebeginPath-MM-DD."}), 400

        # Verifica se a conta existe e pertence ao usuário
        conta = db.query(Conta).filter_by(id=conta_id, user_id=current_user_id).first()
        if not conta:
            return jsonify({"message": "Conta não encontrada ou não pertence ao usuário."}), 404

        # Campos opcionais para Agenda Financeira
        status_str = data.get('status', StatusTransacaoEnum.PENDENTE.value) # Padrão 'pendente'
        try:
            status_enum = StatusTransacaoEnum[status_str.upper()]
        except KeyError:
            return jsonify({"message": "Status de transação inválido."}), 400

        data_pagamento_recebimento = None
        if data.get('data_pagamento_recebimento'):
            try:
                data_pagamento_recebimento = datetime.strptime(data['data_pagamento_recebimento'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"message": "Formato de data de pagamento/recebimento inválido. UsebeginPath-MM-DD."}), 400

        parcelado = data.get('parcelado', False)
        numero_parcela = data.get('numero_parcela') if parcelado else None
        total_parcelas = data.get('total_parcelas') if parcelado else None
        id_transacao_pai = data.get('id_transacao_pai') if parcelado else None
        observacoes = data.get('observacoes')

        # Criar a nova transação (usando o modelo Transacao com todos os campos)
        new_transacao = Transacao(
            user_id=current_user_id,
            conta_id=conta_id,
            descricao=descricao,
            valor=valor,
            tipo=tipo_str, # Armazenando como string para compatibilidade com rotas antigas
            data_vencimento=data_vencimento,
            entidade=entidade,
            status=status_enum, # Usando o Enum
            data_pagamento_recebimento=data_pagamento_recebimento,
            parcelado=parcelado,
            numero_parcela=numero_parcela,
            total_parcelas=total_parcelas,
            id_transacao_pai=id_transacao_pai,
            observacoes=observacoes,
        )

        db.add(new_transacao)
        db.commit()
        db.refresh(new_transacao)

        # Lógica de atualização de saldo da conta (se a transação for paga/recebida)
        if status_enum == StatusTransacaoEnum.PAGO or status_enum == StatusTransacaoEnum.RECEBIDO:
            if new_transacao.tipo == TipoTransacaoEnum.RECEITA.value: # Comparar com o valor da Enum
                conta.saldo_atual += new_transacao.valor
            elif new_transacao.tipo == TipoTransacaoEnum.DESPESA.value: # Comparar com o valor da Enum
                conta.saldo_atual -= new_transacao.valor
            db.add(conta)
            db.commit() # Commit para salvar a atualização da conta
            db.refresh(conta)

        return jsonify(new_transacao.to_dict()), 201

    except InvalidOperation:
        db.rollback()
        return jsonify({"message": "Valor ou dados numéricos inválidos fornecidos."}), 400
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao criar transação da agenda: {e}")
        return jsonify({"message": "Erro de integridade ao criar transação."}), 409
    except Exception as e:
        db.rollback()
        print(f"Ocorreu um erro inesperado ao criar transação da agenda: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

@agenda_transaction_bp.route('', methods=['GET'])
@jwt_required()
def get_agenda_transacoes():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        transacoes = db.query(Transacao)\
                       .filter_by(user_id=current_user_id)\
                       .options(joinedload(Transacao.conta))\
                       .order_by(Transacao.data_vencimento.asc()).all()

        transacoes_data = []
        for t in transacoes:
            t_dict = t.to_dict()
            if t.conta:
                t_dict['nome_conta'] = t.conta.nome
            else:
                t_dict['nome_conta'] = None
            transacoes_data.append(t_dict)

        return jsonify(transacoes_data), 200
    except Exception as e:
        print(f"Ocorreu um erro inesperado ao buscar transações da agenda: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

@agenda_transaction_bp.route('/<int:transaction_id>', methods=['GET'])
@jwt_required()
def get_agenda_transacao(transaction_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        transacao = db.query(Transacao)\
                      .filter_by(id=transaction_id, user_id=current_user_id)\
                      .options(joinedload(Transacao.conta))\
                      .first()
        if not transacao:
            return jsonify({"message": "Transação não encontrada ou não pertence ao usuário atual."}), 404

        transacao_dict = transacao.to_dict()
        if transacao.conta:
            transacao_dict['nome_conta'] = transacao.conta.nome
        else:
            transacao_dict['nome_conta'] = None

        return jsonify(transacao_dict), 200
    except Exception as e:
        print(f"Ocorreu um erro inesperado ao buscar transação da agenda: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

@agenda_transaction_bp.route('/<int:transaction_id>', methods=['PUT'])
@jwt_required()
def update_agenda_transacao(transaction_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()
    try:
        transacao = db.query(Transacao).filter_by(id=transaction_id, user_id=current_user_id).first()
        if not transacao:
            return jsonify({"message": "Transação não encontrada ou não pertence ao usuário atual."}), 404

        # Armazenar estado antigo para reversão de saldo
        conta_antiga_id = transacao.conta_id
        old_valor = transacao.valor
        old_tipo = transacao.tipo # Ainda string
        old_status = transacao.status

        # Atualiza campos da transação
        transacao.descricao = data.get('descricao', transacao.descricao)
        transacao.entidade = data.get('entidade', transacao.entidade)
        transacao.observacoes = data.get('observacoes', transacao.observacoes)

        if 'valor' in data and data['valor'] is not None:
            try:
                new_valor = Decimal(str(data['valor']))
                if new_valor <= 0:
                    return jsonify({"message": "Valor da transação deve ser positivo."}), 400
                transacao.valor = new_valor
            except InvalidOperation:
                return jsonify({"message": "Valor da transação inválido."}), 400

        if 'tipo' in data and data['tipo'] is not None:
            # Valida tipo de transação (nova lógica)
            try:
                TipoTransacaoEnum[data['tipo'].upper()] # Apenas validação, coluna 'tipo' é string
                transacao.tipo = data['tipo'] # Armazena como string
            except KeyError:
                return jsonify({"message": "Tipo de transação inválido."}), 400

        if 'status' in data and data['status'] is not None:
            try:
                transacao.status = StatusTransacaoEnum[data['status'].upper()]
            except KeyError:
                return jsonify({"message": "Status de transação inválido."}), 400

        if 'data_vencimento' in data and data['data_vencimento'] is not None:
            try:
                transacao.data_vencimento = datetime.strptime(data['data_vencimento'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"message": "Formato de data de vencimento inválido. UsebeginPath-MM-DD."}), 400
        elif 'data_vencimento' in data and data['data_vencimento'] is None:
            transacao.data_vencimento = None

        if 'data_pagamento_recebimento' in data and data['data_pagamento_recebimento'] is not None:
            try:
                transacao.data_pagamento_recebimento = datetime.strptime(data['data_pagamento_recebimento'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"message": "Formato de data de pagamento/recebimento inválido. UsebeginPath-MM-DD."}), 400
        elif 'data_pagamento_recebimento' in data and data['data_pagamento_recebimento'] is None:
            transacao.data_pagamento_recebimento = None

        if 'conta_id' in data and data['conta_id'] is not None and data['conta_id'] != transacao.conta_id:
            new_conta = db.query(Conta).filter_by(id=data['conta_id'], user_id=current_user_id).first()
            if not new_conta:
                return jsonify({"message": "Nova conta não encontrada ou não pertence ao usuário."}), 404
            transacao.conta_id = data['conta_id']

        # Campos de parcelamento
        if 'parcelado' in data:
            transacao.parcelado = data['parcelado']
        if 'numero_parcela' in data:
            transacao.numero_parcela = data['numero_parcela']
        if 'total_parcelas' in data:
            transacao.total_parcelas = data['total_parcelas']
        if 'id_transacao_pai' in data:
            transacao.id_transacao_pai = data['id_transacao_pai']


        db.commit() # Commit inicial para persistir as alterações da transação

        # Lógica de ajuste do saldo da conta
        conta_antiga = db.query(Conta).filter_by(id=conta_antiga_id).first()
        conta_nova = db.query(Conta).filter_by(id=transacao.conta_id).first()

        # 1. Reverter o efeito do status ANTIGO na CONTA ANTIGA
        if conta_antiga and (old_status == StatusTransacaoEnum.PAGO or old_status == StatusTransacaoEnum.RECEBIDO):
            if old_tipo == TipoTransacaoEnum.RECEITA.value:
                conta_antiga.saldo_atual -= old_valor
            elif old_tipo == TipoTransacaoEnum.DESPESA.value:
                conta_antiga.saldo_atual += old_valor
            db.add(conta_antiga)

        # 2. Aplicar o efeito do status NOVO na CONTA NOVA
        if conta_nova and (transacao.status == StatusTransacaoEnum.PAGO or transacao.status == StatusTransacaoEnum.RECEBIDO):
            if transacao.tipo == TipoTransacaoEnum.RECEITA.value:
                conta_nova.saldo_atual += transacao.valor
            elif transacao.tipo == TipoTransacaoEnum.DESPESA.value:
                conta_nova.saldo_atual -= transacao.valor
            db.add(conta_nova)

        db.commit() # Commit final para persistir as atualizações de saldo das contas
        db.refresh(transacao)
        # Opcional: refresh nas contas se precisar dos objetos atualizados depois
        if conta_antiga: db.refresh(conta_antiga)
        if conta_nova and conta_nova.id != conta_antiga_id: db.refresh(conta_nova)

        return jsonify(transacao.to_dict()), 200

    except InvalidOperation:
        db.rollback()
        return jsonify({"message": "Valores numéricos inválidos fornecidos."}), 400
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao atualizar transação da agenda: {e}")
        return jsonify({"message": "Erro de integridade ao atualizar transação."}), 409
    except Exception as e:
        db.rollback()
        print(f"Ocorreu um erro inesperado ao atualizar transação da agenda: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

@agenda_transaction_bp.route('/<int:transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_agenda_transacao(transaction_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        transacao = db.query(Transacao).filter_by(id=transaction_id, user_id=current_user_id).first()
        if not transacao:
            return jsonify({"message": "Transação não encontrada ou não pertence ao usuário atual."}), 404

        # Lógica para reverter o saldo da conta antes de deletar a transação
        conta = db.query(Conta).filter_by(id=transacao.conta_id).first()
        if conta and (transacao.status == StatusTransacaoEnum.PAGO or transacao.status == StatusTransacaoEnum.RECEBIDO):
            if transacao.tipo == TipoTransacaoEnum.RECEITA.value:
                conta.saldo_atual -= transacao.valor
            elif transacao.tipo == TipoTransacaoEnum.DESPESA.value:
                conta.saldo_atual += transacao.valor
            db.add(conta)
            db.commit() # Commit para salvar a atualização da conta
            db.refresh(conta)

        db.delete(transacao)
        db.commit() # Commit para salvar a deleção da transação

        return jsonify({"message": "Transação excluída com sucesso."}), 204
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao deletar transação da agenda: {e}")
        return jsonify({"message": "Erro: Transação não pôde ser excluída devido a uma restrição do banco de dados (ex: transações associadas). Por favor, verifique se não há outras dependências."}), 409
    except Exception as e:
        db.rollback()
        print(f"Ocorreu um erro inesperado ao deletar transação da agenda: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()