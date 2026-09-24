from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.models.entities import SearchHistory


class HistoryService:
    def list_recent(self, db: Session, limit: int = 50) -> list[SearchHistory]:
        return list(db.scalars(select(SearchHistory).order_by(SearchHistory.created_at.desc()).limit(limit)))


history_service = HistoryService()
