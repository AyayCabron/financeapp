# personal_finance_api/routes/account_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database.db import SessionLocal
from database.models import Conta, User, Transacao # Certifique-se de que Transacao está importado
from sqlalchemy.exc import IntegrityError
from decimal import Decimal, InvalidOperation
from datetime import datetime # Adicionado para uso de data/hora

account_bp = Blueprint('accounts', __name__, url_prefix='/accounts')

# --- Rota para Criar uma Nova Conta (POST /accounts) ---
@account_bp.route('', methods=['POST'])
@jwt_required()
def create_account():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    nome = data.get('nome')
    saldo_inicial_str = data.get('saldo_inicial') # AGORA RECEBE saldo_inicial
    tipo = data.get('tipo')
    instituicao = data.get('instituicao')
    observacoes = data.get('observacoes')

    if not nome or saldo_inicial_str is None or not tipo:
        return jsonify({"message": "Nome, saldo inicial e tipo são obrigatórios."}), 400

    try:
        saldo_inicial = Decimal(str(saldo_inicial_str))
        if saldo_inicial < 0:
            return jsonify({"message": "Saldo inicial não pode ser negativo."}), 400
    except InvalidOperation:
        return jsonify({"message": "Valor de saldo inicial inválido."}), 400

    db = SessionLocal()
    try:
        existing_account = db.query(Conta).filter_by(user_id=current_user_id, nome=nome).first()
        if existing_account:
            return jsonify({"message": "Já existe uma conta com este nome para este usuário."}), 409

        # saldo_atual é inicializado com o mesmo valor de saldo_inicial
        new_account = Conta(
            nome=nome,
            saldo_inicial=saldo_inicial,
            saldo_atual=saldo_inicial, # saldo_atual começa com o mesmo valor de saldo_inicial
            tipo=tipo,
            instituicao=instituicao,
            observacoes=observacoes,
            user_id=current_user_id
        )
        db.add(new_account)
        db.commit()
        db.refresh(new_account) # Atualiza o objeto para incluir o ID e outros campos gerados

        return jsonify({
            "id": new_account.id,
            "nome": new_account.nome,
            "saldo_inicial": str(new_account.saldo_inicial), # Converter para string para JSON
            "saldo_atual": str(new_account.saldo_atual),     # Converter para string para JSON
            "tipo": new_account.tipo,
            "instituicao": new_account.instituicao,
            "observacoes": new_account.observacoes,
            "user_id": new_account.user_id,
            "created_at": new_account.created_at.isoformat(),
            "updated_at": new_account.updated_at.isoformat()
        }), 201

    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao criar conta: {e}")
        return jsonify({"message": "Erro ao criar conta. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro inesperado ao criar conta: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

# --- Rota para Listar Todas as Contas do Usuário (GET /accounts) ---
@account_bp.route('', methods=['GET'])
@jwt_required()
def get_accounts():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        accounts = db.query(Conta).filter_by(user_id=current_user_id).all()
        return jsonify([
            {
                "id": account.id,
                "nome": account.nome,
                "saldo_inicial": str(account.saldo_inicial), # Converter para string
                "saldo_atual": str(account.saldo_atual),     # Converter para string
                "tipo": account.tipo,
                "instituicao": account.instituicao,
                "observacoes": account.observacoes,
                "user_id": account.user_id,
                "created_at": account.created_at.isoformat(),
                "updated_at": account.updated_at.isoformat()
            } for account in accounts
        ]), 200
    except Exception as e:
        print(f"Erro ao buscar contas: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar contas."}), 500
    finally:
        db.close()

# --- Rota para Obter uma Conta Específica (GET /accounts/<int:account_id>) ---
@account_bp.route('/<int:account_id>', methods=['GET'])
@jwt_required()
def get_account(account_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        account = db.query(Conta).filter_by(id=account_id, user_id=current_user_id).first()
        if not account:
            return jsonify({"message": "Conta não encontrada ou não pertence ao usuário logado."}), 404

        return jsonify({
            "id": account.id,
            "nome": account.nome,
            "saldo_inicial": str(account.saldo_inicial), # Converter para string
            "saldo_atual": str(account.saldo_atual),     # Converter para string
            "tipo": account.tipo,
            "instituicao": account.instituicao,
            "observacoes": account.observacoes,
            "user_id": account.user_id,
            "created_at": account.created_at.isoformat(),
            "updated_at": account.updated_at.isoformat()
        }), 200
    except Exception as e:
        print(f"Erro ao buscar conta específica: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar a conta."}), 500
    finally:
        db.close()

# --- Rota para Atualizar Conta (PUT /accounts/<int:account_id>) ---
@account_bp.route('/<int:account_id>', methods=['PUT'])
@jwt_required()
def update_account(account_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()
    try:
        conta = db.query(Conta).filter_by(id=account_id, user_id=current_user_id).first()
        if not conta:
            return jsonify({"message": "Conta não encontrada ou não pertence ao usuário logado."}), 404

        # Atualiza apenas os campos que foram fornecidos na requisição
        if 'nome' in data:
            conta.nome = data['nome']
        if 'tipo' in data:
            conta.tipo = data['tipo']
        if 'instituicao' in data:
            conta.instituicao = data['instituicao']
        if 'observacoes' in data:
            conta.observacoes = data['observacoes']

        # Permite atualizar saldo_inicial diretamente (cuidado ao usar, idealmente saldo_atual é calculado)
        if 'saldo_inicial' in data:
            try:
                new_saldo_inicial = Decimal(str(data['saldo_inicial']))
                if new_saldo_inicial < 0:
                    return jsonify({"message": "Saldo inicial não pode ser negativo."}), 400
                conta.saldo_inicial = new_saldo_inicial
            except InvalidOperation:
                return jsonify({"message": "Valor de saldo inicial inválido."}), 400

        # O saldo_atual geralmente deve ser manipulado pelas transações, mas
        # se houver uma necessidade específica de ajuste manual, pode ser permitido aqui.
        # Caso contrário, remova esta parte.
        if 'saldo_atual' in data:
            try:
                new_saldo_atual = Decimal(str(data['saldo_atual']))
                if new_saldo_atual < 0:
                    return jsonify({"message": "Saldo atual não pode ser negativo."}), 400
                conta.saldo_atual = new_saldo_atual
            except InvalidOperation:
                return jsonify({"message": "Valor de saldo atual inválido."}), 400


        conta.updated_at = datetime.now() # Atualiza a data de atualização

        db.add(conta)
        db.commit()
        db.refresh(conta)

        return jsonify({
            "id": conta.id,
            "nome": conta.nome,
            "saldo_inicial": str(conta.saldo_inicial),
            "saldo_atual": str(conta.saldo_atual),
            "tipo": conta.tipo,
            "instituicao": conta.instituicao,
            "observacoes": conta.observacoes,
            "user_id": conta.user_id,
            "created_at": conta.created_at.isoformat(),
            "updated_at": conta.updated_at.isoformat()
        }), 200
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao atualizar conta: {e}")
        return jsonify({"message": "Erro ao atualizar conta. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro inesperado ao atualizar conta: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

# --- Rota para Excluir Conta (DELETE /accounts/<int:account_id>) ---
@account_bp.route('/<int:account_id>', methods=['DELETE'])
@jwt_required()
def delete_account(account_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        conta = db.query(Conta).filter_by(id=account_id, user_id=current_user_id).first()
        if not conta:
            return jsonify({"message": "Conta não encontrada ou não pertence ao usuário logado."}), 404

        # Verifica se existem transações associadas a esta conta
        # Ajuste: se a conta for excluída, as transações associadas devem ser tratadas (ex: setar conta_id para NULL, excluir, etc.)
        # Por enquanto, mantemos a restrição se houver transações.
        transacoes_count = db.query(Transacao).filter_by(conta_id=account_id).count()
        if transacoes_count > 0:
            return jsonify({"message": "Não é possível excluir a conta: existem transações associadas a ela."}), 409

        db.delete(conta)
        db.commit()
        return jsonify({"message": "Conta excluída com sucesso."}), 204
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao deletar conta: {e}")
        return jsonify({"message": "Erro: Conta não pôde ser excluída devido a uma restrição do banco de dados (ex: transações associadas). Por favor, verifique se não há outras dependências."}), 409
    except Exception as e:
        db.rollback()
        print(f"Erro inesperado ao deletar conta: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()