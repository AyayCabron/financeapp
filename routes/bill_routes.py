# personal_finance_api/routes/bill_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from decimal import Decimal, InvalidOperation

from database.db import SessionLocal
from database.models import ContaAPagar, User

bill_bp = Blueprint('bills', __name__, url_prefix='/bills')

@bill_bp.route('', methods=['POST'])
@jwt_required()
def create_bill():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    descricao = data.get('descricao')
    valor_total = data.get('valor_total')
    numero_parcelas = data.get('numero_parcelas')
    valor_parcela = data.get('valor_parcela')
    data_inicio_str = data.get('data_inicio')
    data_fim_str = data.get('data_fim')
    recorrente = data.get('recorrente', False)

    if not all([descricao, valor_total, numero_parcelas, valor_parcela, data_inicio_str]):
        return jsonify({"message": "Descrição, valor total, número de parcelas, valor da parcela e data de início são obrigatórios."}), 400

    try:
        valor_total = Decimal(str(valor_total))
        valor_parcela = Decimal(str(valor_parcela))
        if valor_total < 0 or valor_parcela < 0:
            return jsonify({"message": "Valores não podem ser negativos."}), 400
        
        data_inicio = datetime.fromisoformat(data_inicio_str).date()
        data_fim = datetime.fromisoformat(data_fim_str).date() if data_fim_str else None
    except (ValueError, InvalidOperation):
        return jsonify({"message": "Dados de valor ou data inválidos."}), 400
    
    db = SessionLocal()
    try:
        new_bill = ContaAPagar(
            usuario_id=current_user_id,
            descricao=descricao,
            valor_total=valor_total,
            numero_parcelas=numero_parcelas,
            valor_parcela=valor_parcela,
            data_inicio=data_inicio,
            data_fim=data_fim,
            recorrente=recorrente
        )
        db.add(new_bill)
        db.commit()
        db.refresh(new_bill)
        return jsonify(new_bill.to_dict()), 201
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao criar conta a pagar. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar conta a pagar: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao criar a conta a pagar."}), 500
    finally:
        db.close()

@bill_bp.route('', methods=['GET'])
@jwt_required()
def get_bills():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        bills = db.query(ContaAPagar).filter_by(usuario_id=current_user_id).all()
        return jsonify([bill.to_dict() for bill in bills]), 200
    except Exception as e:
        print(f"Erro ao buscar contas a pagar: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar as contas a pagar."}), 500
    finally:
        db.close()

@bill_bp.route('/<int:bill_id>', methods=['GET'])
@jwt_required()
def get_bill(bill_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        bill = db.query(ContaAPagar).filter_by(id=bill_id, usuario_id=current_user_id).first()
        if not bill:
            return jsonify({"message": "Conta a pagar não encontrada ou não pertence ao usuário."}), 404
        return jsonify(bill.to_dict()), 200
    except Exception as e:
        print(f"Erro ao buscar conta a pagar: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar a conta a pagar."}), 500
    finally:
        db.close()

@bill_bp.route('/<int:bill_id>', methods=['PUT'])
@jwt_required()
def update_bill(bill_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()

    try:
        bill = db.query(ContaAPagar).filter_by(id=bill_id, usuario_id=current_user_id).first()
        if not bill:
            return jsonify({"message": "Conta a pagar não encontrada ou não pertence ao usuário."}), 404

        descricao = data.get('descricao')
        valor_total = data.get('valor_total')
        numero_parcelas = data.get('numero_parcelas')
        valor_parcela = data.get('valor_parcela')
        data_inicio_str = data.get('data_inicio')
        data_fim_str = data.get('data_fim')
        recorrente = data.get('recorrente')

        if descricao is not None:
            bill.descricao = descricao
        if valor_total is not None:
            try:
                bill.valor_total = Decimal(str(valor_total))
                if bill.valor_total < 0:
                    return jsonify({"message": "Valor total não pode ser negativo."}), 400
            except InvalidOperation:
                return jsonify({"message": "Valor total inválido."}), 400
        if numero_parcelas is not None:
            bill.numero_parcelas = numero_parcelas
        if valor_parcela is not None:
            try:
                bill.valor_parcela = Decimal(str(valor_parcela))
                if bill.valor_parcela < 0:
                    return jsonify({"message": "Valor da parcela não pode ser negativo."}), 400
            except InvalidOperation:
                return jsonify({"message": "Valor da parcela inválido."}), 400
        if data_inicio_str is not None:
            try:
                bill.data_inicio = datetime.fromisoformat(data_inicio_str).date()
            except ValueError:
                return jsonify({"message": "Formato de data de início inválido. Use YYYY-MM-DD."}), 400
        if data_fim_str is not None:
            try:
                bill.data_fim = datetime.fromisoformat(data_fim_str).date()
            except ValueError:
                return jsonify({"message": "Formato de data de fim inválido. Use YYYY-MM-DD."}), 400
        elif data_fim_str is None: # Se enviado como None, limpa
            bill.data_fim = None
        
        if recorrente is not None:
            bill.recorrente = recorrente

        db.commit()
        db.refresh(bill)
        return jsonify(bill.to_dict()), 200
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao atualizar conta a pagar. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar conta a pagar: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao atualizar a conta a pagar."}), 500
    finally:
        db.close()

@bill_bp.route('/<int:bill_id>', methods=['DELETE'])
@jwt_required()
def delete_bill(bill_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        bill = db.query(ContaAPagar).filter_by(id=bill_id, usuario_id=current_user_id).first()
        if not bill:
            return jsonify({"message": "Conta a pagar não encontrada ou não pertence ao usuário."}), 404

        db.delete(bill)
        db.commit()
        return jsonify({"message": "Conta a pagar excluída com sucesso."}), 204
    except Exception as e:
        db.rollback()
        print(f"Erro ao excluir conta a pagar: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao excluir a conta a pagar."}), 500
    finally:
        db.close()
