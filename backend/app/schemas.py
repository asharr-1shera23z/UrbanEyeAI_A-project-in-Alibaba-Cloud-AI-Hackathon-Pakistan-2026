"""
Pydantic schemas.

Field names intentionally mirror the existing frontend TypeScript types in
src/types/index.ts and src/types/auth.ts (camelCase) so the response bodies
can be dropped straight into the existing UI without renaming anything on
either side.
"""
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field

IssueCategory = Literal[
    "Pothole", "Drain", "Road Damage", "Garbage", "Damaged Pavement"
]
Severity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
Priority = Literal["LOW", "MEDIUM", "HIGH"]
TicketStatus = Literal["Detected", "Verified", "In Progress", "Resolved"]
GovRole = Literal["FIELD_OFFICER", "SUPERVISOR", "DEPARTMENT_ADMIN", "SYSTEM_ADMIN"]
AppRole = Literal["CITIZEN", "FIELD_OFFICER", "SUPERVISOR", "DEPARTMENT_ADMIN", "SYSTEM_ADMIN"]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class Jurisdiction(BaseModel):
    province: str
    city: str
    district: Optional[str] = None
    zone: Optional[str] = None
    sector: Optional[str] = None
    department: Optional[str] = None


class SessionUser(BaseModel):
    userId: str
    fullName: str
    email: str
    role: AppRole
    accountStatus: str
    jurisdiction: Optional[Jurisdiction] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    employeeId: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    user: SessionUser


class CitizenRegistrationInput(BaseModel):
    fullName: str
    cnic: str
    dateOfBirth: str
    gender: str
    phoneNumber: str
    email: EmailStr
    province: str
    city: str
    district: str
    area: str
    address: str
    password: str = Field(min_length=6)


class OfficerRegistrationInput(BaseModel):
    fullName: str
    cnic: str
    dateOfBirth: str
    officialPhoneNumber: str
    officialEmail: EmailStr
    employeeId: str
    department: str
    designation: str
    grade: str
    province: str
    city: str
    district: str
    zone: str
    govOffice: Optional[str] = None
    password: str = Field(min_length=6)


class LoginInput(BaseModel):
    identifier: str
    password: str


class OfficerStatusResponse(BaseModel):
    userId: str
    fullName: str
    email: str
    accountStatus: str
    role: AppRole
    department: Optional[str] = None
    designation: Optional[str] = None
    employeeId: Optional[str] = None
    jurisdiction: Optional[Jurisdiction] = None


# ---------------------------------------------------------------------------
# AI
# ---------------------------------------------------------------------------
class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class AIAnalysis(BaseModel):
    detectedClass: IssueCategory
    displayClass: str
    confidence: float
    severity: Severity
    priority: Priority
    description: str
    boundingBox: Optional[BoundingBox] = None


class AnalyzeImageInput(BaseModel):
    image: str  # data:image/...;base64,... or a raw base64 string


# ---------------------------------------------------------------------------
# Tickets
# ---------------------------------------------------------------------------
class SubmitReportInput(BaseModel):
    image: str
    latitude: float
    longitude: float
    location: str
    description: Optional[str] = ""
    aiAnalysis: Optional[AIAnalysis] = None  # optional — server re-derives authoritatively


class SubmitReportResponse(BaseModel):
    ticketId: str
    isDuplicate: bool = False
    duplicateOfTicketId: Optional[str] = None
    nearbySimilarCount: int = 0


class StatusEvent(BaseModel):
    status: TicketStatus
    timestamp: str
    note: str


class TicketNote(BaseModel):
    id: str
    text: str
    author: str
    timestamp: str


class Ticket(BaseModel):
    id: str
    ticketId: str
    category: IssueCategory
    description: str
    imageUrl: str
    latitude: float
    longitude: float
    location: str
    priority: Priority
    severity: Severity
    status: TicketStatus
    confidence: float
    createdAt: str
    updatedAt: str
    statusHistory: List[StatusEvent]
    notes: List[TicketNote]
    isDuplicate: bool = False
    duplicateOfTicketId: Optional[str] = None
    nearbySimilarCount: int = 0


class UpdateStatusInput(BaseModel):
    status: TicketStatus
    note: Optional[str] = None


class AddNoteInput(BaseModel):
    text: str


class CorrectCategoryInput(BaseModel):
    category: IssueCategory


class UpdateResult(BaseModel):
    success: bool


# ---------------------------------------------------------------------------
# Map / dashboard / analytics
# ---------------------------------------------------------------------------
class MapIssue(BaseModel):
    id: str
    ticketId: str
    category: IssueCategory
    latitude: float
    longitude: float
    priority: Priority
    status: TicketStatus
    location: str


class DashboardStats(BaseModel):
    totalOpen: int
    highPriority: int
    inProgress: int
    resolved: int


class NamedValue(BaseModel):
    name: str
    value: int
    fill: str


class TopLocation(BaseModel):
    location: str
    issues: int


class TrendPoint(BaseModel):
    day: str
    reports: int
    resolved: int


class AnalyticsData(BaseModel):
    byCategory: List[NamedValue]
    byStatus: List[NamedValue]
    byPriority: List[NamedValue]
    topLocations: List[TopLocation]
    trend: List[TrendPoint]
    insights: List[str]


class NotificationOut(BaseModel):
    id: str
    ticketId: Optional[str] = None
    message: str
    isRead: bool
    createdAt: str
