"""Gemini adapter. All generated content is constrained to a validated JSON schema."""
import json
import hashlib
import logging
import time
import traceback
from datetime import datetime, timezone
from typing import Any, Literal

from google import genai
from google.genai import types
import httpx
from pydantic import BaseModel, Field, ValidationError

from backend.config.settings import settings

logger = logging.getLogger(__name__)


class TimelinePoint(BaseModel):
    year: int
    detected_change: str
    confidence: float = Field(ge=0, le=100)
    affected_area_km2: float = Field(ge=0)
    severity: Literal["Low", "Moderate", "High"]


class Recommendation(BaseModel):
    title: str
    explanation: str
    severity: Literal["Low", "Moderate", "High"]
    category: str


class GeminiMetadata(BaseModel):
    analysisDate: str = ""
    processingTime: str = ""
    satelliteSource: str = ""
    imageryResolution: str = ""
    cloudCoverage: str = ""
    coordinates: str = ""
    modelVersion: str = ""
    selectedTimeRange: str = ""
    status: str = ""


class GeminiStatistics(BaseModel):
    changed_area_km2: float = Field(ge=0)
    aoi_changed_percent: float = Field(ge=0, le=100)
    change_region_count: int = Field(ge=0)
    change_type: str
    severity: Literal["Low", "Moderate", "High"]
    year: int


class GeminiAnalysis(BaseModel):
    summary: str
    detected_changes: list[str]
    environmental_impact: str
    infrastructure_impact: str
    severity: Literal["Low", "Moderate", "High"]
    confidence: float = Field(ge=0, le=100)
    affected_area_km2: float = Field(ge=0)
    recommendations: list[Recommendation]
    metadata: GeminiMetadata
    timeline: list[TimelinePoint]
    statistics: GeminiStatistics


class GeminiServiceError(Exception):
    """Safe, user-facing model integration failure."""

    def __init__(self, message: str, http_status: int = 503):
        super().__init__(message)
        self.http_status = http_status


