from app.models import Ticket as TicketModel
from app.models import User
from app import schemas


def user_to_session_user(user: User) -> schemas.SessionUser:
    jurisdiction = None
    if user.role != "CITIZEN" and user.jurisdiction_province:
        jurisdiction = schemas.Jurisdiction(
            province=user.jurisdiction_province,
            city=user.jurisdiction_city or "",
            district=user.jurisdiction_district,
            zone=user.jurisdiction_zone,
            department=user.jurisdiction_department,
        )
    return schemas.SessionUser(
        userId=user.user_id,
        fullName=user.full_name,
        email=user.email,
        role=user.role,
        accountStatus=user.account_status,
        jurisdiction=jurisdiction,
        department=user.department if user.role != "CITIZEN" else None,
        designation=user.designation if user.role != "CITIZEN" else None,
        employeeId=user.employee_id if user.role != "CITIZEN" else None,
    )


def user_to_officer_status(user: User) -> schemas.OfficerStatusResponse:
    jurisdiction = None
    if user.jurisdiction_province:
        jurisdiction = schemas.Jurisdiction(
            province=user.jurisdiction_province,
            city=user.jurisdiction_city or "",
            district=user.jurisdiction_district,
            zone=user.jurisdiction_zone,
            department=user.jurisdiction_department,
        )
    return schemas.OfficerStatusResponse(
        userId=user.user_id,
        fullName=user.full_name,
        email=user.email,
        accountStatus=user.account_status,
        role=user.role,
        department=user.department,
        designation=user.designation,
        employeeId=user.employee_id,
        jurisdiction=jurisdiction,
    )


def ticket_to_schema(ticket: TicketModel) -> schemas.Ticket:
    return schemas.Ticket(
        id=ticket.id,
        ticketId=ticket.ticket_id,
        category=ticket.category,
        description=ticket.description or "",
        imageUrl=ticket.image_url,
        latitude=ticket.latitude,
        longitude=ticket.longitude,
        location=ticket.location,
        priority=ticket.priority,
        severity=ticket.severity,
        status=ticket.status,
        confidence=ticket.confidence,
        createdAt=ticket.created_at.isoformat() + "Z",
        updatedAt=ticket.updated_at.isoformat() + "Z",
        statusHistory=[
            schemas.StatusEvent(status=e.status, timestamp=e.timestamp.isoformat() + "Z", note=e.note or "")
            for e in ticket.status_history
        ],
        notes=[
            schemas.TicketNote(id=n.id, text=n.text, author=n.author, timestamp=n.timestamp.isoformat() + "Z")
            for n in ticket.notes
        ],
        isDuplicate=bool(ticket.duplicate_of),
        duplicateOfTicketId=ticket.duplicate_of,
        nearbySimilarCount=ticket.nearby_similar_count or 0,
    )


def ticket_to_map_issue(ticket: TicketModel) -> schemas.MapIssue:
    return schemas.MapIssue(
        id=ticket.id,
        ticketId=ticket.ticket_id,
        category=ticket.category,
        latitude=ticket.latitude,
        longitude=ticket.longitude,
        priority=ticket.priority,
        status=ticket.status,
        location=ticket.location,
    )
