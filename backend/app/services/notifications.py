"""
Simple in-app notification mechanism.

Structured so a real delivery channel (email/SMS/push) can be added later
without touching call sites: `notify()` is the single entry point every
router calls; swap/extend its body to also enqueue an email job, etc.
"""
from sqlalchemy.orm import Session

from app.models import Notification


def notify(db: Session, user_id: str, message: str, ticket_id: str | None = None) -> Notification:
    note = Notification(user_id=user_id, ticket_id=ticket_id, message=message)
    db.add(note)
    db.commit()
    db.refresh(note)
    # TODO(email): once an email provider is configured, also send here, e.g.
    #   email_service.send(user.email, subject=..., body=message)
    return note
