from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from decimal import Decimal, InvalidOperation
from datetime import datetime

from database.db import SessionLocal
from database.models import Conta, User, Transacao 

agenda_account_bp = Blueprint('agenda_accounts', __name__, url_prefix='/agenda/accounts')

@agenda_account_bp.route('', methods=['POST'])
@jwt_required()
def create_agenda_account():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    nome = data.get('nome')
    saldo_inicial_str = data.get('saldo_inicial')
    tipo = data.get('tipo')
    instituicao = data.get('instituicao')
    observacoes = data.get('observacoes')

    if not nome or saldo_inicial_str is None or not tipo:
        return jsonify({"message": "Nome, saldo inicial e tipo da conta são obrigatórios."}), 400

    try:
        saldo_inicial = Decimal(str(saldo_inicial_str))
        if saldo_inicial < 0 and tipo != 'Crédito':
             return jsonify({"message": "Saldo inicial não pode ser negativo para este tipo de conta."}), 400
    except InvalidOperation:
        return jsonify({"message": "Valor de saldo inicial inválido."}), 400

    db = SessionLocal()
    try:
        existing_account = db.query(Conta).filter_by(usuario_id=current_user_id, nome=nome).first()
        if existing_account:
            return jsonify({"message": "Já existe uma conta com este nome para este usuário."}), 409

        new_account = Conta(
            user_id=current_user_id,
            nome=nome,
            tipo=tipo,
            saldo_inicial=saldo_inicial,
            saldo_atual=saldo_inicial,
            instituicao=instituicao,
            observacoes=observacoes
        )

        db.add(new_account)
        db.commit()
        db.refresh(new_account)
        return jsonify(new_account.to_dict()), 201
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao criar conta da agenda: {e}")
        return jsonify({"message": "Erro: Já existe uma conta com este nome."}), 409
    except Exception as e:
        db.rollback()
        print(f"Ocorreu um erro inesperado ao criar conta da agenda: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

@agenda_account_bp.route('', methods=['GET'])
@jwt_required()
def get_agenda_accounts():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        contas = db.query(Conta).filter_by(user_id=current_user_id).all()
        return jsonify([conta.to_dict() for conta in contas]), 200
    except Exception as e:
        print(f"Ocorreu um erro inesperado ao buscar contas da agenda: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

@agenda_account_bp.route('/<int:account_id>', methods=['GET'])
@jwt_required()
def get_agenda_account(account_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        conta = db.query(Conta).filter_by(id=account_id, user_id=current_user_id).first()
        if not conta:
            return jsonify({"message": "Conta não encontrada ou não pertence ao usuário logado."}), 404
        return jsonify(conta.to_dict()), 200
    except Exception as e:
        print(f"Ocorreu um erro inesperado ao buscar conta da agenda: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

@agenda_account_bp.route('/<int:account_id>', methods=['PUT'])
@jwt_required()
def update_agenda_account(account_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()
    try:
        conta = db.query(Conta).filter_by(id=account_id, user_id=current_user_id).first()
        if not conta:
            return jsonify({"message": "Conta não encontrada ou não pertence ao usuário logado."}), 404

        nome = data.get('nome', conta.nome)
        tipo = data.get('tipo', conta.tipo)
        instituicao = data.get('instituicao', conta.instituicao)
        observacoes = data.get('observacoes', conta.observacoes)

        if 'saldo_inicial' in data and data['saldo_inicial'] is not None:
            try:
                new_saldo_inicial = Decimal(str(data['saldo_inicial']))
                if new_saldo_inicial < 0 and tipo != 'Crédito':
                    return jsonify({"message": "Novo saldo inicial não pode ser negativo para este tipo de conta."}), 400
                conta.saldo_inicial = new_saldo_inicial
            except InvalidOperation:
                return jsonify({"message": "Valor de saldo inicial inválido."}), 400

        conta.nome = nome
        conta.tipo = tipo
        conta.instituicao = instituicao
        conta.observacoes = observacoes

        db.commit()
        db.refresh(conta)
        return jsonify(conta.to_dict()), 200
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao atualizar conta da agenda: {e}")
        return jsonify({"message": "Erro: Uma conta com este nome já existe."}), 409
    except Exception as e:
        db.rollback()
        print(f"Ocorreu um erro inesperado ao atualizar conta da agenda: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

@agenda_account_bp.route('/<int:account_id>', methods=['DELETE'])
@jwt_required()
def delete_agenda_account(account_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        conta = db.query(Conta).filter_by(id=account_id, user_id=current_user_id).first()
        if not conta:
            return jsonify({"message": "Conta não encontrada ou não pertence ao usuário logado."}), 404

        transacoes_count = db.query(Transacao).filter_by(conta_id=account_id).count()
        if transacoes_count > 0:
            return jsonify({"message": "Não é possível excluir a conta: existem transações associadas a ela."}), 409

        db.delete(conta)
        db.commit()
        return jsonify({"message": "Conta excluída com sucesso."}), 204
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao deletar conta da agenda: {e}")
        return jsonify({"message": "Erro: Conta não pôde ser excluída devido a uma restrição do banco de dados (ex: transações associadas). Por favor, verifique se não há outras dependências."}), 409
    except Exception as e:
        db.rollback()
        print(f"Ocorreu um erro inesperado ao deletar conta da agenda: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()
