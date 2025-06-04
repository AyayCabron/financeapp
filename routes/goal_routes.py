# personal_finance_api/routes/goal_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from decimal import Decimal, InvalidOperation

from database.db import SessionLocal
from database.models import MetaFinanceira, User

goal_bp = Blueprint('goals', __name__, url_prefix='/goals')

@goal_bp.route('', methods=['POST'])
@jwt_required()
def create_goal():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    titulo = data.get('titulo')
    descricao = data.get('descricao')
    valor_necessario = data.get('valor_necessario')
    valor_reservado = data.get('valor_reservado', 0.00)
    conta_destino = data.get('conta_destino')
    data_meta_str = data.get('data_meta')

    if not all([titulo, valor_necessario, data_meta_str]):
        return jsonify({"message": "Título, valor necessário e data da meta são obrigatórios."}), 400

    try:
        valor_necessario = Decimal(str(valor_necessario))
        valor_reservado = Decimal(str(valor_reservado))
        if valor_necessario < 0 or valor_reservado < 0:
            return jsonify({"message": "Valores não podem ser negativos."}), 400
        
        data_meta = datetime.fromisoformat(data_meta_str).date()
    except (ValueError, InvalidOperation):
        return jsonify({"message": "Dados de valor ou data inválidos."}), 400
    
    db = SessionLocal()
    try:
        new_goal = MetaFinanceira(
            usuario_id=current_user_id,
            titulo=titulo,
            descricao=descricao,
            valor_necessario=valor_necessario,
            valor_reservado=valor_reservado,
            conta_destino=conta_destino,
            data_meta=data_meta
        )
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        return jsonify(new_goal.to_dict()), 201
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao criar meta financeira. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar meta financeira: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao criar a meta financeira."}), 500
    finally:
        db.close()

@goal_bp.route('', methods=['GET'])
@jwt_required()
def get_goals():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        goals = db.query(MetaFinanceira).filter_by(usuario_id=current_user_id).all()
        return jsonify([goal.to_dict() for goal in goals]), 200
    except Exception as e:
        print(f"Erro ao buscar metas financeiras: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar as metas financeiras."}), 500
    finally:
        db.close()

@goal_bp.route('/<int:goal_id>', methods=['GET'])
@jwt_required()
def get_goal(goal_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        goal = db.query(MetaFinanceira).filter_by(id=goal_id, usuario_id=current_user_id).first()
        if not goal:
            return jsonify({"message": "Meta financeira não encontrada ou não pertence ao usuário."}), 404
        return jsonify(goal.to_dict()), 200
    except Exception as e:
        print(f"Erro ao buscar meta financeira: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar a meta financeira."}), 500
    finally:
        db.close()

@goal_bp.route('/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()

    try:
        goal = db.query(MetaFinanceira).filter_by(id=goal_id, usuario_id=current_user_id).first()
        if not goal:
            return jsonify({"message": "Meta financeira não encontrada ou não pertence ao usuário."}), 404

        titulo = data.get('titulo')
        descricao = data.get('descricao')
        valor_necessario = data.get('valor_necessario')
        valor_reservado = data.get('valor_reservado')
        conta_destino = data.get('conta_destino')
        atingido = data.get('atingido')
        data_meta_str = data.get('data_meta')

        if titulo is not None:
            goal.titulo = titulo
        if descricao is not None:
            goal.descricao = descricao
        if valor_necessario is not None:
            try:
                goal.valor_necessario = Decimal(str(valor_necessario))
                if goal.valor_necessario < 0:
                    return jsonify({"message": "Valor necessário não pode ser negativo."}), 400
            except InvalidOperation:
                return jsonify({"message": "Valor necessário inválido."}), 400
        if valor_reservado is not None:
            try:
                goal.valor_reservado = Decimal(str(valor_reservado))
                if goal.valor_reservado < 0:
                    return jsonify({"message": "Valor reservado não pode ser negativo."}), 400
            except InvalidOperation:
                return jsonify({"message": "Valor reservado inválido."}), 400
        if conta_destino is not None:
            goal.conta_destino = conta_destino
        if atingido is not None:
            goal.atingido = atingido
        if data_meta_str is not None:
            try:
                goal.data_meta = datetime.fromisoformat(data_meta_str).date()
            except ValueError:
                return jsonify({"message": "Formato de data da meta inválido. Use YYYY-MM-DD."}), 400
        elif data_meta_str is None: # Se enviado como None, limpa
            goal.data_meta = None

        db.commit()
        db.refresh(goal)
        return jsonify(goal.to_dict()), 200
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao atualizar meta financeira. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar meta financeira: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao atualizar a meta financeira."}), 500
    finally:
        db.close()

@goal_bp.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        goal = db.query(MetaFinanceira).filter_by(id=goal_id, usuario_id=current_user_id).first()
        if not goal:
            return jsonify({"message": "Meta financeira não encontrada ou não pertence ao usuário."}), 404

        db.delete(goal)
        db.commit()
        return jsonify({"message": "Meta financeira excluída com sucesso."}), 204
    except Exception as e:
        db.rollback()
        print(f"Erro ao excluir meta financeira: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao excluir a meta financeira."}), 500
    finally:
        db.close()
