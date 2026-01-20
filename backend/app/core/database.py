import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Default to Docker DB if not set
# Default to SQLite for zero-config deployment if DATABASE_URL is not set
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./poec.db")

# FIX: Render uses postgres:// but SQLAlchemy requires postgresql://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"DEBUG: Using Database URL -> {SQLALCHEMY_DATABASE_URL[:30]}...")

# Handle SQLite-specific connect_args
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
