from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.deps import get_current_officer
from app.models import Ticket, User

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

CATEGORY_LABELS = {
    "Pothole": "Potholes",
    "Drain": "Drains",
    "Road Damage": "Road Damage",
    "Garbage": "Garbage",
    "Damaged Pavement": "Pavement",
}
CATEGORY_COLORS = {
    "Pothole": "#2563eb",
    "Drain": "#db2777",
    "Road Damage": "#7c3aed",
    "Garbage": "#0891b2",
    "Damaged Pavement": "#16a34a",
}
STATUS_COLORS = {"Detected": "#3b82f6", "Verified": "#8b5cf6", "In Progress": "#f59e0b", "Resolved": "#16a34a"}
PRIORITY_LABELS = {"HIGH": "High", "MEDIUM": "Medium", "LOW": "Low"}
PRIORITY_COLORS = {"HIGH": "#dc2626", "MEDIUM": "#f59e0b", "LOW": "#16a34a"}


@router.get("", response_model=schemas.AnalyticsData)
def get_analytics(db: Session = Depends(get_db), _officer: User = Depends(get_current_officer)):
    tickets = db.query(Ticket).all()

    by_category_counts = Counter(t.category for t in tickets)
    by_category = [
        schemas.NamedValue(
            name=CATEGORY_LABELS.get(cat, cat), value=count, fill=CATEGORY_COLORS.get(cat, "#64748b")
        )
        for cat, count in by_category_counts.items()
    ]

    by_status_counts = Counter(t.status for t in tickets)
    by_status = [
        schemas.NamedValue(name=s, value=by_status_counts.get(s, 0), fill=STATUS_COLORS[s])
        for s in ("Detected", "Verified", "In Progress", "Resolved")
    ]

    by_priority_counts = Counter(t.priority for t in tickets)
    by_priority = [
        schemas.NamedValue(name=PRIORITY_LABELS[p], value=by_priority_counts.get(p, 0), fill=PRIORITY_COLORS[p])
        for p in ("HIGH", "MEDIUM", "LOW")
    ]

    location_counts = Counter(t.location for t in tickets)
    top_locations = [
        schemas.TopLocation(location=loc, issues=count)
        for loc, count in location_counts.most_common(7)
    ]

    trend = _weekly_trend(tickets)
    insights = _generate_insights(tickets, by_category_counts, by_priority_counts)

    return schemas.AnalyticsData(
        byCategory=by_category,
        byStatus=by_status,
        byPriority=by_priority,
        topLocations=top_locations,
        trend=trend,
        insights=insights,
    )


def _weekly_trend(tickets):
    days = [(datetime.utcnow().date() - timedelta(days=i)) for i in range(6, -1, -1)]
    labels = [d.strftime("%a") for d in days]
    reports_by_day = Counter()
    resolved_by_day = Counter()

    for t in tickets:
        created_date = t.created_at.date()
        if created_date in days:
            reports_by_day[created_date] += 1
        # Resolution date approximated from the ticket's updated_at when resolved.
        if t.status == "Resolved" and t.updated_at.date() in days:
            resolved_by_day[t.updated_at.date()] += 1

    return [
        schemas.TrendPoint(day=label, reports=reports_by_day.get(day, 0), resolved=resolved_by_day.get(day, 0))
        for day, label in zip(days, labels)
    ]


def _generate_insights(tickets, by_category_counts, by_priority_counts) -> list[str]:
    insights: list[str] = []
    if not tickets:
        return ["No reports yet — insights will appear once citizens start submitting issues."]

    if by_category_counts:
        top_cat, top_count = by_category_counts.most_common(1)[0]
        share = round((top_count / len(tickets)) * 100)
        insights.append(f"{CATEGORY_LABELS.get(top_cat, top_cat)} make up {share}% of all reports.")

    resolved = [t for t in tickets if t.status == "Resolved"]
    if resolved:
        avg_days = sum((t.updated_at - t.created_at).total_seconds() for t in resolved) / len(resolved) / 86400
        insights.append(f"Average resolution time is {avg_days:.1f} days across {len(resolved)} resolved reports.")

    high = by_priority_counts.get("HIGH", 0)
    if high:
        insights.append(f"{high} report(s) are currently flagged HIGH priority and need attention.")

    dup_count = sum(1 for t in tickets if t.duplicate_of)
    if dup_count:
        insights.append(f"{dup_count} report(s) were flagged as likely duplicates of an existing nearby ticket.")

    return insights or ["Not enough data yet for detailed insights."]
