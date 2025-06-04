# personal_finance_api/database/db.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, scoped_session # <-- Importe scoped_session
# Use esta importação para declarative_base para evitar ambiguidade
from sqlalchemy.ext.declarative import declarative_base

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Obtém a URL do banco de dados do ambiente
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("A variável de ambiente DATABASE_URL não está definida.")

# Cria o engine do SQLAlchemy
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Base para os modelos declarativos do SQLAlchemy
Base = declarative_base()

# Cria uma sessãomaker para criar novas sessões
# É uma "fábrica" de sessões
_Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Use scoped_session para garantir que cada thread tenha sua própria sessão
# e que a sessão seja gerenciada corretamente (fechada/removida)
SessionLocal = scoped_session(_Session) # <-- A chave da solução para o erro .remove()


# Função utilitária para obter uma sessão de banco de dados
# Usaremos isso em rotas e serviços para obter uma sessão para a requisição atual
def get_db():
    db = SessionLocal() # Obtém a sessão do escopo atual (do thread da requisição)
    try:
        yield db # O 'yield' torna essa função um gerador, útil para dependências em frameworks
    finally:
        db.close() # Garante que a sessão seja fechada ao final do uso
        # O SessionLocal.remove() no teardown_request do Flask limpa a sessão do escopo