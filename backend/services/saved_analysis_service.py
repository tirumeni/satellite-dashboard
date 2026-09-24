from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.models.entities import Analysis, SavedAnalysis
from backend.schemas.saved import SaveRequest
from backend.services.database_service import database_service


class SavedAnalysisService:
    def save(self, db: Session, request: SaveRequest) -> SavedAnalysis:
        analysis = db.scalar(select(Analysis).where(Analysis.public_id == request.analysis_id))
        if analysis is None:
            raise HTTPException(status_code=404, detail="Analysis not found.")
        saved = SavedAnalysis(analysis_id=analysis.id, title=request.title)
        db.add(saved); database_service.commit(db); database_service.refresh(db, saved)
        return saved

    def delete(self, db: Session, saved_id: int) -> bool:
        saved = db.get(SavedAnalysis, saved_id)
        if saved is None:
            return False
        db.delete(saved); database_service.commit(db)
        return True


saved_analysis_service = SavedAnalysisService()
