from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.models.entities import Analysis
from backend.schemas.analysis import AnalysisRequest
from backend.services.database_service import database_service
from backend.services.gemini_service import GeminiService, gemini_service


class AnalysisService:
    def __init__(self, ai: GeminiService = gemini_service):
        self.ai = ai

    def create(self, db: Session, request: AnalysisRequest) -> tuple[Analysis, dict]:
        result = self.ai.analyze(request)
        analysis = Analysis(
            public_id=f"PS227-{uuid4().hex[:16].upper()}", original_query=request.query or "",
            location=request.location, analysis_type=request.analysis_type, time_range=request.time_range,
            year=request.year, latitude=request.latitude, longitude=request.longitude,
            status="completed", result_json=result,
        )
        db.add(analysis)
        database_service.commit(db)
        database_service.refresh(db, analysis)
        return analysis, result

    def get(self, db: Session, public_id: str) -> Analysis | None:
        return db.scalar(select(Analysis).where(Analysis.public_id == public_id))


analysis_service = AnalysisService()
