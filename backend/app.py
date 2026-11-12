import os
import threading
import warnings
import logging
from contextlib import asynccontextmanager

# Suppress benign third-party library notices
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", message=".*tokenize.*")
warnings.filterwarnings("ignore", message=".*_target_device.*")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import Base, engine
from utils.qdrant_client import setup_qdrant
from routes import resumes
from routes.auth import router as auth_router
from services.search_batch import get_embedder

def prewarm_models():
    """Pre-load InstructorEmbedding model in background to avoid search cold-starts."""
    try:
        print("🧠 Pre-warming InstructorEmbedding model into RAM...")
        get_embedder()
        print("✅ InstructorEmbedding model ready for instant searches!")
    except Exception as e:
        print(f"⚠️ Warning: Could not pre-warm embedder: {e}")

# ✅ Modern Lifespan Handler (replaces deprecated @app.on_event("startup"))
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ PostgreSQL tables are set up.")
    except Exception as e:
        print(f"⚠️ Warning: PostgreSQL setup skipped on startup: {e}")

    try:
        setup_qdrant()
    except Exception as e:
        print(f"⚠️ Warning: Qdrant setup skipped on startup: {e}")

    # Start pre-warming in a daemon thread so the API opens immediately
    threading.Thread(target=prewarm_models, daemon=True).start()

    yield

app = FastAPI(lifespan=lifespan)

# ✅ Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Root route
@app.get("/")
def read_root():
    return {"message": "LinkedIn Talent Finder API is running 🚀"}

app.include_router(auth_router, prefix="/auth")
app.include_router(resumes.router)
