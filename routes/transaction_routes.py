# personal_finance_api/routes/transaction_routes.py
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from decimal import Decimal, InvalidOperation
import io

from database.db import SessionLocal
from database.models import Transacao, Conta, Categoria, User
import pandas as pd

transaction_bp = Blueprint('transactions', __name__, url_prefix='/transactions')

# Mapeamento de tipo de transação (frontend 'income'/'expense' para DB 'RECEITA'/'DESPESA')
TIPO_MAP_FRONTEND_TO_DB = {
    'income': 'RECEITA',
    'expense': 'DESPESA'
}

# Mapeamento de tipo de transação (DB 'RECEITA'/'DESPESA' para frontend 'income'/'expense')
TIPO_MAP_DB_TO_FRONTEND = {
    'RECEITA': 'income',
    'DESPESA': 'expense'
}

@transaction_bp.route('', methods=['POST'])
@jwt_required()
def create_transaction():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    valor = data.get('valor')
    descricao = data.get('descricao')
    data_str = data.get('data')
    tipo_frontend = data.get('tipo') # Recebe 'income' ou 'expense' do frontend
    conta_id = data.get('conta_id')
    categoria_id = data.get('categoria_id')
    observacoes = data.get('observacoes')
    data_vencimento_str = data.get('data_vencimento')
    entidade = data.get('entidade')
    data_pagamento_recebimento_str = data.get('data_pagamento_recebimento')
    parcelado = data.get('parcelado', False)
    numero_parcela = data.get('numero_parcela')
    total_parcelas = data.get('total_parcelas')
    id_transacao_pai = data.get('id_transacao_pai')
    status = data.get('status')

    if not all([valor, descricao, data_str, tipo_frontend, conta_id]):
        return jsonify({"message": "Valor, descrição, data, tipo e conta são obrigatórios."}), 400

    try:
        valor = Decimal(str(valor))
        if valor < 0:
            return jsonify({"message": "Valor não pode ser negativo."}), 400
        
        data_transacao = datetime.fromisoformat(data_str)
        data_vencimento = datetime.fromisoformat(data_vencimento_str) if data_vencimento_str else None
        data_pagamento_recebimento = datetime.fromisoformat(data_pagamento_recebimento_str) if data_pagamento_recebimento_str else None

        # Mapear tipo do frontend para o tipo do DB (MAIÚSCULAS)
        tipo_db = TIPO_MAP_FRONTEND_TO_DB.get(tipo_frontend)
        if tipo_db is None: # Se o tipo_frontend não estiver no mapeamento
            return jsonify({"message": f"Tipo de transação inválido: {tipo_frontend}. Deve ser 'income' ou 'expense'."}), 400

    except (ValueError, InvalidOperation):
        return jsonify({"message": "Dados de valor ou data inválidos."}), 400
    
    db = SessionLocal()
    try:
        conta = db.query(Conta).filter_by(id=conta_id, user_id=current_user_id).first()
        if not conta:
            return jsonify({"message": "Conta não encontrada ou não pertence ao usuário."}), 404
        
        categoria = None
        if categoria_id:
            categoria = db.query(Categoria).filter_by(id=categoria_id, user_id=current_user_id).first()
            if not categoria:
                return jsonify({"message": "Categoria não encontrada ou não pertence ao usuário."}), 404

        new_transaction = Transacao(
            valor=valor,
            descricao=descricao,
            data=data_transacao,
            tipo=tipo_db, # Usar o tipo mapeado para o DB (MAIÚSCULAS)
            user_id=current_user_id,
            conta_id=conta_id,
            categoria_id=categoria_id,
            observacoes=observacoes,
            data_vencimento=data_vencimento,
            entidade=entidade,
            data_pagamento_recebimento=data_pagamento_recebimento,
            parcelado=parcelado,
            numero_parcela=numero_parcela,
            total_parcelas=total_parcelas,
            id_transacao_pai=id_transacao_pai,
            status=status
        )
        db.add(new_transaction)

        # Atualizar saldo_atual da conta
        if tipo_db == 'RECEITA': # Usar tipo do DB (MAIÚSCULAS) para lógica de saldo
            conta.saldo_atual += valor
        else: # Assumindo que o outro tipo é 'DESPESA'
            conta.saldo_atual -= valor

        db.commit()
        db.refresh(new_transaction)
        db.refresh(conta)
        return jsonify(new_transaction.to_dict()), 201
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao criar transação. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar transação: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao criar a transação."}), 500
    finally:
        db.close()

