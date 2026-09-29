import os
from pathlib import Path
from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / "backend" / ".env")
load_dotenv(ROOT_DIR / ".env", override=False)


class Settings:
    app_name = os.getenv("APP_NAME", "PS-227 Satellite Change Analysis API")
    environment = os.getenv("APP_ENV", "development")
    database_url = os.getenv("DATABASE_URL", "sqlite:///./backend/data/ps227.sqlite")
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    gee_project = os.getenv("GEE_PROJECT", "")
    service_account = os.getenv("SERVICE_ACCOUNT", "")
    model_version = os.getenv("MODEL_VERSION", "PS-227 Gemini Analysis v1")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def sqlite_file(self) -> Path | None:
        if not self.is_sqlite:
            return None
        raw = self.database_url.removeprefix("sqlite:///")
        path = Path(raw)
        return path if path.is_absolute() else ROOT_DIR / path


settings = Settings()
