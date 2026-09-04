"""
Centralised, environment-driven configuration.

Nothing secret is hard-coded here — everything comes from environment
variables (loaded from a local .env file via python-dotenv in development).
See .env.example for the full list of supported variables.
"""
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---
    APP_NAME: str = "UrbanEye AI Backend"
    ENV: str = "development"
    DEBUG: bool = True

    # --- Database ---
    # SQLite by default (zero setup). Point this at a PostgreSQL/PostGIS
    # instance in production, e.g.:
    #   postgresql+psycopg2://urbaneye:password@localhost:5432/urbaneye
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR / 'urbaneye.db'}"

    # --- Auth / JWT ---
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_this_is_not_secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # --- CORS ---
    # Comma-separated list of allowed origins for the existing Vite frontend.
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- File storage ---
    # "local" stores images on disk under STORAGE_DIR and serves them via
    # /media. Swap to "s3" later (see app/services/storage.py) for Alibaba
    # Cloud OSS / AWS S3 without touching any route code.
    STORAGE_BACKEND: str = "local"
    STORAGE_DIR: str = str(BACKEND_DIR / "storage" / "uploads")
    MEDIA_URL_PREFIX: str = "/media"
    PUBLIC_BASE_URL: str = "http://localhost:8000"

    # S3 / OSS (only read when STORAGE_BACKEND=s3)
    S3_BUCKET: str = ""
    S3_REGION: str = ""
    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""

    # --- AI inference ---
    # "mock" = deterministic fallback inference (no model file needed).
    # "yolo" = load a real Ultralytics YOLOv8n/YOLOv11n .pt model from
    # AI_MODEL_PATH (see app/services/ai_inference.py).
    AI_ENGINE: str = "mock"
    AI_MODEL_PATH: str = str(BACKEND_DIR / "models" / "urbaneye_yolo.pt")
    AI_CONFIDENCE_THRESHOLD: float = 0.35

    # --- Duplicate detection ---
    DUPLICATE_RADIUS_METERS: float = 60.0
    DUPLICATE_WINDOW_DAYS: int = 14

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
