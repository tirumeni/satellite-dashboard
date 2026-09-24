from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class HistoryCreate(BaseModel):
    location: str = Field(min_length=1, max_length=512)
    analysis_type: str = Field(default="change detection", max_length=80)
    time_range: str = Field(default="recent imagery", max_length=80)
    original_query: str = Field(min_length=1, max_length=2000)


class HistoryResponse(HistoryCreate):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
