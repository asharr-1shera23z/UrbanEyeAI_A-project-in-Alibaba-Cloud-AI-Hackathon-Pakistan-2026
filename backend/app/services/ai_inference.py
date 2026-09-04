"""
AI inference layer.

`AIInferenceEngine` is the interface every engine implements. Two are
provided:

  - MockInferenceEngine: no model file needed. Deterministic (same image ->
    same result, via a hash of the image bytes) so the "analyze" preview a
    citizen sees matches what actually gets stored on submit, and the whole
    pipeline is testable without a trained model.

  - YOLOInferenceEngine: loads a real Ultralytics YOLOv8n/YOLOv11n `.pt`
    weights file (see AI_MODEL_PATH in .env) and maps its class predictions
    onto the app's issue categories. If `ultralytics` isn't installed or the
    weights file is missing, it transparently falls back to the mock engine
    so the API never breaks because a model isn't plugged in yet.

Swap engines with the AI_ENGINE env var ("mock" | "yolo" | "urbaneye") — nothing in the
routers needs to change either way.
"""
import hashlib
import io
import tempfile
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from app.config import settings

ISSUE_CLASSES = [
    "Pothole",
    "Drain",
    "Road Damage",
    "Garbage",
    "Damaged Pavement",
]

# Friendly UI label for the AI result card. Potholes are shown as a sub-type
# of road damage, while cracks and structural road damage stand alone.
DISPLAY_CLASS_MAP = {
    "Pothole": "Road Damage / Pothole",
    "Road Damage": "Road Damage",
    "Drain": "Drain",
    "Garbage": "Garbage",
    "Damaged Pavement": "Damaged Pavement",
}


def display_class_for(detected_class: str) -> str:
    return DISPLAY_CLASS_MAP.get(detected_class, detected_class)


CLASS_DESCRIPTIONS = {
    "Pothole": "AI detected a road-surface defect such as a pothole or surface damage with meaningful confidence.",
    "Drain": "AI detected a blocked, overflowing or damaged drainage point.",
    "Road Damage": "AI detected cracked or structurally damaged road surface.",
    "Garbage": "AI detected an accumulation of uncollected garbage or illegal dumping.",
    "Damaged Pavement": "AI detected broken or hazardous pavement/footpath tiles.",
}

# Maps common COCO/custom YOLO class names onto our issue taxonomy, for when
# a real model is plugged in. Extend this as the trained model's class list
# is finalised.
YOLO_CLASS_MAP = {
    "pothole": "Pothole",
    "drain": "Drain",
    "blocked_drain": "Drain",
    "road_damage": "Road Damage",
    "crack": "Road Damage",
    "garbage": "Garbage",
    "trash": "Garbage",
    "pavement": "Damaged Pavement",
    "damaged_pavement": "Damaged Pavement",
}


@dataclass
class BoundingBox:
    x: float
    y: float
    width: float
    height: float


@dataclass
class InferenceResult:
    detected_class: str
    display_class: str
    confidence: float  # 0-100
    description: str
    bounding_box: Optional[BoundingBox]
    inference_seconds: float


class AIInferenceEngine(ABC):
    @abstractmethod
    def analyze(self, image_bytes: bytes) -> InferenceResult:
        raise NotImplementedError


class MockInferenceEngine(AIInferenceEngine):
    """Deterministic, dependency-free fallback. Picks a class + confidence +
    bounding box derived from a hash of the image bytes, so repeated calls
    on the same image are stable."""

    def analyze(self, image_bytes: bytes) -> InferenceResult:
        started = time.monotonic()

        digest = hashlib.sha256(image_bytes).digest()
        seed = int.from_bytes(digest[:8], "big")

        detected_class = ISSUE_CLASSES[seed % len(ISSUE_CLASSES)]
        confidence = 62.0 + (seed >> 8) % 36  # 62-97
        bbox = BoundingBox(
            x=10 + (seed >> 16) % 50,
            y=10 + (seed >> 24) % 50,
            width=20 + (seed >> 32) % 40,
            height=20 + (seed >> 40) % 40,
        )

        # Simulate realistic model latency (~2-4s) without blocking a whole
        # worker thread excessively; FastAPI runs sync routes in a threadpool.
        time.sleep(0.4)

        elapsed = time.monotonic() - started
        return InferenceResult(
            detected_class=detected_class,
            display_class=display_class_for(detected_class),
            confidence=round(confidence, 1),
            description=CLASS_DESCRIPTIONS[detected_class],
            bounding_box=bbox,
            inference_seconds=elapsed,
        )


