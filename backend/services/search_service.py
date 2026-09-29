from sqlalchemy.orm import Session
from models.entities import SearchHistory
from schemas.history import HistoryCreate
from services.database_service import database_service


class SearchService:
    def record(self, db: Session, request: HistoryCreate) -> SearchHistory:
        entry = SearchHistory(**request.model_dump())
        db.add(entry)
        database_service.commit(db)
        database_service.refresh(db, entry)
        return entry


search_service = SearchService()
