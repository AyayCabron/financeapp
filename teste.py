# teste.py
from database.db import SessionLocal

def testar_conexao():
    try:
        db = SessionLocal()
        print("Conexão com o banco de dados estabelecida com sucesso!")
        db.close()
    except Exception as e:
        print(f"Erro ao conectar com o banco de dados: {e}")

testar_conexao()

