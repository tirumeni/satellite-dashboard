from contextlib import asynccontextmanager
from pathlib import Path
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

# Add backend directory to Python path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from api.routes import api_router
from config.settings import settings
from database.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Credential-free PS-227 backend foundation",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Database operation failed.",
            "code": "DATABASE_ERROR",
        },
    )


@app.get("/", tags=["health"])
async def root():
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["health"])
async def health():
    return {
        "status": "healthy"
    }