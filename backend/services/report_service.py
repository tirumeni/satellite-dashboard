from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.models.entities import Analysis, Report
from backend.services.database_service import database_service


class ReportService:
    def create_snapshot(self, db: Session, analysis: Analysis, content: dict) -> Report:
        report = Report(public_id=f"RPT-{uuid4().hex[:14].upper()}", analysis_id=analysis.id, format="json", title=f"Analysis report · {analysis.location}", content_json=content)
        db.add(report)
        database_service.commit(db)
        database_service.refresh(db, report)
        return report

    def list_recent(self, db: Session, limit: int = 50) -> list[Report]:
        return list(db.scalars(select(Report).order_by(Report.created_at.desc()).limit(limit)))


report_service = ReportService()
