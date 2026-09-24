from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


class DatabaseService:
    """Small transaction boundary shared by the database-backed services."""
    @staticmethod
    def commit(db: Session) -> None:
        try:
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            raise

    @staticmethod
    def refresh(db: Session, entity: object) -> None:
        db.refresh(entity)

    @staticmethod
    def rollback(db: Session) -> None:
        db.rollback()


database_service = DatabaseService()
