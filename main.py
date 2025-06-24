import os
import traceback
from flask import Flask, jsonify
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from werkzeug.exceptions import UnprocessableEntity

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

load_dotenv()

app = Flask(__name__)

allowed_origins_str = os.getenv('ALLOWED_ORIGINS', 'https://financeapp-frontend.onrender.com')
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(',')]

CORS(app, origins=allowed_origins, supports_credentials=True)
print(f"DEBUG: CORS configurado para origens: {allowed_origins}")

app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'uma_chave_secreta_padrao_muito_segura_para_dev')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super_secreta_jwt_para_dev')
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))
app.config['JWT_COOKIE_SECURE'] = False
app.config['JWT_COOKIE_CSRF_PROTECT'] = False

jwt = JWTManager(app)

Base.metadata.create_all(bind=engine)
print("DEBUG: Tabelas verificadas/criadas (se Base.metadata.create_all estiver ativo).")

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    db = SessionLocal()
    try:
        user = db.query(models.User).filter_by(id=int(identity)).first()
        return user
    finally:
        db.close()

@app.errorhandler(UnprocessableEntity)
def handle_unprocessable_entity(e):
    traceback.print_exc()
    print(f"Erro 422 Unprocessable Entity capturado: {e.description}")
    return jsonify({"message": e.description}), 422

@app.route('/')
def hello_world():
    return jsonify({"message": "Bem-vindo à API de Gestão Financeira Pessoal!"})

@app.teardown_request
def remove_session(exception=None):
    SessionLocal.remove()

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
    app.run(debug=True, host='0.0.0.0', port=os.getenv('PORT', 5000))
