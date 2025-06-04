# personal_finance_api/main.py

import os
import traceback
from flask import Flask, jsonify
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from werkzeug.exceptions import UnprocessableEntity

# Importações do projeto
from database.db import engine, Base, SessionLocal
from database import models
from routes.auth_routes import auth_bp
from routes.account_routes import account_bp
from routes.category_routes import category_bp
from routes.transaction_routes import transaction_bp
from routes.summary_routes import summary_bp
from routes.shopping_list_routes import shopping_list_bp
from routes.bill_routes import bill_bp
from routes.goal_routes import goal_bp
from routes.inventory_routes import inventory_bp
from routes.agenda_accounts_routes import agenda_account_bp
from routes.agenda_transactions_routes import agenda_transaction_bp

# Carrega variáveis de ambiente do .env
load_dotenv()

# Inicializa a aplicação Flask
app = Flask(__name__)

# --- Configuração de CORS ---
# Lê as origens permitidas da variável de ambiente ALLOWED_ORIGINS
# Se houver múltiplas origens, elas devem ser separadas por vírgula (ex: "http://localhost:3000,https://seu-frontend.onrender.com")
allowed_origins_str = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000') # Padrão para desenvolvimento local
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(',')]

# Configura CORS com as origens permitidas
CORS(app, resources={r"/*": {"origins": allowed_origins}})
print(f"DEBUG: CORS configurado para origens: {allowed_origins}")


# Configurações de chave secreta e JWT
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'uma_chave_secreta_padrao_muito_segura_para_dev')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super_secreta_jwt_para_dev')
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600)) # Converter para int
app.config['JWT_COOKIE_SECURE'] = False # Para desenvolvimento local (HTTP)
app.config['JWT_COOKIE_CSRF_PROTECT'] = False # Para desenvolvimento local

jwt = JWTManager(app)

# Cria as tabelas no banco de dados se não existirem
# REMOVA OU COMENTE ESTA LINHA SE ESTIVER USANDO ALEMBIC PARA GERENCIAR MIGRAÇÕES EM PRODUÇÃO
Base.metadata.create_all(bind=engine)
print("DEBUG: Tabelas verificadas/criadas (se Base.metadata.create_all estiver ativo).")


# --- JWT User Lookup Callback ---
@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]  # O ID do usuário armazenado no token
    db = SessionLocal()
    try:
        user = db.query(models.User).filter_by(id=int(identity)).first()
        return user
    finally:
        db.close()

# --- Tratamento de erro 422 Unprocessable Entity ---
@app.errorhandler(UnprocessableEntity)
def handle_unprocessable_entity(e):
    traceback.print_exc()
    print(f"Erro 422 Unprocessable Entity capturado: {e.description}")
    return jsonify({"message": e.description}), 422

# --- Rota de teste para verificar se a API está rodando ---
@app.route('/')
def hello_world():
    return jsonify({"message": "Bem-vindo à API de Gestão Financeira Pessoal!"})

# Fecha a sessão do banco após cada requisição
@app.teardown_request
def remove_session(exception=None):
    SessionLocal.remove()

# Registro dos blueprints (rotas do projeto)
app.register_blueprint(auth_bp)
app.register_blueprint(account_bp)
app.register_blueprint(category_bp)
app.register_blueprint(transaction_bp)
app.register_blueprint(summary_bp)
app.register_blueprint(shopping_list_bp)
app.register_blueprint(bill_bp)
app.register_blueprint(goal_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(agenda_account_bp)
app.register_blueprint(agenda_transaction_bp)

if __name__ == '__main__':
    print("DEBUG: Rodando Flask em modo de desenvolvimento (apenas para teste local).")
    # No Render, o Gunicorn usará a porta fornecida pela variável de ambiente PORT
    app.run(debug=True, host='0.0.0.0', port=os.getenv('PORT', 5000))