class YOLOInferenceEngine(AIInferenceEngine):
    """Wraps a real Ultralytics YOLO model. Falls back to MockInferenceEngine
    if the `ultralytics` package or the weights file isn't available, so
    deploying without a trained model yet never breaks the API."""

    def __init__(self) -> None:
        self._model = None
        self._fallback = MockInferenceEngine()
        self._try_load()

    def _try_load(self) -> None:
        weights_path = Path(settings.AI_MODEL_PATH)
        if not weights_path.exists():
            return
        try:
            from ultralytics import YOLO  # type: ignore

            self._model = YOLO(str(weights_path))
        except ImportError:
            self._model = None

    def analyze(self, image_bytes: bytes) -> InferenceResult:
        if self._model is None:
            return self._fallback.analyze(image_bytes)

        import io

        from PIL import Image

        started = time.monotonic()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = self._model.predict(img, conf=settings.AI_CONFIDENCE_THRESHOLD, verbose=False)
        elapsed = time.monotonic() - started

        if not results or len(results[0].boxes) == 0:
            fallback_class = "Other" if "Other" in ISSUE_CLASSES else ISSUE_CLASSES[0]
            return InferenceResult(
                detected_class=fallback_class,
                display_class=display_class_for(fallback_class),
                confidence=0.0,
                description="No confident detection found in the uploaded image.",
                bounding_box=None,
                inference_seconds=elapsed,
            )

        r = results[0]
        best_idx = int(r.boxes.conf.argmax())
        conf = float(r.boxes.conf[best_idx]) * 100
        raw_name = r.names[int(r.boxes.cls[best_idx])]
        mapped_class = YOLO_CLASS_MAP.get(raw_name.lower(), ISSUE_CLASSES[0])

        xyxy = r.boxes.xyxyn[best_idx].tolist()  # normalised 0-1
        bbox = BoundingBox(
            x=round(xyxy[0] * 100, 1),
            y=round(xyxy[1] * 100, 1),
            width=round((xyxy[2] - xyxy[0]) * 100, 1),
            height=round((xyxy[3] - xyxy[1]) * 100, 1),
        )

        return InferenceResult(
            detected_class=mapped_class,
            display_class=display_class_for(mapped_class),
            confidence=round(conf, 1),
            description=CLASS_DESCRIPTIONS.get(mapped_class, "AI detected an urban infrastructure issue."),
            bounding_box=bbox,
            inference_seconds=elapsed,
        )


class UrbanEyeInferenceEngine(AIInferenceEngine):
    """The real UrbanEye AI ensemble: three specialist YOLOv8 models
    (pothole / road-crack / garbage detection) running on ONNX Runtime CPU,
    wrapped in the team's `urban_eye.py` engine.

    Loads from `backend/models/{pothole,crack,garbage}/best.onnx`. Falls back
    to the mock engine if the weights or the `ultralytics`/`cv2` deps are
    unavailable, so the API never breaks."""

    ENSEMBLE_CLASS_MAP = {
        "pothole": "Pothole",
        "road_crack": "Road Damage",
        "garbage": "Garbage",
    }

    def __init__(self) -> None:
        self._engine = None
        self._fallback = MockInferenceEngine()
        self._try_load()

    def _try_load(self) -> None:
        backend_dir = Path(__file__).resolve().parents[2]
        model_dir = backend_dir / "models"
        for cls in ("pothole", "crack", "garbage"):
            if not (model_dir / cls / "best.onnx").exists():
                return
        try:
            from app.services.urban_eye import UrbanEyeAI

            self._engine = UrbanEyeAI(model_dir=str(model_dir), use_onnx=True)
        except Exception:
            self._engine = None

    def analyze(self, image_bytes: bytes) -> InferenceResult:
        if self._engine is None:
            return self._fallback.analyze(image_bytes)

        from PIL import Image

        started = time.monotonic()
        with Image.open(io.BytesIO(image_bytes)) as pil_img:
            img_w, img_h = pil_img.size

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name
        try:
            result = self._engine.predict(tmp_path)
        finally:
            Path(tmp_path).unlink(missing_ok=True)
        elapsed = time.monotonic() - started

        summary = result.get("summary") or {}
        if not result.get("detections"):
            return InferenceResult(
                detected_class=ISSUE_CLASSES[0],
                display_class=display_class_for(ISSUE_CLASSES[0]),
                confidence=0.0,
                description="No confident detection found in the uploaded image.",
                bounding_box=None,
                inference_seconds=elapsed,
            )

        # Differentiate major road damage from standard potholes by weighing both
        # confidence and defect size. A large crack/road-damage region can outweigh a
        # small pothole, so major structural damage is not misclassified as a pothole.
        for d in result["detections"]:
            bb = d["bounding_box"]
            d["area_ratio"] = (bb["x2"] - bb["x1"]) * (bb["y2"] - bb["y1"]) / (img_w * img_h)

        primary = summary.get("primary_issue_type")
        best = max(
            result["detections"],
            key=lambda d: d["confidence"] + d["area_ratio"] * 0.8,
        )
        primary = best["issue_type"]
        mapped_class = self.ENSEMBLE_CLASS_MAP.get(primary, ISSUE_CLASSES[0])
        bb = best["bounding_box"]
        bbox = BoundingBox(
            x=round(bb["x1"] / img_w * 100, 1),
            y=round(bb["y1"] / img_h * 100, 1),
            width=round((bb["x2"] - bb["x1"]) / img_w * 100, 1),
            height=round((bb["y2"] - bb["y1"]) / img_h * 100, 1),
        )
        return InferenceResult(
            detected_class=mapped_class,
            display_class=display_class_for(mapped_class),
            confidence=round(best["confidence"] * 100, 1),
            description=CLASS_DESCRIPTIONS.get(mapped_class, "AI detected an urban infrastructure issue."),
            bounding_box=bbox,
            inference_seconds=elapsed,
        )


_engine: Optional[AIInferenceEngine] = None


def get_ai_engine() -> AIInferenceEngine:
    global _engine
    if _engine is None:
        if settings.AI_ENGINE == "urbaneye":
            _engine = UrbanEyeInferenceEngine()
        elif settings.AI_ENGINE == "yolo":
            _engine = YOLOInferenceEngine()
        else:
            _engine = MockInferenceEngine()
    return _engine
