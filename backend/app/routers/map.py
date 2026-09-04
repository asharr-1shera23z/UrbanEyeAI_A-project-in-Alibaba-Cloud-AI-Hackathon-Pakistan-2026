import math
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import schemas
from app.converters import ticket_to_map_issue
from app.database import get_db
from app.deps import get_current_user
from app.models import Ticket, User

router = APIRouter(prefix="/api/map", tags=["map"])


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return the great-circle distance between two lat/lng points in kilometres."""
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@router.get("/issues", response_model=List[schemas.MapIssue])
def get_map_issues(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[float] = Query(default=None, ge=1.0, le=100.0),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),  # citizens see the public map, officers the admin map
):
    query = db.query(Ticket)
    if category and category != "All":
        query = query.filter(Ticket.category == category)
    if priority and priority != "All":
        query = query.filter(Ticket.priority == priority)
    if status and status != "All":
        query = query.filter(Ticket.status == status)

    issues = [ticket_to_map_issue(t) for t in query.all()]

    if lat is not None and lng is not None and radius is not None:
        issues = [i for i in issues if _haversine_km(lat, lng, i.latitude, i.longitude) <= radius]

    return issues
