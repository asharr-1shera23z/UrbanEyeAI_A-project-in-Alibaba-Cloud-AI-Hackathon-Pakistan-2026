"""
Urban Eye AI - 3-class ensemble: Pothole, Crack, Garbage.
Loads ONNX models and runs them sequentially on CPU.
"""
import json
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict
from ultralytics import YOLO


class UrbanEyeAI:
    # Maps your requested class name -> output class name
    CLASS_MAP = {
        "pothole": "pothole",
        "crack": "road_crack",
        "garbage": "garbage",     # model calls it 'litter', we rename below
    }

    # Matches your scope document class IDs
    CLASS_IDS = {
        "pothole": 0,
        "road_crack": 1,
        "garbage": 2,
    }

    # Tune these after testing on your images
    CONF_THRESHOLDS = {
        "pothole": 0.50,    # balanced: catches clear potholes, skips weak noise
        "crack": 0.25,      # lowered because cazzz307 outputs lower confidences
        "garbage": 0.20,    # lowered because esapzoi scores dumps weakly
    }

    # Max detections per issue type per image (keeps output clean)
    MAX_DETECTIONS_PER_CLASS = {
        "pothole": 5,
        "road_crack": 5,
        "garbage": 5,
    }

    # Samdutse pothole model is single-class; cazzz307 and esapzoi are single-class too
    CLASS_FILTER = {
        "pothole": None,
        "crack":   None,
        "garbage": None,
    }

    # Bounding box colors per issue type (BGR) for annotated output
    BOX_COLORS = {
        "pothole": (0, 0, 255),      # red
        "road_crack": (0, 165, 255), # orange
        "garbage": (0, 255, 0),      # green
    }

    def __init__(self, model_dir: str = "models", use_onnx: bool = True):
        self.model_dir = Path(model_dir)
        self.models: Dict[str, YOLO] = {}
        self.suffix = "onnx" if use_onnx else "pt"
        self.output_dir = Path("output")
        self.output_dir.mkdir(exist_ok=True)

        for cls in self.CLASS_MAP:
            weight_path = self.model_dir / cls / f"best.{self.suffix}"
            if not weight_path.exists():
                raise FileNotFoundError(
                    f"Missing model for '{cls}': {weight_path}\n"
                    f"Run first: python download_models.py, then python export_onnx.py"
                )
            print(f"Loading {cls}: {weight_path}")
            self.models[cls] = YOLO(str(weight_path))

    def predict(self, image_path: str | Path) -> Dict:
        image_path = Path(image_path)
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")

        h, w = img.shape[:2]
        img_area = h * w

        # Run all 3 specialists one by one
        all_detections: List[Dict] = []
        for cls, model in self.models.items():
            results = model(
                str(image_path),
                conf=self.CONF_THRESHOLDS[cls],
                iou=0.45,
                verbose=False,
            )
            for r in results:
                if r.boxes is None or len(r.boxes) == 0:
                    continue
                for box in r.boxes:
                    # Skip detections that this specialist model should ignore
                    box_cls = int(box.cls[0])
                    class_filter = self.CLASS_FILTER[cls]
                    if class_filter is not None and box_cls not in class_filter:
                        continue

                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(float)
                    conf = float(box.conf[0])

                    output_class = self.CLASS_MAP[cls]
                    all_detections.append({
                        "issue_type": output_class,
                        "class_id": self.CLASS_IDS[output_class],
                        "confidence": round(conf, 4),
                        "bounding_box": {
                            "x1": int(x1), "y1": int(y1),
                            "x2": int(x2), "y2": int(y2),
                        },
                    })

        # Merge overlapping boxes: highest confidence wins
        merged = self._nms(all_detections, iou_threshold=0.5)

        # Keep only top-N detections per class to reduce noise
        merged = self._apply_top_n_per_class(merged)

        # Severity from your scope doc
        for det in merged:
            bbox = det["bounding_box"]
            bbox_area = (bbox["x2"] - bbox["x1"]) * (bbox["y2"] - bbox["y1"])
            ratio = bbox_area / img_area
            if ratio < 0.05:
                det["severity"] = "low"
            elif ratio < 0.15:
                det["severity"] = "medium"
            else:
                det["severity"] = "high"

        return {
            "status": "success",
            "image": image_path.name,
            "annotated_image": self._annotate(img, merged, image_path.name),
            "summary": self._summarize(merged),
            "detections": merged,
        }

    def _summarize(self, detections: List[Dict]) -> Dict:
        """Single primary category + counts for validation/priority engines."""
        if not detections:
            return {
                "primary_issue_type": None,
                "primary_confidence": None,
                "detection_count": 0,
                "severity_counts": {"low": 0, "medium": 0, "high": 0},
            }

        primary = max(detections, key=lambda d: d["confidence"])
        severity_counts = {"low": 0, "medium": 0, "high": 0}
        for det in detections:
            severity_counts[det["severity"]] += 1

        return {
            "primary_issue_type": primary["issue_type"],
            "primary_confidence": primary["confidence"],
            "detection_count": len(detections),
            "severity_counts": severity_counts,
        }

    def _annotate(self, img: np.ndarray, detections: List[Dict], image_name: str) -> str:
        """Draw boxes + labels on a copy of the image, save to output/."""
        annotated = img.copy()
        for det in detections:
            bbox = det["bounding_box"]
            x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
            color = self.BOX_COLORS.get(det["issue_type"], (255, 255, 255))

            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            label = f"{det['issue_type']} {det['confidence']:.0%} ({det['severity']})"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            label_y1 = max(0, y1 - th - 8)
            cv2.rectangle(
                annotated,
                (x1, label_y1), (x1 + tw + 4, label_y1 + th + 4),
                color, -1,
            )
            cv2.putText(
                annotated, label, (x1 + 2, label_y1 + th + 2),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA,
            )

        out_path = self.output_dir / f"annotated_{image_name}"
        cv2.imwrite(str(out_path), annotated)
        return str(out_path)

    @staticmethod
    def _nms(detections: List[Dict], iou_threshold: float = 0.5) -> List[Dict]:
        if not detections:
            return []

        boxes = np.array([
            [d["bounding_box"]["x1"], d["bounding_box"]["y1"],
             d["bounding_box"]["x2"], d["bounding_box"]["y2"]]
            for d in detections
        ], dtype=float)
        scores = np.array([d["confidence"] for d in detections], dtype=float)

        indices = cv2.dnn.NMSBoxes(
            boxes.tolist(),
            scores.tolist(),
            score_threshold=0.0,
            nms_threshold=iou_threshold,
        )

        if len(indices) == 0:
            return []

        return [detections[int(i)] for i in indices.flatten()]

    @staticmethod
    def _apply_top_n_per_class(
        detections: List[Dict],
        max_per_class: Dict[str, int] | None = None,
    ) -> List[Dict]:
        if not detections:
            return []

        max_per_class = max_per_class or UrbanEyeAI.MAX_DETECTIONS_PER_CLASS

        grouped: Dict[str, List[Dict]] = {}
        for det in detections:
            grouped.setdefault(det["issue_type"], []).append(det)

        filtered: List[Dict] = []
        for issue_type, dets in grouped.items():
            limit = max_per_class.get(issue_type)
            if limit is None:
                filtered.extend(dets)
                continue
            dets_sorted = sorted(dets, key=lambda d: d["confidence"], reverse=True)
            filtered.extend(dets_sorted[:limit])

        return filtered


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python urban_eye.py <image_path>")
        sys.exit(1)

    eye = UrbanEyeAI()
    result = eye.predict(sys.argv[1])
    print(json.dumps(result, indent=2))
