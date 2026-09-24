from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Declarative metadata base shared by all ORM models."""
