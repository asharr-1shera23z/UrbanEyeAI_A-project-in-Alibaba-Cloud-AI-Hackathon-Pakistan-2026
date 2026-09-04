from fastapi import APIRouter, Depends

from app import schemas
from app.deps import get_current_citizen
from app.models import User
from app.services import storage
from app.services.ai_inference import get_ai_engine
from app.services.priority import compute_severity_and_priority

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/analyze", response_model=schemas.AIAnalysis)
def analyze_image(payload: schemas.AnalyzeImageInput, _user: User = Depends(get_current_citizen)):
    image_bytes, _ext = storage.decode_data_url(payload.image)
    engine = get_ai_engine()
    result = engine.analyze(image_bytes)

    bbox = result.bounding_box
    scored = compute_severity_and_priority(
        confidence=result.confidence,
        bbox_width=bbox.width if bbox else None,
        bbox_height=bbox.height if bbox else None,
        location="",
        nearby_count=0,
        category=result.detected_class,
    )

    return schemas.AIAnalysis(
        detectedClass=result.detected_class,
        displayClass=result.display_class,
        confidence=result.confidence,
        severity=scored.severity,
        priority=scored.priority,
        description=result.description,
        boundingBox=schemas.BoundingBox(x=bbox.x, y=bbox.y, width=bbox.width, height=bbox.height) if bbox else None,
    )
