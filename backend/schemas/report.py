from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ReportResponse(BaseModel):
    id: str
    analysis_id: str
    format: str
    title: str
    created_at: datetime
    content: dict
    model_config = ConfigDict(from_attributes=True)
