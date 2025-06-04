# personal_finance_api/routes/shopping_list_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from datetime import datetime
from decimal import Decimal, InvalidOperation

from database.db import SessionLocal
from database.models import ListaDeCompras, ItemDaLista, User

# Importante: O url_prefix deve ser '/shopping-list' para corresponder ao frontend
shopping_list_bp = Blueprint('lists', __name__, url_prefix='/shopping-list')

# --- Rotas para ListaDeCompras ---

@shopping_list_bp.route('', methods=['POST'])
@jwt_required()
def create_shopping_list():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    nome = data.get('nome')
    tipo_lista = data.get('tipo_lista')
    meta_valor = data.get('meta_valor')
    observacoes = data.get('observacoes') 

    if not nome:
        return jsonify({"message": "O nome da lista de compras é obrigatório."}), 400

    if meta_valor is not None:
        try:
            meta_valor = Decimal(str(meta_valor))
            if meta_valor < 0:
                return jsonify({"message": "Meta de valor não pode ser negativa."}), 400
        except InvalidOperation:
            return jsonify({"message": "Meta de valor inválida."}), 400

    db = SessionLocal()
    try:
        new_list = ListaDeCompras(
            usuario_id=current_user_id,
            nome=nome,
            tipo_lista=tipo_lista,
            meta_valor=meta_valor,
            observacoes=observacoes
        )
        db.add(new_list)
        db.commit()
        db.refresh(new_list)
        return jsonify(new_list.to_dict()), 201
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Uma lista com este nome já existe para este usuário."}), 409
    except Exception as e:
        db.rollback()
        print(f"Erro inesperado ao criar lista de compras: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao criar a lista de compras."}), 500
    finally:
        db.close()

@shopping_list_bp.route('', methods=['GET'])
@jwt_required()
def get_shopping_lists():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        # Carrega as listas e seus itens relacionados em uma única consulta
        lists = db.query(ListaDeCompras).options(joinedload(ListaDeCompras.itens)).filter_by(usuario_id=current_user_id).all()
        return jsonify([lst.to_dict() for lst in lists]), 200
    except Exception as e:
        print(f"Erro ao buscar listas de compras: {e}")
        return jsonify({"message": "Ocorreu um erro ao buscar as listas de compras."}), 500
    finally:
        db.close()


@shopping_list_bp.route('/<int:list_id>', methods=['GET'])
@jwt_required()
def get_shopping_list(list_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        shopping_list = db.query(ListaDeCompras).filter_by(id=list_id, usuario_id=current_user_id).first()
        if not shopping_list:
            return jsonify({"message": "Lista de compras não encontrada ou não pertence ao usuário."}), 404
        return jsonify(shopping_list.to_dict()), 200
    except Exception as e:
        print(f"Erro ao buscar lista de compras: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar a lista de compras."}), 500
    finally:
        db.close()


@shopping_list_bp.route('/<int:list_id>', methods=['PUT'])
@jwt_required()
def update_shopping_list(list_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()
    try:
        shopping_list = db.query(ListaDeCompras).filter_by(id=list_id, usuario_id=current_user_id).first()
        if not shopping_list:
            return jsonify({"message": "Lista de compras não encontrada ou não pertence ao usuário."}), 404

        nome = data.get('nome')
        tipo_lista = data.get('tipo_lista')
        meta_valor = data.get('meta_valor')
        observacoes = data.get('observacoes')

        if nome:
            shopping_list.nome = nome
        if tipo_lista:
            shopping_list.tipo_lista = tipo_lista
        if meta_valor is not None:
            try:
                shopping_list.meta_valor = Decimal(str(meta_valor))
                if shopping_list.meta_valor < 0:
                    return jsonify({"message": "Meta de valor não pode ser negativa."}), 400
            except InvalidOperation:
                return jsonify({"message": "Meta de valor inválida."}), 400
        if observacoes is not None: # Permite limpar observacoes se enviado como null/vazio
            shopping_list.observacoes = observacoes
        # else: mantém o valor existente se observacoes não for fornecido

        db.commit()
        db.refresh(shopping_list)
        return jsonify(shopping_list.to_dict()), 200
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao atualizar lista. Verifique os dados fornecidos ou se o nome já existe."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar lista de compras: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao atualizar a lista de compras."}), 500
    finally:
        db.close()


