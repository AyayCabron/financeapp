# alembic/env.py

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Adiciona o diretório raiz do projeto ao sys.path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)  # Usar insert(0) é melhor para priorizar

# Carrega variáveis de ambiente
from dotenv import load_dotenv
load_dotenv()

# --- DEBUG OPCIONAL ---
print(f"DEBUG: sys.path: {sys.path}")
print(f"DEBUG: Current working directory (os.getcwd()): {os.getcwd()}")
print(f"DEBUG: Project root (calculated): {project_root}")
# ----------------------

# Importe seus módulos
try:
    from database.db import Base, engine
    from database.models import User, Conta, Categoria, Transacao
except Exception as e:
    print(f"Erro ao importar modelos: {e}")
    raise

# Configuração Alembic
config = context.config

# Setup de logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Define a metadata para autogeração
target_metadata = Base.metadata

# Configura a URL do banco de dados a partir do .env
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise Exception("DATABASE_URL não definida no .env")

config.set_main_option("sqlalchemy.url", db_url)

# Para depuração
print(f"DEBUG: Tabelas detectadas: {target_metadata.tables.keys()}")

# Modos online e offline
def run_migrations_offline():
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
