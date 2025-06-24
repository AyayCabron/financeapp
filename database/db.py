import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, scoped_session
from sqlalchemy.ext.declarative import declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("A variável de ambiente DATABASE_URL não está definida.")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

Base = declarative_base()

_Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

SessionLocal = scoped_session(_Session)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