@shopping_list_bp.route('/<int:list_id>', methods=['DELETE'])
@jwt_required()
def delete_shopping_list(list_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        shopping_list = db.query(ListaDeCompras).filter_by(id=list_id, usuario_id=current_user_id).first()
        if not shopping_list:
            return jsonify({"message": "Lista de compras não encontrada ou não pertence ao usuário."}), 404

        db.delete(shopping_list)
        db.commit()
        return jsonify({"message": "Lista de compras excluída com sucesso."}), 204
    except Exception as e:
        db.rollback()
        print(f"Erro ao excluir lista de compras: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao excluir a lista de compras."}), 500
    finally:
        db.close()


# --- Rotas para ItensDaLista ---

@shopping_list_bp.route('/<int:list_id>/items', methods=['POST'])
@jwt_required()
def add_item_to_shopping_list(list_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()
    try:
        # Garante que a lista pertence ao usuário logado
        shopping_list = db.query(ListaDeCompras).filter_by(id=list_id, usuario_id=current_user_id).first()
        if not shopping_list:
            return jsonify({"message": "Lista de compras não encontrada ou não pertence ao usuário."}), 404

        nome = data.get('nome')
        quantidade = data.get('quantidade')
        unidade = data.get('unidade')
        prioridade = data.get('prioridade')
        preco_estimado_data = data.get('preco_estimado') # Nome temporário para evitar conflito
        comprado = data.get('comprado', False)
        observacoes = data.get('observacoes')
        categoria = data.get('categoria') # NOVO CAMPO
        preco_real_data = data.get('preco_real') # NOVO CAMPO
        data_compra_str = data.get('data_compra') # NOVO CAMPO

        if not nome or quantidade is None:
            return jsonify({"message": "Nome e quantidade são obrigatórios para o item."}), 400

        if not isinstance(quantidade, (int, float)) or quantidade <= 0:
            return jsonify({"message": "Quantidade deve ser um número positivo."}), 400

        # Conversão de preco_estimado para Decimal
        preco_estimado = None
        if preco_estimado_data is not None:
            try:
                preco_estimado = Decimal(str(preco_estimado_data))
                if preco_estimado < 0:
                    return jsonify({"message": "Preço estimado não pode ser negativo."}), 400
            except InvalidOperation:
                return jsonify({"message": "Preço estimado inválido."}), 400

        # Conversão de preco_real para Decimal
        preco_real = None
        if preco_real_data is not None:
            try:
                preco_real = Decimal(str(preco_real_data))
                if preco_real < 0:
                    return jsonify({"message": "Preço real não pode ser negativo."}), 400
            except InvalidOperation:
                return jsonify({"message": "Preço real inválido."}), 400

        # Conversão de data_compra de string ISO para datetime
        data_compra = None
        if data_compra_str:
            try:
                # O .replace('Z', '+00:00') é para garantir compatibilidade com diferentes formatos ISO
                data_compra = datetime.fromisoformat(data_compra_str.replace('Z', '+00:00'))
            except ValueError:
                print(f"Formato de data inválido para data_compra: {data_compra_str}")
                return jsonify({"message": "Formato de data de compra inválido."}), 400

        new_item = ItemDaLista(
            lista_id=list_id,
            nome=nome,
            quantidade=quantidade,
            unidade=unidade,
            prioridade=prioridade,
            preco_estimado=preco_estimado,
            comprado=comprado,
            observacoes=observacoes,
            categoria=categoria, # ATRIBUÍDO
            preco_real=preco_real, # ATRIBUÍDO
            data_compra=data_compra # ATRIBUÍDO
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return jsonify(new_item.to_dict()), 201
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao adicionar item. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro inesperado ao adicionar item à lista de compras: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao adicionar item à lista de compras."}), 500
    finally:
        db.close()


@shopping_list_bp.route('/<int:list_id>/items', methods=['GET'])
@jwt_required()
def get_shopping_list_items(list_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        # Garante que a lista pertence ao usuário logado
        shopping_list = db.query(ListaDeCompras).filter_by(id=list_id, usuario_id=current_user_id).first()
        if not shopping_list:
            return jsonify({"message": "Lista de compras não encontrada ou não pertence ao usuário."}), 404

        items = db.query(ItemDaLista).filter_by(lista_id=list_id).all()
        return jsonify([item.to_dict() for item in items]), 200
    except Exception as e:
        print(f"Erro ao buscar itens da lista de compras: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao buscar itens da lista de compras."}), 500
    finally:
        db.close()


@shopping_list_bp.route('/items/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_shopping_list_item(item_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    db = SessionLocal()
    try:
        # Garante que o item pertence a uma lista do usuário logado
        item = db.query(ItemDaLista).filter_by(id=item_id).join(ListaDeCompras).filter(ListaDeCompras.usuario_id == current_user_id).first()
        if not item:
            return jsonify({"message": "Item não encontrado ou não pertence a uma lista do usuário."}), 404

        # Atualiza apenas os campos fornecidos no JSON
        item.nome = data.get('nome', item.nome)
        
        if 'quantidade' in data and data['quantidade'] is not None:
            if not isinstance(data['quantidade'], (int, float)) or data['quantidade'] <= 0:
                return jsonify({"message": "Quantidade deve ser um número positivo."}), 400
            item.quantidade = data['quantidade']
        # else: mantém o valor existente se 'quantidade' não for fornecido

        item.unidade = data.get('unidade', item.unidade)
        item.prioridade = data.get('prioridade', item.prioridade)
        
        if 'preco_estimado' in data: # Use 'in data' para permitir limpar (enviar None)
            if data['preco_estimado'] is not None:
                try:
                    item.preco_estimado = Decimal(str(data['preco_estimado']))
                    if item.preco_estimado < 0:
                        return jsonify({"message": "Preço estimado não pode ser negativo."}), 400
                except InvalidOperation:
                    return jsonify({"message": "Preço estimado inválido."}), 400
            else:
                item.preco_estimado = None
        # else: mantém o valor existente

        item.comprado = data.get('comprado', item.comprado)
        
        # 'observacoes' deve ser tratado para aceitar None se o frontend enviar vazio
        if 'observacoes' in data:
            item.observacoes = data['observacoes'] if data['observacoes'] is not None else None

        # Atualização dos novos campos
        if 'categoria' in data:
            item.categoria = data['categoria'] if data['categoria'] is not None else None
        
        if 'preco_real' in data:
            if data['preco_real'] is not None:
                try:
                    item.preco_real = Decimal(str(data['preco_real']))
                    if item.preco_real < 0:
                        return jsonify({"message": "Preço real não pode ser negativo."}), 400
                except InvalidOperation:
                    return jsonify({"message": "Preço real inválido."}), 400
            else:
                item.preco_real = None

        data_compra_str = data.get('data_compra')
        if data_compra_str is not None: # Se a chave data_compra foi enviada
            if data_compra_str: # Se a string não for vazia, tente converter
                try:
                    item.data_compra = datetime.fromisoformat(data_compra_str.replace('Z', '+00:00'))
                except ValueError:
                    print(f"Formato de data inválido para data_compra: {data_compra_str}")
                    return jsonify({"message": "Formato de data de compra inválido."}), 400
            else: # Se a string for vazia (''), defina como None no DB
                item.data_compra = None
        # else: Não faça nada se 'data_compra' não estiver no 'data' (mantém o valor existente)


        db.commit()
        db.refresh(item)
        return jsonify(item.to_dict()), 200
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Erro ao atualizar item da lista. Verifique os dados fornecidos."}), 400
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar item da lista de compras: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao atualizar item da lista de compras."}), 500
    finally:
        db.close()


@shopping_list_bp.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_shopping_list_item(item_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        # Garante que o item pertence a uma lista do usuário logado
        item = db.query(ItemDaLista).filter_by(id=item_id).join(ListaDeCompras).filter(ListaDeCompras.usuario_id == current_user_id).first()
        if not item:
            return jsonify({"message": "Item não encontrado ou não pertence a uma lista do usuário."}), 404

        db.delete(item)
        db.commit()
        return jsonify({"message": "Item da lista de compras excluído com sucesso."}), 204
    except Exception as e:
        db.rollback()
        print(f"Erro ao excluir item da lista de compras: {e}")
        return jsonify({"message": "Ocorreu um erro interno ao excluir o item da lista de compras."}), 500
    finally:
        db.close()