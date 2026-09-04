from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import schemas
from app.converters import ticket_to_schema
from app.database import get_db
from app.deps import get_current_citizen, get_current_officer, get_current_user
from app.models import StatusEvent, Ticket, TicketNote, User
from app.services import storage
from app.services.ai_inference import get_ai_engine
from app.services.notifications import notify
from app.services.priority import compute_severity_and_priority, find_nearby_similar

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


def _next_ticket_number(db: Session) -> int:
    max_num = db.query(func.max(Ticket.ticket_id)).scalar()
    if not max_num:
        return 1042
    try:
        return int(max_num.split("-")[-1]) + 1
    except (ValueError, IndexError):
        return 1042 + db.query(Ticket).count()


@router.post("", response_model=schemas.SubmitReportResponse)
def submit_report(
    payload: schemas.SubmitReportInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_citizen),
):
    image_bytes, _ext = storage.decode_data_url(payload.image)
    image_url = storage.save_image(payload.image)

    # Server is the source of truth for the AI classification — re-run
    # inference rather than trusting whatever the client posts back, even
    # though the client typically already called /api/ai/analyze on the same
    # image (the mock/real engine is deterministic per-image, so results match).
    engine = get_ai_engine()
    result = engine.analyze(image_bytes)
    bbox = result.bounding_box

    nearby = find_nearby_similar(db, result.detected_class, payload.latitude, payload.longitude)
    scored = compute_severity_and_priority(
        confidence=result.confidence,
        bbox_width=bbox.width if bbox else None,
        bbox_height=bbox.height if bbox else None,
        location=payload.location,
        nearby_count=len(nearby),
        category=result.detected_class,
    )

    ticket_id = f"CIV-{_next_ticket_number(db)}"
    now = datetime.utcnow()

    ticket = Ticket(
        ticket_id=ticket_id,
        citizen_id=user.user_id,
        category=result.detected_class,
        description=payload.description or "",
        image_url=image_url,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location=payload.location,
        priority=scored.priority,
        severity=scored.severity,
        status="Detected",
        confidence=result.confidence,
        bbox_x=bbox.x if bbox else None,
        bbox_y=bbox.y if bbox else None,
        bbox_width=bbox.width if bbox else None,
        bbox_height=bbox.height if bbox else None,
        duplicate_of=nearby[0].ticket_id if nearby else None,
        nearby_similar_count=len(nearby),
        created_at=now,
        updated_at=now,
    )
    db.add(ticket)
    db.flush()  # get ticket.id for the FK below

    db.add(
        StatusEvent(
            ticket_pk=ticket.id,
            status="Detected",
            note="Report received and AI analysis completed.",
            timestamp=now,
        )
    )
    db.commit()

    notify(db, user.user_id, f"Your report {ticket_id} was received and is being reviewed.", ticket_id)

    return schemas.SubmitReportResponse(
        ticketId=ticket_id,
        isDuplicate=bool(nearby),
        duplicateOfTicketId=nearby[0].ticket_id if nearby else None,
        nearbySimilarCount=len(nearby),
    )


@router.get("", response_model=List[schemas.Ticket])
def list_tickets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Ticket).order_by(Ticket.created_at.desc())
    if user.role == "CITIZEN":
        query = query.filter(Ticket.citizen_id == user.user_id)
    # else: any approved officer role can see all tickets (dashboard/complaints list)
    return [ticket_to_schema(t) for t in query.all()]


def _get_ticket_or_404(db: Session, ticket_id: str, user: User) -> Ticket:
    ticket = (
        db.query(Ticket)
        .filter((Ticket.ticket_id == ticket_id) | (Ticket.id == ticket_id))
        .first()
    )
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    if user.role == "CITIZEN" and ticket.citizen_id != user.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    return ticket


@router.get("/{ticket_id}", response_model=schemas.Ticket)
def get_ticket(ticket_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ticket = _get_ticket_or_404(db, ticket_id, user)
    return ticket_to_schema(ticket)


@router.patch("/{ticket_id}/status", response_model=schemas.UpdateResult)
def update_status(
    ticket_id: str,
    payload: schemas.UpdateStatusInput,
    db: Session = Depends(get_db),
    officer: User = Depends(get_current_officer),
):
    ticket = _get_ticket_or_404(db, ticket_id, officer)
    ticket.status = payload.status
    ticket.updated_at = datetime.utcnow()

    default_notes = {
        "Detected": "Report received and AI analysis completed.",
        "Verified": "Verified by field inspector.",
        "In Progress": "Work order assigned to maintenance team.",
        "Resolved": "Issue resolved. Maintenance work completed.",
    }
    db.add(
        StatusEvent(
            ticket_pk=ticket.id,
            status=payload.status,
            note=payload.note or default_notes.get(payload.status, "Status updated."),
            timestamp=ticket.updated_at,
        )
    )
    db.commit()

    notify(db, ticket.citizen_id, f"Your report {ticket.ticket_id} is now '{payload.status}'.", ticket.ticket_id)
    return schemas.UpdateResult(success=True)


@router.post("/{ticket_id}/notes", response_model=schemas.TicketNote)
def add_note(
    ticket_id: str,
    payload: schemas.AddNoteInput,
    db: Session = Depends(get_db),
    officer: User = Depends(get_current_officer),
):
    ticket = _get_ticket_or_404(db, ticket_id, officer)
    note = TicketNote(ticket_pk=ticket.id, text=payload.text.strip(), author=officer.full_name)
    db.add(note)
    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return schemas.TicketNote(id=note.id, text=note.text, author=note.author, timestamp=note.timestamp.isoformat() + "Z")


@router.patch("/{ticket_id}/category", response_model=schemas.Ticket)
def correct_category(
    ticket_id: str,
    payload: schemas.CorrectCategoryInput,
    db: Session = Depends(get_db),
    officer: User = Depends(get_current_officer),
):
    ticket = _get_ticket_or_404(db, ticket_id, officer)
    if not ticket.category_corrected:
        ticket.original_category = ticket.category
    ticket.category = payload.category
    ticket.category_corrected = True
    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket_to_schema(ticket)
