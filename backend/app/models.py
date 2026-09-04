import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def _uuid() -> str:
    return uuid.uuid4().hex


# ---------------------------------------------------------------------------
# Users (citizens + government officers share one table, differentiated by
# `role`; officer-only columns are nullable for citizens and vice versa).
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    cnic = Column(String, unique=True, nullable=False, index=True)
    phone_number = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=False)

    # CITIZEN | FIELD_OFFICER | SUPERVISOR | DEPARTMENT_ADMIN | SYSTEM_ADMIN
    role = Column(String, nullable=False, index=True)

    # ACTIVE | SUSPENDED (citizen)
    # PENDING_VERIFICATION | PENDING_APPROVAL | APPROVED | REJECTED | SUSPENDED (officer)
    account_status = Column(String, nullable=False, index=True)
    identity_verification_status = Column(String, nullable=False, default="PENDING")

    created_at = Column(DateTime, default=datetime.utcnow)

    # --- Citizen-only fields ---
    gender = Column(String, nullable=True)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    district = Column(String, nullable=True)
    area = Column(String, nullable=True)
    address = Column(String, nullable=True)

    # --- Officer-only fields ---
    employee_id = Column(String, nullable=True, unique=True, index=True)
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    jurisdiction_province = Column(String, nullable=True)
    jurisdiction_city = Column(String, nullable=True)
    jurisdiction_district = Column(String, nullable=True)
    jurisdiction_zone = Column(String, nullable=True)
    jurisdiction_department = Column(String, nullable=True)
    gov_verification_status = Column(String, nullable=True)
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    tickets = relationship("Ticket", back_populates="citizen")
    notifications = relationship("Notification", back_populates="user")


# ---------------------------------------------------------------------------
# Tickets
# ---------------------------------------------------------------------------
class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, default=_uuid)
    ticket_id = Column(String, unique=True, nullable=False, index=True)  # e.g. CIV-1042
    citizen_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)

    category = Column(String, nullable=False, index=True)
    original_category = Column(String, nullable=True)  # AI's original call, if an officer corrected it
    category_corrected = Column(Boolean, default=False)

    description = Column(Text, default="")
    image_url = Column(String, nullable=False)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(String, nullable=False)

    priority = Column(String, nullable=False, index=True)  # LOW | MEDIUM | HIGH
    severity = Column(String, nullable=False)  # LOW | MEDIUM | HIGH | CRITICAL
    status = Column(String, nullable=False, default="Detected", index=True)
    confidence = Column(Float, nullable=False)

    bbox_x = Column(Float, nullable=True)
    bbox_y = Column(Float, nullable=True)
    bbox_width = Column(Float, nullable=True)
    bbox_height = Column(Float, nullable=True)

    duplicate_of = Column(String, nullable=True)  # ticket_id of the earlier/original report, if any
    nearby_similar_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    citizen = relationship("User", back_populates="tickets")
    status_history = relationship(
        "StatusEvent", back_populates="ticket", order_by="StatusEvent.timestamp", cascade="all, delete-orphan"
    )
    notes = relationship(
        "TicketNote", back_populates="ticket", order_by="TicketNote.timestamp", cascade="all, delete-orphan"
    )


class StatusEvent(Base):
    __tablename__ = "status_events"

    id = Column(String, primary_key=True, default=_uuid)
    ticket_pk = Column(String, ForeignKey("tickets.id"), nullable=False, index=True)
    status = Column(String, nullable=False)
    note = Column(Text, default="")
    timestamp = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="status_history")


class TicketNote(Base):
    __tablename__ = "ticket_notes"

    id = Column(String, primary_key=True, default=_uuid)
    ticket_pk = Column(String, ForeignKey("tickets.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    author = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="notes")


# ---------------------------------------------------------------------------
# Notifications (in-app now; same table can back email delivery later —
# just add a `channel`/`sent_at` pair and a background sender).
# ---------------------------------------------------------------------------
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    ticket_id = Column(String, nullable=True)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
