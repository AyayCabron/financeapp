# personal_finance_api/routes/inventory_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from decimal import Decimal, InvalidOperation

from database.db import SessionLocal
from database.models import EstoquePessoal, User

inventory_bp = Blueprint('inventory', __name__, url_prefix='/inventory')

@inventory_bp.route('', methods=['POST'])
@jwt_required()
def create_inventory_item():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    nome = data.get('nome')
    categoria = data.get('categoria')
    quantidade = data.get('quantidade')
    unidade = data.get('unidade')
    prioridade = data.get('prioridade')
    tipo_lista = data.get('tipo_lista')
    data_necessaria_str = data.get('data_necessaria')
    meta_valor = data.get('meta_valor')
    observacoes = data.get('observacoes')

    if not all([nome, quantidade, unidade]):
        return jsonify({"message": "Nome, quantidade e unidade são obrigatórios para um item de estoque."}), 400

    try:
        if quantidade <= 0:
            return jsonify({"message": "Quantidade deve ser um número positivo."}), 400
        
        data_necessaria = datetime.fromisoformat(data_necessaria_str).date() if data_necessaria_str else None
        
        if meta_valor is not None:
            meta_valor = Decimal(str(meta_valor))
            if meta_valor < 0:
                return jsonify({"message": "Meta de valor não pode ser negativa."}), 400
    except (ValueError, InvalidOperation):
        return jsonify({"message": "Dados de quantidade, valor ou data inválidos."}), 400
    
    db = SessionLocal()
    try:
        new_item = EstoquePessoal(
            usuario_id=current_user_id,
            nome=nome,
            categoria=categoria,
            quantidade=quantidade,
            unidade=unidade,
            prioridade=prioridade,
            tipo_lista=tipo_lista,
            data_necessaria=data_necessaria,
            meta_valor=meta_valor,
            observacoes=observacoes
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return jsonify(new_item.to_dict()), 201
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao criar item de estoque. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar item de estoque: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao criar o item de estoque."}), 500
    finally:
        db.close()

@inventory_bp.route('', methods=['GET'])
@jwt_required()
def get_inventory_items():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        items = db.query(EstoquePessoal).filter_by(usuario_id=current_user_id).all()
        return jsonify([item.to_dict() for item in items]), 200
    except Exception as e:
        print(f"Erro ao buscar itens de estoque: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar os itens de estoque."}), 500
    finally:
        db.close()

@inventory_bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_inventory_item(item_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        item = db.query(EstoquePessoal).filter_by(id=item_id, usuario_id=current_user_id).first()
        if not item:
            return jsonify({"message": "Item de estoque não encontrado ou não pertence ao usuário."}), 404
        return jsonify(item.to_dict()), 200
    except Exception as e:
        print(f"Erro ao buscar item de estoque: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar o item de estoque."}), 500
    finally:
        db.close()

@inventory_bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_inventory_item(item_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()

    try:
        item = db.query(EstoquePessoal).filter_by(id=item_id, usuario_id=current_user_id).first()
        if not item:
            return jsonify({"message": "Item de estoque não encontrado ou não pertence ao usuário."}), 404

        nome = data.get('nome')
        categoria = data.get('categoria')
        quantidade = data.get('quantidade')
        unidade = data.get('unidade')
        prioridade = data.get('prioridade')
        tipo_lista = data.get('tipo_lista')
        data_necessaria_str = data.get('data_necessaria')
        meta_valor = data.get('meta_valor')
        comprado = data.get('comprado')
        observacoes = data.get('observacoes')

        if nome is not None:
            item.nome = nome
        if categoria is not None:
            item.categoria = categoria
        if quantidade is not None:
            if quantidade <= 0:
                return jsonify({"message": "Quantidade deve ser um número positivo."}), 400
            item.quantidade = quantidade
        if unidade is not None:
            item.unidade = unidade
        if prioridade is not None:
            item.prioridade = prioridade
        if tipo_lista is not None:
            item.tipo_lista = tipo_lista
        if data_necessaria_str is not None:
            try:
                item.data_necessaria = datetime.fromisoformat(data_necessaria_str).date()
            except ValueError:
                return jsonify({"message": "Formato de data necessária inválido. Use YYYY-MM-DD."}), 400
        elif data_necessaria_str is None: # Se enviado como None, limpa
            item.data_necessaria = None
        
        if meta_valor is not None:
            try:
                item.meta_valor = Decimal(str(meta_valor))
                if item.meta_valor < 0:
                    return jsonify({"message": "Meta de valor não pode ser negativa."}), 400
            except InvalidOperation:
                return jsonify({"message": "Meta de valor inválida."}), 400
        elif meta_valor is None: # Se enviado como None, limpa
            item.meta_valor = None
        
        if comprado is not None:
            item.comprado = comprado
        if observacoes is not None:
            item.observacoes = observacoes
        elif observacoes is None: # Se enviado como None, limpa
            item.observacoes = None

        db.commit()
        db.refresh(item)
        return jsonify(item.to_dict()), 200
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao atualizar item de estoque. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar item de estoque: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao atualizar o item de estoque."}), 500
    finally:
        db.close()

@inventory_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_inventory_item(item_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        item = db.query(EstoquePessoal).filter_by(id=item_id, usuario_id=current_user_id).first()
        if not item:
            return jsonify({"message": "Item de estoque não encontrado ou não pertence ao usuário."}), 404

        db.delete(item)
        db.commit()
        return jsonify({"message": "Item de estoque excluído com sucesso."}), 204
    except Exception as e:
        db.rollback()
        print(f"Erro ao excluir item de estoque: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao excluir o item de estoque."}), 500
    finally:
        db.close()