@transaction_bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        transactions = db.query(Transacao).filter_by(user_id=current_user_id).all()
        # O to_dict() já faz o mapeamento para o frontend (income/expense)
        return jsonify([t.to_dict() for t in transactions]), 200
    except Exception as e:
        print(f"Erro ao buscar transações: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar as transações."}), 500
    finally:
        db.close()

@transaction_bp.route('/<int:transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        transaction = db.query(Transacao).filter_by(id=transaction_id, user_id=current_user_id).first()
        if not transaction:
            return jsonify({"message": "Transação não encontrada ou não pertence ao usuário."}), 404
        return jsonify(transaction.to_dict()), 200
    except Exception as e:
        print(f"Erro ao buscar transação: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar a transação."}), 500
    finally:
        db.close()

@transaction_bp.route('/<int:transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()

    try:
        transaction = db.query(Transacao).filter_by(id=transaction_id, user_id=current_user_id).first()
        if not transaction:
            return jsonify({"message": "Transação não encontrada ou não pertence ao usuário."}), 404

        old_valor = transaction.valor
        old_tipo_db = transaction.tipo # Tipo antigo no formato DB (MAIÚSCULAS)
        old_conta_id = transaction.conta_id

        if 'valor' in data:
            try:
                transaction.valor = Decimal(str(data['valor']))
                if transaction.valor < 0:
                    return jsonify({"message": "Valor não pode ser negativo."}), 400
            except InvalidOperation:
                return jsonify({"message": "Valor inválido."}), 400
        if 'descricao' in data:
            transaction.descricao = data['descricao']
        if 'data' in data:
            try:
                transaction.data = datetime.fromisoformat(data['data'])
            except ValueError:
                return jsonify({"message": "Formato de data inválido. UseYYYY-MM-DDTHH:MM:SS."}), 400
        if 'tipo' in data:
            tipo_frontend_sent = data['tipo'] # Recebe 'income' ou 'expense'
            # Mapear tipo do frontend para o tipo do DB (MAIÚSCULAS)
            tipo_db_new = TIPO_MAP_FRONTEND_TO_DB.get(tipo_frontend_sent)
            if tipo_db_new is None:
                return jsonify({"message": f"Tipo de transação inválido: {tipo_frontend_sent}. Deve ser 'income' ou 'expense'."}), 400
            transaction.tipo = tipo_db_new # Usar o tipo mapeado para o DB (MAIÚSCULAS)
        if 'conta_id' in data:
            new_conta = db.query(Conta).filter_by(id=data['conta_id'], user_id=current_user_id).first()
            if not new_conta:
                return jsonify({"message": "Nova conta não encontrada ou não pertence ao usuário."}), 404
            transaction.conta_id = data['conta_id']
        if 'categoria_id' in data:
            if data['categoria_id'] is not None:
                new_categoria = db.query(Categoria).filter_by(id=data['categoria_id'], user_id=current_user_id).first()
                if not new_categoria:
                    return jsonify({"message": "Nova categoria não encontrada ou não pertence ao usuário."}), 404
                transaction.categoria_id = data['categoria_id']
            else:
                transaction.categoria_id = None
        if 'observacoes' in data:
            transaction.observacoes = data['observacoes']
        if 'data_vencimento' in data:
            try:
                transaction.data_vencimento = datetime.fromisoformat(data['data_vencimento']) if data['data_vencimento'] else None
            except ValueError:
                return jsonify({"message": "Formato de data de vencimento inválido. UseYYYY-MM-DDTHH:MM:SS."}), 400
        if 'entidade' in data:
            transaction.entidade = data['entidade']
        if 'data_pagamento_recebimento' in data:
            try:
                transaction.data_pagamento_recebimento = datetime.fromisoformat(data['data_pagamento_recebimento']) if data['data_pagamento_recebimento'] else None
            except ValueError:
                return jsonify({"message": "Formato de data de pagamento/recebimento inválido. UseYYYY-MM-DDTHH:MM:SS."}), 400
        if 'parcelado' in data:
            transaction.parcelado = data['parcelado']
        if 'numero_parcela' in data:
            transaction.numero_parcela = data['numero_parcela']
        if 'total_parcelas' in data:
            transaction.total_parcelas = data['total_parcelas']
        if 'id_transacao_pai' in data:
            transaction.id_transacao_pai = data['id_transacao_pai']
        if 'status' in data:
            transaction.status = data['status']

        # Recalcular saldo_atual da conta antiga (se a conta mudou)
        if old_conta_id != transaction.conta_id:
            old_conta = db.query(Conta).filter_by(id=old_conta_id).first()
            if old_conta:
                if old_tipo_db == 'RECEITA': # Usar tipo do DB (MAIÚSCULAS) para lógica de saldo
                    old_conta.saldo_atual -= old_valor
                else: # Assumindo que o outro tipo é 'DESPESA'
                    old_conta.saldo_atual += old_valor
                db.add(old_conta)

        # Recalcular saldo_atual da conta atualizada
        current_conta = db.query(Conta).filter_by(id=transaction.conta_id).first()
        if current_conta:
            if old_conta_id == transaction.conta_id:
                # Se a conta não mudou, reverta o valor antigo antes de aplicar o novo
                if old_tipo_db == 'RECEITA':
                    current_conta.saldo_atual -= old_valor
                else:
                    current_conta.saldo_atual += old_valor
            
            if transaction.tipo == 'RECEITA': # Usar tipo do DB (MAIÚSCULAS) para lógica de saldo
                current_conta.saldo_atual += transaction.valor
            else: # Assumindo que o outro tipo é 'DESPESA'
                current_conta.saldo_atual -= transaction.valor
            db.add(current_conta)

        db.commit()
        db.refresh(transaction)
        if old_conta_id != transaction.conta_id and old_conta:
            db.refresh(old_conta)
        if current_conta:
            db.refresh(current_conta)
        return jsonify(transaction.to_dict()), 200
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao atualizar transação. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar transação: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao atualizar a transação."}), 500
    finally:
        db.close()

@transaction_bp.route('/<int:transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        transaction = db.query(Transacao).filter_by(id=transaction_id, user_id=current_user_id).first()
        if not transaction:
            return jsonify({"message": "Transação não encontrada ou não pertence ao usuário."}), 404

        # Reverter o saldo_atual da conta antes de excluir a transação
        conta = db.query(Conta).filter_by(id=transaction.conta_id).first()
        if conta:
            if transaction.tipo == 'RECEITA': # Usar tipo do DB (MAIÚSCULAS) para lógica de saldo
                conta.saldo_atual -= transaction.valor
            else: # Assumindo que o outro tipo é 'DESPESA'
                conta.saldo_atual += transaction.valor
            db.add(conta)

        db.delete(transaction)
        db.commit()
        if conta:
            db.refresh(conta)
        return jsonify({"message": "Transação excluída com sucesso."}), 204
    except Exception as e:
        db.rollback()
        print(f"Erro ao excluir transação: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao excluir a transação."}), 500
    finally:
        db.close()

# --- NOVAS ROTAS PARA IMPORTAÇÃO E EXPORTAÇÃO ---

@transaction_bp.route('/import', methods=['POST'])
@jwt_required()
def import_transactions():
    current_user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({"message": "Nenhum arquivo enviado."}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "Nenhum arquivo selecionado."}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({"message": "Formato de arquivo não suportado. Por favor, envie um arquivo CSV."}), 400

    db = SessionLocal()
    try:
        df = pd.read_csv(io.StringIO(file.stream.read().decode('utf-8')))
        
        imported_count = 0
        errors = []

        user_accounts = {acc.nome: acc.id for acc in db.query(Conta).filter_by(user_id=current_user_id).all()}
        user_categories = {cat.nome: cat.id for cat in db.query(Categoria).filter_by(user_id=current_user_id).all()}

        column_mapping = {
            'Descrição': 'descricao',
            'Valor': 'valor',
            'Data (YYYY-MM-DD)': 'data',
            'Tipo (income/expense)': 'tipo', # Será mapeado para 'RECEITA'/'DESPESA'
            'Nome da Conta': 'conta_nome',
            'Nome da Categoria': 'categoria_nome',
            'Observações': 'observacoes',
            'Data de Vencimento (YYYY-MM-DD)': 'data_vencimento',
            'Entidade': 'entidade',
            'Data de Pagamento/Recebimento (YYYY-MM-DD)': 'data_pagamento_recebimento',
            'Parcelado (TRUE/FALSE)': 'parcelado',
            'Número da Parcela': 'numero_parcela',
            'Total de Parcelas': 'total_parcelas',
            'ID Transação Pai': 'id_transacao_pai',
            'Status': 'status'
        }

        df.rename(columns=column_mapping, inplace=True)

        required_columns = ['descricao', 'valor', 'data', 'tipo', 'conta_nome']
        if not all(col in df.columns for col in required_columns):
            return jsonify({"message": f"Arquivo CSV inválido. As colunas obrigatórias são: {', '.join(required_columns)}."}), 400

        for index, row in df.iterrows():
            try:
                valor = Decimal(str(row['valor']).replace(',', '.'))
                if valor < 0:
                    raise ValueError("Valor não pode ser negativo.")
                
                data_transacao = datetime.fromisoformat(str(row['data']))
                
                conta_id = user_accounts.get(row['conta_nome'])
                if not conta_id:
                    raise ValueError(f"Conta '{row['conta_nome']}' não encontrada ou não pertence ao usuário.")
                
                categoria_id = None
                if 'categoria_nome' in row and pd.notna(row['categoria_nome']):
                    categoria_id = user_categories.get(row['categoria_nome'])
                    if not categoria_id:
                        raise ValueError(f"Categoria '{row['categoria_nome']}' não encontrada ou não pertence ao usuário.")

                tipo_import_frontend = row['tipo'] # Recebe 'income' ou 'expense' do CSV
                # Mapear tipo do CSV para o tipo do DB (MAIÚSCULAS)
                tipo_db_import = TIPO_MAP_FRONTEND_TO_DB.get(tipo_import_frontend)
                if tipo_db_import is None:
                    raise ValueError(f"Tipo de transação inválido: '{tipo_import_frontend}'. Deve ser 'income' ou 'expense'.")

                data_vencimento = datetime.fromisoformat(str(row['data_vencimento'])) if pd.notna(row['data_vencimento']) else None
                data_pagamento_recebimento = datetime.fromisoformat(str(row['data_pagamento_recebimento'])) if pd.notna(row['data_pagamento_recebimento']) else None
                parcelado = str(row['parcelado']).upper() == 'TRUE' if pd.notna(row['parcelado']) else False
                numero_parcela = int(row['numero_parcela']) if pd.notna(row['numero_parcela']) else None
                total_parcelas = int(row['total_parcelas']) if pd.notna(row['total_parcelas']) else None
                id_transacao_pai = int(row['id_transacao_pai']) if pd.notna(row['id_transacao_pai']) else None
                
                new_transaction = Transacao(
                    valor=valor,
                    descricao=row['descricao'],
                    data=data_transacao,
                    tipo=tipo_db_import, # Usar o tipo mapeado para o DB (MAIÚSCULAS)
                    user_id=current_user_id,
                    conta_id=conta_id,
                    categoria_id=categoria_id,
                    observacoes=row.get('observacoes'),
                    data_vencimento=data_vencimento,
                    entidade=row.get('entidade'),
                    data_pagamento_recebimento=data_pagamento_recebimento,
                    parcelado=parcelado,
                    numero_parcela=numero_parcela,
                    total_parcelas=total_parcelas,
                    id_transacao_pai=id_transacao_pai,
                    status=row.get('status')
                )
                db.add(new_transaction)

                conta = db.query(Conta).filter_by(id=conta_id).first()
                if conta:
                    if new_transaction.tipo == 'RECEITA':
                        conta.saldo_atual += new_transaction.valor
                    else: # Assumindo que o outro tipo é 'DESPESA'
                        conta.saldo_atual -= new_transaction.valor
                    db.add(conta)

                imported_count += 1
            except (ValueError, KeyError, InvalidOperation) as e:
                errors.append(f"Linha {index + 2}: {e}. Dados: {row.to_dict()}")
            except Exception as e:
                errors.append(f"Linha {index + 2}: Erro inesperado: {e}. Dados: {row.to_dict()}")

        db.commit()
        
        for acc_id in set(user_accounts.values()):
            db.refresh(db.query(Conta).get(acc_id))

        if errors:
            db.rollback()
            return jsonify({
                "message": f"Importação concluída com {imported_count} transações adicionadas. No entanto, {len(errors)} erros ocorreram.",
                "errors": errors
            }), 207
        
        return jsonify({"message": f"Importação concluída com sucesso! {imported_count} transações adicionadas."}), 201

    except Exception as e:
        db.rollback()
        print(f"Erro geral na importação: {e}")
        return jsonify({"message": f"Ocorreu um erro interno durante a importação: {e}"}), 500
    finally:
        db.close()


@transaction_bp.route('/export', methods=['GET'])
@jwt_required()
def export_transactions():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        transactions = db.query(Transacao).filter_by(user_id=current_user_id).all()
        
        user_accounts = {acc.id: acc.nome for acc in db.query(Conta).filter_by(user_id=current_user_id).all()}
        user_categories = {cat.id: cat.nome for cat in db.query(Categoria).filter_by(user_id=current_user_id).all()}

        data_for_df = []
        for t in transactions:
            # Mapear tipo do DB (MAIÚSCULAS) para o tipo do frontend (minúsculas) para o CSV
            tipo_export = TIPO_MAP_DB_TO_FRONTEND.get(t.tipo)
            if tipo_export is None: # Fallback caso o tipo não esteja no mapeamento (improvável se o DB estiver correto)
                tipo_export = t.tipo # Mantém o valor original se não mapeado

            data_for_df.append({
                'ID': t.id,
                'Descrição': t.descricao,
                'Valor': float(t.valor),
                'Data (YYYY-MM-DD)': t.data.strftime('%Y-%m-%d') if t.data else '',
                'Tipo (income/expense)': tipo_export, # Usa o tipo mapeado para o CSV
                'Nome da Conta': user_accounts.get(t.conta_id, 'N/A'),
                'Nome da Categoria': user_categories.get(t.categoria_id, 'N/A'),
                'Observações': t.observacoes or '',
                'Data de Vencimento (YYYY-MM-DD)': t.data_vencimento.strftime('%Y-%m-%d') if t.data_vencimento else '',
                'Entidade': t.entidade or '',
                'Data de Pagamento/Recebimento (YYYY-MM-DD)': t.data_pagamento_recebimento.strftime('%Y-%m-%d') if t.data_pagamento_recebimento else '',
                'Parcelado (TRUE/FALSE)': 'TRUE' if t.parcelado else 'FALSE',
                'Número da Parcela': t.numero_parcela or '',
                'Total de Parcelas': t.total_parcelas or '',
                'ID Transação Pai': t.id_transacao_pai or '',
                'Status': t.status or '',
                'Criado Em': t.created_at.isoformat() if t.created_at else '',
                'Atualizado Em': t.updated_at.isoformat() if t.updated_at else ''
            })

        df = pd.DataFrame(data_for_df)

        output = io.StringIO()
        df.to_csv(output, index=False, sep=',')
        output.seek(0)

        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'transacoes_exportadas_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )

    except Exception as e:
        print(f"Erro ao exportar transações: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao exportar as transações."}), 500
    finally:
        db.close()
