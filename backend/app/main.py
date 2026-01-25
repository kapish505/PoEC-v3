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

@app.get("/health")
def health_check():
    return {"status": "healthy"}

from app.api import routes
app.include_router(routes.router, prefix="/api/v1")

# PoEC v2 Routes (NEW - Proof Building & Verification)
from app.api import routes_v2
app.include_router(routes_v2.router, prefix="/api/v2")

app.include_router(routes_v3.router)

# Serve SPA Frontend (if built)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")

if os.path.exists(static_dir):
    app.mount("/_next", StaticFiles(directory=os.path.join(static_dir, "_next")), name="next")
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # API requests are handled by routers above
        if full_path.startswith("api/"):
            return {"error": "Not found"}
            
        # Check if file exists in static
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Fallback to index.html for SPA routing
        return FileResponse(os.path.join(static_dir, "index.html"))

