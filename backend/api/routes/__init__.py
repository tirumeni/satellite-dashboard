from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from database.session import get_db
from backend.schemas.analysis import AnalysisRequest, AnalysisResponse
from backend.schemas.history import HistoryCreate
from backend.schemas.saved import SaveRequest
from backend.services.analysis_service import analysis_service
from backend.services.history_service import history_service
from backend.services.report_service import report_service
from backend.services.saved_analysis_service import saved_analysis_service
from backend.services.search_service import search_service

api_router = APIRouter()

@api_router.get("/health")
def health():
    return {"status": "ok", "service": "ps227-api", "mode": "gemini"}

@api_router.post("/api/analyze", response_model=AnalysisResponse, response_model_exclude_none=True)
@api_router.post("/analyze", response_model=AnalysisResponse, response_model_exclude_none=True)
def analyze(request: AnalysisRequest, response: Response, db: Session = Depends(get_db)):
    # GeminiService converts exhausted upstream failures into a schema-compatible
    # deterministic result. Keep that path successful at HTTP level; preserve the
    # pre-existing 201 status for actual Gemini results.
    record, result = analysis_service.create(db, request)
    report_service.create_snapshot(db, record, result)
    response.status_code = 200 if result.get("source") == "mock" else 201
    return {"id": record.public_id, "status": result["metadata"].get("status", record.status), **result}

@api_router.get("/analysis/{analysis_id}", response_model=AnalysisResponse, response_model_exclude_none=True)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)):
    record = analysis_service.get(db, analysis_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return {"id": record.public_id, "status": record.status, **record.result_json}

@api_router.get("/history")
def get_history(limit: int = Query(default=50, ge=1, le=200), db: Session = Depends(get_db)):
    return [{"id": item.id, "location": item.location, "analysis_type": item.analysis_type, "time_range": item.time_range,
             "original_query": item.original_query, "timestamp": item.created_at} for item in history_service.list_recent(db, limit)]

@api_router.post("/history", status_code=201)
def post_history(request: HistoryCreate, db: Session = Depends(get_db)):
    item = search_service.record(db, request)
    return {"id": item.id, "location": item.location, "analysis_type": item.analysis_type, "time_range": item.time_range,
            "original_query": item.original_query, "timestamp": item.created_at}

@api_router.post("/save", status_code=201)
def save_analysis(request: SaveRequest, db: Session = Depends(get_db)):
    item = saved_analysis_service.save(db, request)
    return {"id": item.id, "analysis_id": item.analysis.public_id, "title": item.title, "created_at": item.created_at}

@api_router.delete("/save/{saved_id}")
def delete_saved_analysis(saved_id: int, db: Session = Depends(get_db)):
    if not saved_analysis_service.delete(db, saved_id):
        raise HTTPException(status_code=404, detail="Saved analysis not found.")
    return {"deleted": True, "id": saved_id}

@api_router.get("/reports")
def get_reports(limit: int = Query(default=50, ge=1, le=200), db: Session = Depends(get_db)):
    return [{"id": item.public_id, "analysis_id": item.analysis.public_id, "format": item.format,
             "title": item.title, "created_at": item.created_at, "content": item.content_json}
            for item in report_service.list_recent(db, limit)]
