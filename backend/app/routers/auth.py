from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import schemas
from app.converters import user_to_officer_status, user_to_session_user
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

OFFICER_ROLES = {"FIELD_OFFICER", "SUPERVISOR", "DEPARTMENT_ADMIN", "SYSTEM_ADMIN"}


def role_for_designation(designation: str) -> str:
    """Mirrors src/data/locations.ts#roleForDesignation — a rough heuristic
    mapping a chosen designation to an internal role. A production system
    would let a System Admin assign the role explicitly on approval."""
    d = designation.lower()
    if "system administrator" in d:
        return "SYSTEM_ADMIN"
    if "department administrator" in d or "deputy director" in d or "assistant director" in d:
        return "DEPARTMENT_ADMIN"
    if "supervisor" in d:
        return "SUPERVISOR"
    return "FIELD_OFFICER"


def _err(code: str, message: str, http_status: int = status.HTTP_400_BAD_REQUEST):
    return HTTPException(status_code=http_status, detail={"code": code, "message": message})


@router.post("/citizen/register", response_model=schemas.AuthResponse)
def register_citizen(payload: schemas.CitizenRegistrationInput, db: Session = Depends(get_db)):
    exists = (
        db.query(User)
        .filter((User.email == payload.email.lower()) | (User.cnic == payload.cnic))
        .first()
    )
    if exists:
        raise _err("INVALID_CREDENTIALS", "An account with this email or CNIC already exists.", status.HTTP_409_CONFLICT)

    user = User(
        full_name=payload.fullName,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        cnic=payload.cnic,
        phone_number=payload.phoneNumber,
        date_of_birth=payload.dateOfBirth,
        role="CITIZEN",
        account_status="ACTIVE",
        identity_verification_status="DEMO_VERIFIED",
        gender=payload.gender,
        province=payload.province,
        city=payload.city,
        district=payload.district,
        area=payload.area,
        address=payload.address,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.user_id, user.role)
    return schemas.AuthResponse(token=token, user=user_to_session_user(user))


@router.post("/citizen/login", response_model=schemas.AuthResponse)
def login_citizen(payload: schemas.LoginInput, db: Session = Depends(get_db)):
    identifier = payload.identifier.strip().lower()
    user = (
        db.query(User)
        .filter(User.role == "CITIZEN")
        .filter((User.email == identifier) | (User.cnic == payload.identifier.strip()))
        .first()
    )
    if not user:
        raise _err("NOT_FOUND", "No citizen account found for those details.", status.HTTP_404_NOT_FOUND)
    if not verify_password(payload.password, user.password_hash):
        raise _err("INVALID_CREDENTIALS", "Incorrect password. Please try again.", status.HTTP_401_UNAUTHORIZED)
    if user.account_status == "SUSPENDED":
        raise _err("SUSPENDED", "This account has been suspended.", status.HTTP_403_FORBIDDEN)

    token = create_access_token(user.user_id, user.role)
    return schemas.AuthResponse(token=token, user=user_to_session_user(user))


@router.post("/officer/request-access", response_model=schemas.SessionUser)
def request_gov_access(payload: schemas.OfficerRegistrationInput, db: Session = Depends(get_db)):
    exists = (
        db.query(User)
        .filter(
            (User.email == payload.officialEmail.lower())
            | (User.cnic == payload.cnic)
            | (User.employee_id == payload.employeeId)
        )
        .first()
    )
    if exists:
        raise _err("INVALID_CREDENTIALS", "An account with this email or CNIC already exists.", status.HTTP_409_CONFLICT)

    role = role_for_designation(payload.designation)
    user = User(
        full_name=payload.fullName,
        email=payload.officialEmail.lower(),
        password_hash=hash_password(payload.password),
        cnic=payload.cnic,
        phone_number=payload.officialPhoneNumber,
        date_of_birth=payload.dateOfBirth,
        role=role,
        account_status="PENDING_APPROVAL",
        identity_verification_status="DEMO_VERIFIED",
        employee_id=payload.employeeId,
        department=payload.department,
        designation=payload.designation,
        grade=payload.grade,
        jurisdiction_province=payload.province,
        jurisdiction_city=payload.city,
        jurisdiction_district=payload.district,
        jurisdiction_zone=payload.zone,
        jurisdiction_department=payload.department,
        gov_verification_status="DEMO_VERIFIED",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_session_user(user)


@router.post("/officer/login", response_model=schemas.AuthResponse)
def login_officer(payload: schemas.LoginInput, db: Session = Depends(get_db)):
    identifier = payload.identifier.strip().lower()
    user = (
        db.query(User)
        .filter(User.role.in_(OFFICER_ROLES))
        .filter((User.email == identifier) | (User.employee_id == payload.identifier.strip()))
        .first()
    )
    if not user:
        raise _err("NOT_FOUND", "No government officer account found for those details.", status.HTTP_404_NOT_FOUND)
    if not verify_password(payload.password, user.password_hash):
        raise _err("INVALID_CREDENTIALS", "Incorrect password. Please try again.", status.HTTP_401_UNAUTHORIZED)

    if user.account_status == "PENDING_VERIFICATION":
        raise _err("PENDING_VERIFICATION", "Your access request is still being verified.", status.HTTP_403_FORBIDDEN)
    if user.account_status == "PENDING_APPROVAL":
        raise _err("PENDING_APPROVAL", "Your access request is awaiting administrator approval.", status.HTTP_403_FORBIDDEN)
    if user.account_status == "REJECTED":
        raise _err("REJECTED", "Your access request was not approved. Contact your department admin.", status.HTTP_403_FORBIDDEN)
    if user.account_status == "SUSPENDED":
        raise _err("SUSPENDED", "This account has been suspended.", status.HTTP_403_FORBIDDEN)

    token = create_access_token(user.user_id, user.role)
    return schemas.AuthResponse(token=token, user=user_to_session_user(user))


@router.get("/officer/status/{user_id}", response_model=schemas.OfficerStatusResponse)
def officer_status(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id, User.role.in_(OFFICER_ROLES)).first()
    if not user:
        raise _err("NOT_FOUND", "Application not found.", status.HTTP_404_NOT_FOUND)
    return user_to_officer_status(user)


@router.post("/officer/approve/{user_id}", response_model=schemas.AuthResponse)
def approve_officer_demo(user_id: str, db: Session = Depends(get_db)):
    """DEMO ONLY: stands in for a System Admin/Supervisor clicking "approve"
    in a real back-office tool, matching the original prototype's demo
    approval button. In production this must require a SYSTEM_ADMIN or
    SUPERVISOR-authenticated caller instead of being open."""
    user = db.query(User).filter(User.user_id == user_id, User.role.in_(OFFICER_ROLES)).first()
    if not user:
        raise _err("NOT_FOUND", "Application not found.", status.HTTP_404_NOT_FOUND)
    user.account_status = "APPROVED"
    user.reviewed_by = "Demo System Admin"
    user.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    token = create_access_token(user.user_id, user.role)
    return schemas.AuthResponse(token=token, user=user_to_session_user(user))


@router.get("/me", response_model=schemas.SessionUser)
def get_me(user: User = Depends(get_current_user)):
    return user_to_session_user(user)
