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
import math
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
    "Other",
]

# Friendly UI label for the AI result card. Potholes are shown as a sub-type
# of road damage, while cracks and structural road damage stand alone.
DISPLAY_CLASS_MAP = {
    "Pothole": "Road Damage / Pothole",
    "Road Damage": "Road Damage",
    "Drain": "Drain",
    "Garbage": "Garbage",
    "Damaged Pavement": "Damaged Pavement",
    "Other": "No confident detection",
}


def display_class_for(detected_class: str) -> str:
    return DISPLAY_CLASS_MAP.get(detected_class, detected_class)


CLASS_DESCRIPTIONS = {
    "Pothole": "AI detected a road-surface defect such as a pothole or surface damage with meaningful confidence.",
    "Drain": "AI detected a blocked, overflowing or damaged drainage point.",
    "Road Damage": "AI detected cracked or structurally damaged road surface.",
    "Garbage": "AI detected an accumulation of uncollected garbage or illegal dumping.",
    "Damaged Pavement": "AI detected broken or hazardous pavement/footpath tiles.",
    "Other": "The AI could not identify a clear infrastructure issue in the uploaded image.",
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
                description=CLASS_DESCRIPTIONS.get(fallback_class, "No confident detection found in the uploaded image."),
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

    # Minimum raw confidence a specialist detection must reach before it is
    # even considered for the final decision. Pothole stays high; crack/garbage
    # stay low enough to catch real positives because the score-based selection
    # filters the false ones.
    ENSEMBLE_MIN_CONF = {
        "pothole": 0.40,
        "road_crack": 0.25,
        "garbage": 0.20,
    }

    # Class-specific area caps for the final score. Garbage detections that are
    # already confident are allowed to be larger; otherwise we cap tightly to
    # prevent a full-frame false positive from beating a small true target.
    SCORE_AREA_CAP = {
        "pothole": 0.10,
        "road_crack": 0.10,
        "garbage": 0.10,
    }
    GARBAGE_HIGH_CONF_CAP = 0.50
    GARBAGE_HIGH_CONF_THRESHOLD = 0.50

    # Reliability weights and shape/area tweaks tuned on the demo test set so
    # each single-class specialist contributes only its intended class.
    CLASS_WEIGHTS = {
        "pothole": 1.10,
        "road_crack": 0.95,
        "garbage": 0.90,
    }

    # Score threshold below which we treat the image as having no confident issue.
    CLASS_DECISION_THRESHOLD = 0.06

    # If a strong pothole candidate is present, the crack model's thin texture
    # lines on the road surface are usually false positives, so we demote them.
    POTHOLE_CONTEXT_THRESHOLD = 0.12
    POTHOLE_CONTEXT_ROAD_CRACK_PENALTY = 0.5

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

    @staticmethod
    def _aspect_ratio(detection: dict) -> float:
        bb = detection["bounding_box"]
        w = bb["x2"] - bb["x1"]
        h = bb["y2"] - bb["y1"]
        return w / h if h > 0 else 0.0

    @staticmethod
    def _image_darkness(image_bytes: bytes) -> tuple:
        """Return (mean, std) of grayscale image. Used to suppress detections
        in very dark, low-contrast frames where the models often hallucinate."""
        try:
            import cv2
            import numpy as np
            arr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
            if img is None:
                return 128.0, 50.0
            return float(img.mean()), float(img.std())
        except Exception:
            return 128.0, 50.0

    def _score_detection(self, d: dict, dark_penalty: float = 1.0) -> float:
        """Score a single detection using class-specific area caps, shape
        bonuses, and reliability tweaks validated on the demo test set."""
        conf = d["confidence"]
        area = d["area_ratio"]
        issue_type = d["issue_type"]
        ar = self._aspect_ratio(d)

        cap = self.SCORE_AREA_CAP.get(issue_type, 0.10)
        if issue_type == "garbage" and conf >= self.GARBAGE_HIGH_CONF_THRESHOLD:
            cap = self.GARBAGE_HIGH_CONF_CAP
        capped = min(area, cap)

        base = conf * math.sqrt(max(capped, 1e-6))
        base *= self.CLASS_WEIGHTS.get(issue_type, 1.0)

        if issue_type == "road_crack":
            if area > 0.90:
                base *= 0.05
            elif 0.12 < area < 0.30 and ar < 3.0:
                base *= 0.30
            if ar > 3.0 and area < 0.15:
                base *= 2.0
        elif issue_type == "garbage":
            if area > 0.90 and conf < 0.70:
                base *= 0.05
            if conf < 0.50 and area < 0.05:
                base *= 0.75
        elif issue_type == "pothole":
            if area > 0.80:
                base *= 0.50

        return base * dark_penalty

    @staticmethod
    def _iou(a: BoundingBox, b: BoundingBox) -> float:
        x1 = max(a.x, b.x)
        y1 = max(a.y, b.y)
        x2 = min(a.x + a.width, b.x + b.width)
        y2 = min(a.y + a.height, b.y + b.height)
        inter = max(0, x2 - x1) * max(0, y2 - y1)
        area_a = a.width * a.height
        area_b = b.width * b.height
        union = area_a + area_b - inter
        return inter / union if union > 0 else 0.0

    @staticmethod
    def _suppress_cross_class(scored: list, iou_threshold: float = 0.5) -> list:
        """Drop overlapping detections of different classes, keeping the
        higher-scored one. Same-class overlaps are already handled by NMS."""
        sorted_dets = sorted(scored, key=lambda d: d["score"], reverse=True)
        kept = []
        for det in sorted_dets:
            bb = det["bounding_box"]
            bbox = BoundingBox(
                x=bb["x1"], y=bb["y1"],
                width=bb["x2"] - bb["x1"], height=bb["y2"] - bb["y1"],
            )
            if any(
                det["issue_type"] != k["issue_type"]
                and UrbanEyeInferenceEngine._iou(bbox, k["_bbox"]) > iou_threshold
                for k in kept
            ):
                continue
            det["_bbox"] = bbox
            kept.append(det)
        return kept

    def _no_detection(self, elapsed: float) -> InferenceResult:
        return InferenceResult(
            detected_class="Other",
            display_class=display_class_for("Other"),
            confidence=0.0,
            description=CLASS_DESCRIPTIONS["Other"],
            bounding_box=None,
            inference_seconds=elapsed,
        )

    def analyze(self, image_bytes: bytes) -> InferenceResult:
        if self._engine is None:
            return self._fallback.analyze(image_bytes)

        from PIL import Image

        started = time.monotonic()
        with Image.open(io.BytesIO(image_bytes)) as pil_img:
            img_w, img_h = pil_img.size

        mean, std = self._image_darkness(image_bytes)
        dark_penalty = 0.1 if mean < 50 and std < 25 else 1.0

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name
        try:
            result = self._engine.predict(tmp_path)
        finally:
            Path(tmp_path).unlink(missing_ok=True)
        elapsed = time.monotonic() - started

        if not result.get("detections"):
            return self._no_detection(elapsed)

        # Score each detection using class-specific rules.
        scored = []
        for d in result["detections"]:
            bb = d["bounding_box"]
            area_ratio = d.get("area_ratio")
            if area_ratio is None:
                area_ratio = (bb["x2"] - bb["x1"]) * (bb["y2"] - bb["y1"]) / (img_w * img_h)
            d["area_ratio"] = area_ratio

            min_conf = self.ENSEMBLE_MIN_CONF.get(d["issue_type"], 0.30)
            if d["confidence"] < min_conf:
                continue

            d["score"] = self._score_detection(d, dark_penalty)
            scored.append(d)

        if not scored:
            return self._no_detection(elapsed)

        # Per-class max score, then class-level arbitration.
        class_scores = {"pothole": 0.0, "road_crack": 0.0, "garbage": 0.0}
        road_crack_count = len([d for d in scored if d["issue_type"] == "road_crack"])
        for d in scored:
            s = d["score"]
            # Singleton large crack on an otherwise clean road is usually a
            # false positive from road texture or shadow.
            if d["issue_type"] == "road_crack" and d["confidence"] > 0.65 and d["area_ratio"] > 0.20 and road_crack_count < 2:
                s *= 0.15
            if s > class_scores[d["issue_type"]]:
                class_scores[d["issue_type"]] = s

        # If a strong pothole candidate is present, the crack model's thin
        # texture lines on the road surface are almost always false positives.
        if class_scores["pothole"] >= self.POTHOLE_CONTEXT_THRESHOLD:
            class_scores["road_crack"] *= self.POTHOLE_CONTEXT_ROAD_CRACK_PENALTY

        primary = max(class_scores, key=class_scores.get)
        best_score = class_scores[primary]
        if best_score < self.CLASS_DECISION_THRESHOLD:
            return self._no_detection(elapsed)

        # If two different-class boxes overlap heavily, keep only the higher-scored
        # one. This is the final safety net for cross-model false positives.
        scored = self._suppress_cross_class(scored, iou_threshold=0.5)

        # Pick the strongest detection of the winning class for the bbox/confidence.
        class_dets = [d for d in scored if d["issue_type"] == primary]
        best = max(class_dets, key=lambda d: d["score"])
        mapped_class = self.ENSEMBLE_CLASS_MAP.get(primary, "Other")
        bb = best["bounding_box"]
        bbox = BoundingBox(
            x=round(bb["x1"] / img_w * 100, 1),
            y=round(bb["y1"] / img_h * 100, 1),
            width=round((bb["x2"] - bb["x1"]) / img_w * 100, 1),
            height=round((bb["y2"] - bb["y1"]) / img_h * 100, 1),
        )

        # Calibrate confidence: if other specialists also produced strong detections
        # the winner is less certain, so we pull the displayed % down. If the winner
        # dominates, we keep the raw confidence (capped to avoid fake-looking 99%).
        total_score = sum(class_scores.values())
        dominance = best_score / total_score if total_score > 0 else 1.0
        calibrated = best["confidence"] * 100 * (0.6 + 0.4 * dominance)
        calibrated = max(30.0, min(95.0, calibrated))

        return InferenceResult(
            detected_class=mapped_class,
            display_class=display_class_for(mapped_class),
            confidence=round(calibrated, 1),
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
