# personal_finance_api/routes/category_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database.db import SessionLocal
from database.models import Categoria, User, Transacao
from sqlalchemy.exc import IntegrityError

category_bp = Blueprint('categories', __name__, url_prefix='/categories')

# --- Rota para Criar uma Nova Categoria (POST /categories) ---
@category_bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    nome = data.get('nome')
    tipo = data.get('tipo') # 'income' ou 'expense'

    if not nome or not tipo:
        return jsonify({"message": "Nome da categoria e tipo são obrigatórios."}), 400

    if tipo not in ['income', 'expense']:
        return jsonify({"message": "O tipo da categoria deve ser 'income' ou 'expense'."}), 400

    db = SessionLocal()
    try:
        existing_category = db.query(Categoria).filter_by(user_id=current_user_id, nome=nome).first()
        if existing_category:
            return jsonify({"message": "Já existe uma categoria com este nome para este usuário."}), 409

        new_category = Categoria(user_id=current_user_id, nome=nome, tipo=tipo)
        db.add(new_category)
        db.commit()
        db.refresh(new_category)
        return jsonify(new_category.to_dict()), 201
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao criar categoria: {e}")
        return jsonify({"message": "Erro de integridade ao criar categoria. Verifique os dados."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar categoria: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

# --- Rota para Obter Todas as Categorias do Usuário (GET /categories) ---
@category_bp.route('', methods=['GET'])
@jwt_required()
def get_all_categories():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        categorias = db.query(Categoria).filter_by(user_id=current_user_id).all()
        return jsonify([categoria.to_dict() for categoria in categorias]), 200
    except Exception as e:
        print(f"Erro ao obter categorias: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao obter as categorias."}), 500
    finally:
        db.close()

# --- Rota para Obter uma Categoria por ID (GET /categories/<int:category_id>) ---
@category_bp.route('/<int:category_id>', methods=['GET'])
@jwt_required()
def get_category_by_id(category_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        categoria = db.query(Categoria).filter_by(id=category_id, user_id=current_user_id).first()
        if not categoria:
            return jsonify({"message": "Categoria não encontrada ou não pertence ao usuário atual."}), 404
        return jsonify(categoria.to_dict()), 200
    except Exception as e:
        print(f"Erro ao obter categoria: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao obter a categoria."}), 500
    finally:
        db.close()

# --- Rota para Atualizar uma Categoria (PUT /categories/<int:category_id>) ---
@category_bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()
    try:
        categoria = db.query(Categoria).filter_by(id=category_id, user_id=current_user_id).first()
        if not categoria:
            return jsonify({"message": "Categoria não encontrada ou não pertence ao usuário atual."}), 404

        nome = data.get('nome')
        tipo = data.get('tipo')

        if nome:
            # Verifica se já existe outra categoria com o mesmo nome para o mesmo usuário
            existing_category_with_name = db.query(Categoria).filter(
                Categoria.user_id == current_user_id,
                Categoria.nome == nome,
                Categoria.id != category_id
            ).first()
            if existing_category_with_name:
                return jsonify({"message": "Já existe outra categoria com este nome para este usuário."}), 409
            categoria.nome = nome
        if tipo:
            if tipo not in ['income', 'expense']:
                return jsonify({"message": "O tipo da categoria deve ser 'income' ou 'expense'."}), 400
            categoria.tipo = tipo

        db.commit()
        db.refresh(categoria)
        return jsonify(categoria.to_dict()), 200
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao atualizar categoria: {e}")
        return jsonify({"message": "Erro de integridade ao atualizar categoria. Verifique os dados."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar categoria: {e}")
        return jsonify({"message": f"Ocorreu um erro interno: {str(e)}"}), 500
    finally:
        db.close()

# --- Rota para Deletar uma Categoria (DELETE /categories/<int:category_id>) ---
@category_bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        categoria = db.query(Categoria).filter_by(id=category_id, user_id=current_user_id).first()
        if not categoria:
            return jsonify({"message": "Categoria não encontrada ou não pertence ao usuário atual."}), 404

        # Verifica se existem transações associadas a esta categoria
        transactions_count = db.query(Transacao).filter_by(categoria_id=category_id).count()
        if transactions_count > 0:
            return jsonify({"message": "Não é possível excluir a categoria: Existem transações associadas a ela."}), 409

        db.delete(categoria)
        db.commit()
        return jsonify({"message": "Categoria excluída com sucesso."}), 204
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError ao deletar categoria: {e}")
        return jsonify({"message": "Erro: Categoria não pôde ser excluída devido a uma restrição do banco de dados (ex: transações associadas)."}), 409
    except Exception as e:
        db.rollback()
        print(f"Erro ao deletar categoria: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao deletar a categoria."}), 500
    finally:
        db.close()