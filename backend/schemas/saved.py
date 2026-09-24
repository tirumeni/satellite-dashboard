from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SaveRequest(BaseModel):
    analysis_id: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=200)


class SavedResponse(BaseModel):
    id: int
    analysis_id: str
    title: str
    created_at: datetime
