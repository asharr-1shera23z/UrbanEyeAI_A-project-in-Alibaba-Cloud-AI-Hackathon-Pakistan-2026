from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.deps import get_current_officer
from app.models import Ticket, User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), _officer: User = Depends(get_current_officer)):
    all_tickets = db.query(Ticket).all()
    total_open = sum(1 for t in all_tickets if t.status != "Resolved")
    high_priority = sum(1 for t in all_tickets if t.priority == "HIGH" and t.status != "Resolved")
    in_progress = sum(1 for t in all_tickets if t.status == "In Progress")
    resolved = sum(1 for t in all_tickets if t.status == "Resolved")

    return schemas.DashboardStats(
        totalOpen=total_open,
        highPriority=high_priority,
        inProgress=in_progress,
        resolved=resolved,
    )
