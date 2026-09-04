"""
Priority scoring + duplicate/near-duplicate detection.

Priority combines:
  1. AI confidence for the detected class
  2. Defect size (bounding-box area, as a proxy for how large/severe the
     physical defect is)
  3. "Location importance" — a lightweight heuristic keyword match against
     the reported location string (main roads / markets / hospitals etc.
     are weighted higher; this is a stand-in for a real GIS road-class or
     points-of-interest layer)
  4. Nearby recent reports of the same category (a cluster of independent
     reports for the same issue is itself a signal of real-world severity)
"""
import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Ticket

HIGH_IMPORTANCE_KEYWORDS = [
    "hospital", "school", "market", "markaz", "highway", "motorway",
    "blue area", "main", "intersection", "junction", "chowk",
]

UNRESOLVED_STATUSES = ("Detected", "Verified", "In Progress")


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0  # Earth radius, meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def find_nearby_similar(
    db: Session,
    category: str,
    latitude: float,
    longitude: float,
    exclude_ticket_pk: Optional[str] = None,
) -> List[Ticket]:
    """Coarse bounding-box pre-filter in SQL, then an exact haversine check
    in Python (fine at MVP scale; swap for a PostGIS ST_DWithin query when
    running on Postgres/PostGIS)."""
    window_start = datetime.utcnow() - timedelta(days=settings.DUPLICATE_WINDOW_DAYS)
    # ~1 degree of latitude is ~111km; give ourselves generous slack before
    # the precise haversine filter below.
    deg_slack = max(settings.DUPLICATE_RADIUS_METERS / 111_000.0, 0.001) * 3

    query = (
        db.query(Ticket)
        .filter(Ticket.category == category)
        .filter(Ticket.status.in_(UNRESOLVED_STATUSES))
        .filter(Ticket.created_at >= window_start)
        .filter(Ticket.latitude.between(latitude - deg_slack, latitude + deg_slack))
        .filter(Ticket.longitude.between(longitude - deg_slack, longitude + deg_slack))
    )
    if exclude_ticket_pk:
        query = query.filter(Ticket.id != exclude_ticket_pk)

    candidates = query.all()
    return [
        t
        for t in candidates
        if haversine_meters(latitude, longitude, t.latitude, t.longitude) <= settings.DUPLICATE_RADIUS_METERS
    ]


def location_importance_score(location: str) -> float:
    loc = (location or "").lower()
    return 1.0 if any(kw in loc for kw in HIGH_IMPORTANCE_KEYWORDS) else 0.0


def bbox_area_fraction(bbox_width: Optional[float], bbox_height: Optional[float]) -> float:
    """Bounding box dimensions are stored as 0-100 (% of image); returns the
    covered area as a 0-1 fraction."""
    if bbox_width is None or bbox_height is None:
        return 0.0
    return max(0.0, min(1.0, (bbox_width / 100.0) * (bbox_height / 100.0)))


@dataclass
class ScoredPriority:
    severity: str
    priority: str
    score: float


def compute_severity_and_priority(
    confidence: float,
    bbox_width: Optional[float],
    bbox_height: Optional[float],
    location: str,
    nearby_count: int,
    category: Optional[str] = None,
) -> ScoredPriority:
    area = bbox_area_fraction(bbox_width, bbox_height)
    importance = location_importance_score(location)

    # Weighted composite score, 0-100-ish.
    score = (
        confidence * 0.5
        + area * 100 * 0.25
        + importance * 15
        + min(nearby_count, 5) * 5
    )

    # Class-aware severity: dangerous road damage must not be downgraded to MEDIUM
    # just because confidence is moderate, because a large damaged area is itself a
    # severe safety hazard.
    if category == "Road Damage":
        if confidence >= 80 and area >= 0.15:
            severity = "CRITICAL"
        elif confidence >= 65 or area >= 0.10:
            severity = "HIGH"
        elif confidence >= 45 or area >= 0.04:
            severity = "MEDIUM"
        else:
            severity = "LOW"
    else:
        if confidence >= 85 and area >= 0.12:
            severity = "CRITICAL"
        elif confidence >= 75 or area >= 0.15:
            severity = "HIGH"
        elif confidence >= 55 or area >= 0.06:
            severity = "MEDIUM"
        else:
            severity = "LOW"

    if score >= 70:
        priority = "HIGH"
    elif score >= 45:
        priority = "MEDIUM"
    else:
        priority = "LOW"

    return ScoredPriority(severity=severity, priority=priority, score=round(score, 1))
