from dotenv import load_dotenv
load_dotenv() # Load .env file

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
import app.models_orm

import os

# PROTOTYPE: Reset DB on startup to ensure schema matches code
if os.path.exists("./poec.db"):
    os.remove("./poec.db")
    
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PoEC Anomaly Detection", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "PoEC Anomaly Detection Engine Ready"}

from app.api import routes
app.include_router(routes.router, prefix="/api/v1")

# PoEC v2 Routes (NEW - Proof Building & Verification)
from app.api import routes_v2
app.include_router(routes_v2.router, prefix="/api/v2")