class GeminiService:
    SYSTEM_PROMPT = """You are a Senior Remote Sensing Scientist and Satellite Change Detection Expert.
Return only a JSON object conforming exactly to the provided response schema. Never return markdown,
code fences, or explanations outside JSON. This project currently has no satellite image access or
image-processing pipeline. Do not claim that imagery was downloaded, inspected, or that a measured
change was detected. Treat all results as a clearly qualified, illustrative screening estimate based
only on the user's supplied location, change type, years, and filters. State uncertainty and recommend
validation against actual imagery. Do not invent precise geographic observations or present estimates
as verified facts. Affected area must be a cautious illustrative estimate, not a measured value."""

    def __init__(self) -> None:
        self._client: genai.Client | None = None
        logger.info(
            "Gemini configuration: api_key_loaded=%s key_source=%s model=%s",
            bool(settings.gemini_api_key.strip()), settings.gemini_api_key_source, settings.gemini_model,
        )

    def _get_client(self) -> genai.Client:
        if not settings.gemini_api_key.strip():
            raise GeminiServiceError("Gemini is not configured. Set GEMINI_API_KEY in backend/.env.")
        if self._client is None:
            self._client = genai.Client(api_key=settings.gemini_api_key)
        return self._client

    def analyze(self, request: Any) -> dict[str, Any]:
        try:
            return self._analyze_with_gemini(request)
        except Exception as exc:
            formatted = self._redact("".join(traceback.format_exception(type(exc), exc, exc.__traceback__)))
            logger.error(
                "Gemini analysis failed; returning source=mock for location=%s model=%s exception=%s\n%s",
                request.location, settings.gemini_model, type(exc).__name__, formatted,
            )
            return self._mock_analysis(request)

    def _analyze_with_gemini(self, request: Any) -> dict[str, Any]:
        logger.info(
            "Gemini analysis requested: model=%s location=%s change_type=%s before_year=%s after_year=%s",
            settings.gemini_model, request.location, request.analysis_type,
            request.before_year, request.year,
        )
        client = self._get_client()
        prompt = {
            "location": request.location,
            "changeType": request.analysis_type,
            "beforeYear": request.before_year,
            "afterYear": request.year,
            "filters": request.filters,
            "query": request.query,
            "coordinates": {"latitude": request.latitude, "longitude": request.longitude},
            "instruction": "Produce an illustrative screening response. Do not imply actual satellite analysis was performed.",
        }
        last_error: Exception | None = None
        started_at = time.monotonic()
        max_retries = 3
        max_attempts = max_retries + 1
        for attempt in range(max_attempts):
            try:
                response = client.models.generate_content(
                    model=settings.gemini_model,
                    contents=json.dumps(prompt, ensure_ascii=False),
                    config=types.GenerateContentConfig(
                        system_instruction=self.SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        response_schema=GeminiAnalysis,
                        temperature=0.2,
                    ),
                )
                if not response.text:
                    raise GeminiServiceError("Gemini returned an empty response.")
                result = GeminiAnalysis.model_validate_json(response.text).model_dump(mode="json")
                result["metadata"].update({
                    "analysisDate": datetime.now(timezone.utc).date().isoformat(),
                    "processingTime": f"{time.monotonic() - started_at:.1f} sec",
                    "satelliteSource": request.satellite,
                    "imageryResolution": request.resolution,
                    "cloudCoverage": f"{request.cloud_coverage}%",
                    "selectedTimeRange": request.time_range,
                    "coordinates": f"{request.latitude}, {request.longitude}" if request.latitude is not None else "Not provided",
                    "modelVersion": settings.gemini_model,
                    "status": "Completed · Gemini illustrative analysis",
                })
                result["risk"] = {"level": result["severity"], "description": result["environmental_impact"]}
                result["statistics"].update({
                    "changed_area_km2": result["affected_area_km2"],
                    "aoi_changed_percent": result["statistics"]["aoi_changed_percent"],
                    "change_region_count": result["statistics"]["change_region_count"],
                    "change_type": request.analysis_type,
                    "severity": result["severity"],
                    "year": request.year,
                })
                logger.info(
                    "Gemini analysis succeeded: model=%s confidence=%s timeline_points=%s",
                    settings.gemini_model, result["confidence"], len(result["timeline"]),
                )
                return result
            except GeminiServiceError:
                raise
            except ValidationError as exc:
                logger.warning("Gemini returned JSON that failed schema validation: %s", exc)
                raise GeminiServiceError("The AI service returned a response that could not be validated. Please retry.") from exc
            except Exception as exc:  # SDK exception types vary by transport/version.
                last_error = exc
                status = self._status_code(exc)
                message, http_status = self._failure_message(exc, status)
                formatted = self._redact("".join(traceback.format_exception(type(exc), exc, exc.__traceback__)))
                logger.error(
                    "Gemini request failed: model=%s attempt=%s/%s status=%s exception=%s\n%s",
                    settings.gemini_model, attempt + 1, max_attempts, status,
                    type(exc).__name__, formatted,
                )
                if self._is_temporary(exc) and attempt + 1 < max_attempts:
                    delay = 0.75 * (2 ** attempt)
                    logger.warning("Transient Gemini failure; retrying in %.2f seconds", delay)
                    time.sleep(delay)
                    continue
                if status in (429, 503):
                    message = f"{message} Retried {max_retries} times with exponential backoff."
                raise GeminiServiceError(message, http_status=http_status) from exc
        raise GeminiServiceError("Gemini analysis failed after retries.", http_status=503) from last_error

    def _redact(self, text: str) -> str:
        key = settings.gemini_api_key
        return text.replace(key, "[REDACTED_API_KEY]") if key else text

    @staticmethod
    def _status_code(error: Exception) -> int | None:
        status = getattr(error, "code", None) or getattr(error, "status_code", None)
        if status is None and getattr(error, "response", None) is not None:
            status = getattr(error.response, "status_code", None)
        if isinstance(status, str) and status.isdigit():
            status = int(status)
        return status if isinstance(status, int) else None

    def _failure_message(self, error: Exception, status: int | None) -> tuple[str, int]:
        detail = self._redact(str(getattr(error, "message", "") or error)).strip()
        lowered = detail.lower()
        if status in (400, 401, 403) and ("api key" in lowered or "api_key" in lowered or status in (401, 403)):
            return ("Google rejected GEMINI_API_KEY. The key may be invalid, restricted, or missing Gemini API access. Check the key's API restrictions and project access.", 401)
        if status in (400, 404) and ("model" in lowered or "not found" in lowered or "no longer available" in lowered):
            return (f"Google rejected Gemini model '{settings.gemini_model}'. Set GEMINI_MODEL to a model enabled for this API key. Google reported: {detail}", 502)
        if status == 429:
            return ("Gemini rate or quota limit reached (HTTP 429). Check project quota and billing, then retry. Google reported: " + detail, 429)
        if status == 503:
            return ("Gemini is temporarily overloaded (HTTP 503). Please retry shortly. Google reported: " + detail, 503)
        if status == 400:
            return ("Gemini rejected the request (HTTP 400). Check the request schema and generation settings. Google reported: " + detail, 400)
        if status and status >= 500:
            return (f"Gemini returned HTTP {status}. Please retry. Google reported: {detail}", 502)
        return ("Gemini request failed" + (f" (HTTP {status})" if status else "") + f": {detail}", 502)

    @staticmethod
    def _is_temporary(error: Exception) -> bool:
        code = GeminiService._status_code(error)
        if code == 429 or (code is not None and code >= 500):
            return True
        return isinstance(error, (TimeoutError, ConnectionError, OSError, httpx.RequestError))

    @staticmethod
    def _mock_analysis(request: Any) -> dict[str, Any]:
        """Build a deterministic, schema-compatible demo result without claiming imagery was processed."""
        seed_text = f"{request.location}|{request.analysis_type}|{request.before_year}|{request.year}"
        seed = int.from_bytes(hashlib.sha256(seed_text.encode("utf-8")).digest()[:4], "big")
        change_type = request.analysis_type.replace("_", " ").strip().title() or "Surface Change"
        confidence = 82 + seed % 17
        area_km2 = round(3.5 + (seed % 18000) / 100, 2)
        severity: Literal["Low", "Moderate", "High"] = "High" if area_km2 >= 90 else "Moderate" if area_km2 >= 30 else "Low"
        changed_percent = round(1.5 + (seed % 145) / 10, 1)
        region_count = 4 + seed % 23
        before_year = request.before_year if request.before_year is not None else request.year - 1
        first_year, last_year = sorted((before_year, request.year))
        interval_count = min(max(last_year - first_year, 1), 6)
        years = sorted({round(first_year + (last_year - first_year) * index / interval_count) for index in range(interval_count + 1)})

        timeline = []
        for index, year in enumerate(years):
            progress = (index + 1) / max(len(years), 1)
            annual_area = round(area_km2 * (0.35 + 0.65 * progress) * (0.92 + ((seed + index * 13) % 17) / 100), 2)
            annual_severity: Literal["Low", "Moderate", "High"] = "High" if annual_area >= 90 else "Moderate" if annual_area >= 30 else "Low"
            annual_confidence = min(99, max(70, confidence - 8 + ((seed + index * 7) % 15)))
            timeline.append({
                "year": year, "detected_change": change_type,
                "confidence": float(annual_confidence),
                "affected_area_km2": annual_area, "severity": annual_severity,
            })

        detected_changes = [
            f"Potential {change_type.lower()} footprint change around {request.location}.",
            f"Estimated affected area is {area_km2} km² across approximately {region_count} candidate regions.",
            "Year-to-year variation may reflect seasonality, cloud cover, or other unmodeled factors.",
        ]
        recommendations = [
            {"title": f"Review potential {change_type.lower()}", "explanation": "Treat the mapped signal as a screening lead and verify it against suitable imagery and local records.", "severity": severity, "category": change_type},
            {"title": "Validate seasonal effects", "explanation": "Compare similar seasons and account for cloud coverage before drawing conclusions.", "severity": "Moderate", "category": "Validation"},
            {"title": "Continue monitoring", "explanation": "Repeat the comparison in a later observation period to assess whether the signal persists.", "severity": "Low", "category": "Monitoring"},
        ]
        date_range = request.time_range or f"{before_year}-{request.year}"
        environmental_impact = f"Potential environmental effects depend on the type and persistence of the {change_type.lower()} signal; no environmental measurements were performed."
        infrastructure_impact = f"Possible infrastructure implications near {request.location} require confirmation with current imagery and authoritative local information."
        return {
            "summary": f"Illustrative AI screening for {request.location} suggests a possible {change_type.lower()} signal between {before_year} and {request.year}. Approximately {area_km2} km² may be affected (confidence {confidence}%). This is simulated fallback output, not a verified satellite observation.",
            "detected_changes": detected_changes,
            "environmental_impact": environmental_impact,
            "infrastructure_impact": infrastructure_impact,
            "severity": severity,
            "confidence": float(confidence),
            "affected_area_km2": area_km2,
            "recommendations": recommendations,
            "metadata": {
                "analysisDate": datetime.now(timezone.utc).date().isoformat(),
                "processingTime": "< 1 sec · local fallback",
                "satelliteSource": request.satellite,
                "imageryResolution": request.resolution,
                "cloudCoverage": f"{request.cloud_coverage}%",
                "coordinates": f"{request.latitude}, {request.longitude}" if request.latitude is not None and request.longitude is not None else "Not provided",
                "modelVersion": "PS-227 deterministic fallback v1",
                "selectedTimeRange": date_range,
                "status": "Completed · mock fallback",
            },
            "timeline": timeline,
            "statistics": {
                "changed_area_km2": area_km2, "aoi_changed_percent": changed_percent,
                "change_region_count": region_count, "change_type": change_type,
                "severity": severity, "year": request.year,
            },
            "risk": {"level": severity, "description": environmental_impact},
            # Additional dashboard-friendly fields are intentionally additive. The
            # established response fields above remain unchanged for existing clients.
            "insight_metrics": [
                {"label": "Urban Expansion", "value": float(18 + seed % 72), "trend": "upward", "description": "Illustrative built-up footprint signal"},
                {"label": "Vegetation Loss", "value": float(8 + (seed >> 3) % 61), "trend": "downward", "description": "Illustrative vegetation change signal"},
                {"label": "Water Body Change", "value": float(5 + (seed >> 7) % 54), "trend": "stable", "description": "Illustrative surface water signal"},
            ],
            "impact_assessment": {
                "environmental": environmental_impact,
                "infrastructure": infrastructure_impact,
                "overall": f"{severity} illustrative risk; validate with current imagery and local records.",
            },
            "risk_level": severity,
            "parser_confidence": float(90 + seed % 10),
            "source": "mock",
        }


gemini_service = GeminiService()
