from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app as fastapi_app


class VercelPathPrefix:
    """Map the /api/* function URL prefix to the FastAPI route paths."""

    def __init__(self, application):
        self.application = application

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["path"].startswith("/api/"):
            scope = dict(scope)
            scope["path"] = scope["path"][4:]
            scope["raw_path"] = scope["path"].encode("utf-8")
        await self.application(scope, receive, send)


app = VercelPathPrefix(fastapi_app)