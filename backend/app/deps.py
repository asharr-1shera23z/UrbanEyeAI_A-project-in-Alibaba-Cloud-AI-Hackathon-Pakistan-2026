from typing import Iterable, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = db.query(User).filter(User.user_id == payload["sub"]).first()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")
    return user


def get_current_citizen(user: User = Depends(get_current_user)) -> User:
    if user.role != "CITIZEN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Citizen account required")
    if user.account_status != "ACTIVE":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Citizen account is not active")
    return user


OFFICER_ROLES = {"FIELD_OFFICER", "SUPERVISOR", "DEPARTMENT_ADMIN", "SYSTEM_ADMIN"}


def get_current_officer(user: User = Depends(get_current_user)) -> User:
    if user.role not in OFFICER_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Government officer account required")
    if user.account_status != "APPROVED":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Officer account is not approved")
    return user


def require_roles(roles: Iterable[str]):
    allowed = set(roles)

    def _dep(user: User = Depends(get_current_officer)) -> User:
        if user.role not in allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have permission for this action")
        return user

    return _dep
