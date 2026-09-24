import os
from pathlib import Path
from dotenv import dotenv_values, load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_ENV_FILE = ROOT_DIR / "backend" / ".env"
ROOT_ENV_FILE = ROOT_DIR / ".env"
load_dotenv(BACKEND_ENV_FILE)
load_dotenv(ROOT_DIR / ".env", override=False)

_loaded_api_key = os.getenv("GEMINI_API_KEY", "")
_backend_file_key = dotenv_values(BACKEND_ENV_FILE).get("GEMINI_API_KEY", "")
_root_file_key = dotenv_values(ROOT_ENV_FILE).get("GEMINI_API_KEY", "")
if _loaded_api_key and _backend_file_key and _loaded_api_key == _backend_file_key:
    _gemini_key_source = "backend/.env"
elif _loaded_api_key and _root_file_key and _loaded_api_key == _root_file_key:
    _gemini_key_source = "root .env"
elif _loaded_api_key:
    _gemini_key_source = "process environment"
else:
    _gemini_key_source = "not configured"


class Settings:
    app_name = os.getenv("APP_NAME", "PS-227 Satellite Change Analysis API")
    environment = os.getenv("APP_ENV", "development")
    database_url = os.getenv("DATABASE_URL", "sqlite:///./backend/data/ps227.sqlite")
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    gemini_api_key_source = _gemini_key_source
    gee_project = os.getenv("GEE_PROJECT", "")
    service_account = os.getenv("SERVICE_ACCOUNT", "")
    model_version = os.getenv("MODEL_VERSION", "PS-227 Gemini Analysis v1")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

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
