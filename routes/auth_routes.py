# personal_finance_api/routes/auth_routes.py

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta

from database.db import SessionLocal
from database.models import User  # Importa o modelo User

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


# Rota para o método OPTIONS no /auth/login (para CORS preflight)
@auth_bp.route('/login', methods=['OPTIONS'])
def login_options():
    return '', 200


@auth_bp.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "Username, email and password are required"}), 400

    db = SessionLocal()
    try:
        existing_user_username = db.query(User).filter_by(username=username).first()
        if existing_user_username:
            return jsonify({"message": "Username already exists"}), 409

        existing_user_email = db.query(User).filter_by(email=email).first()
        if existing_user_email:
            return jsonify({"message": "Email already registered"}), 409

        hashed_password = generate_password_hash(password)
        new_user = User(username=username, email=email, hashed_password=hashed_password)

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201
    except Exception as e:
        db.rollback()
        print(f"Erro ao registrar usuário: {e}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500
    finally:
        db.close()


@auth_bp.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email e senha são obrigatórios"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()

        if not user:
            return jsonify({"message": "Credenciais inválidas"}), 401

        if not check_password_hash(user.hashed_password, password):
            return jsonify({"message": "Credenciais inválidas"}), 401

        # ✅ Correção: convertendo o ID do usuário para string
        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 200
    except Exception as e:
        print(f"Erro ao logar usuário: {e}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500
    finally:
        db.close()


@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_current_user_data():
    user_id = get_jwt_identity()

    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=int(user_id)).first()
        if not user:
            return jsonify({"message": "Usuário não encontrado."}), 404

        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email
        }), 200
    except Exception as e:
        print(f"Erro ao buscar dados do usuário: {e}")
        return jsonify({"message": "Erro interno do servidor."}), 500
    finally:
        db.close()


@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected_route():
    current_user_id = get_jwt_identity()
    return jsonify(logged_in_as=current_user_id), 200
