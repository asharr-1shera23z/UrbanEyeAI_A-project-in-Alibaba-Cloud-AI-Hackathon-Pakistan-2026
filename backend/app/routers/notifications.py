from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.deps import get_current_user
from app.models import Notification, User

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[schemas.NotificationOut])
def list_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    notes = (
        db.query(Notification)
        .filter(Notification.user_id == user.user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        schemas.NotificationOut(
            id=n.id, ticketId=n.ticket_id, message=n.message, isRead=n.is_read, createdAt=n.created_at.isoformat() + "Z"
        )
        for n in notes
    ]


@router.post("/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_read(notification_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user.user_id)
        .first()
    )
    if note:
        note.is_read = True
        db.commit()
        db.refresh(note)
    return schemas.NotificationOut(
        id=note.id, ticketId=note.ticket_id, message=note.message, isRead=note.is_read, createdAt=note.created_at.isoformat() + "Z"
    )
