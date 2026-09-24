from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    query: str | None = Field(default=None, min_length=1, max_length=2000)
    location: str = Field(min_length=1, max_length=512)
    analysis_type: str = Field(default="change detection", max_length=80)
    time_range: str = Field(default="recent imagery", max_length=80)
    year: int = Field(ge=1970, le=2200)
    before_year: int | None = Field(default=None, ge=1970, le=2200)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    satellite: str = Field(default="Sentinel-2", max_length=40)
    resolution: str = Field(default="10m", max_length=20)
    cloud_coverage: int = Field(default=30, ge=0, le=100)
    filters: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def accept_dashboard_contract(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        data = dict(value)
        data.setdefault("analysis_type", data.pop("changeType", "change detection"))
        data.setdefault("before_year", data.get("beforeYear"))
        data.setdefault("year", data.get("afterYear", 2026))
        if "query" not in data:
            data["query"] = f"{data['analysis_type']} near {data.get('location', '')}"
        if data.get("time_range") is None:
            before, after = data.get("before_year"), data.get("year")
            filter_values = data.get("filters") if isinstance(data.get("filters"), dict) else {}
            data["time_range"] = filter_values.get("timeRange") or (f"{before}-{after}" if before else f"through {after}")
        return data


class Recommendation(BaseModel):
    title: str
    explanation: str
    severity: Literal["Low", "Moderate", "High"]
    category: str


class TimelinePoint(BaseModel):
    year: int
    detected_change: str
    confidence: float = Field(ge=0, le=100)
    affected_area_km2: float = Field(ge=0)
    severity: str


class AnalysisResponse(BaseModel):
    id: str
    status: str
    summary: str
    confidence: float = Field(ge=0, le=100)
    severity: Literal["Low", "Moderate", "High"]
    risk: dict[str, str]
    recommendations: list[Recommendation]
    metadata: dict[str, Any]
    statistics: dict[str, str | float | int]
    detected_changes: list[str] = Field(default_factory=list)
    environmental_impact: str = ""
    infrastructure_impact: str = ""
    affected_area_km2: float = Field(default=0, ge=0)
    timeline: list[TimelinePoint] = Field(default_factory=list)
    source: Literal["mock"] | None = None
    # Only fallback responses populate these optional enrichment fields, preserving
    # the existing successful Gemini response shape for current clients.
    insight_metrics: list[dict[str, Any]] | None = None
    impact_assessment: dict[str, Any] | None = None
    risk_level: Literal["Low", "Moderate", "High"] | None = None
    parser_confidence: float | None = Field(default=None, ge=0, le=100)


class AnalysisRecordResponse(AnalysisResponse):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
