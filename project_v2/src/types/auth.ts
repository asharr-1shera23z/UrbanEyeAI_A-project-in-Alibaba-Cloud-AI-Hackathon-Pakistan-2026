// Auth & RBAC types for UrbanEye AI
// -----------------------------------------------------------------------------
// NOTE ON THIS PROTOTYPE:
// This app has no real backend, so "the database" is simulated in the browser
// (localStorage) and "identity verification" is a mock service. The shapes
// below are written the way a real backend user model would look, so this
// layer can be swapped for real APIs (and a real NADRA / govt verification
// service) later without changing the rest of the app. See services/authService.ts
// and services/mockVerification.ts for the parts that would move server-side.
// -----------------------------------------------------------------------------

export type GovRole = 'FIELD_OFFICER' | 'SUPERVISOR' | 'DEPARTMENT_ADMIN' | 'SYSTEM_ADMIN';
export type AppRole = 'CITIZEN' | GovRole;

export type CitizenAccountStatus = 'ACTIVE' | 'SUSPENDED';
export type OfficerAccountStatus =
  | 'PENDING_VERIFICATION' // submitted, mock govt/employee verification not yet run
  | 'PENDING_APPROVAL' // verified, waiting on a Supervisor/System Admin to approve
  | 'APPROVED' // active, can log in
  | 'REJECTED' // application declined
  | 'SUSPENDED';

export type AccountStatus = CitizenAccountStatus | OfficerAccountStatus;

export type VerificationStatus = 'DEMO_VERIFIED' | 'PENDING' | 'FAILED';

export interface Jurisdiction {
  province: string;
  city: string;
  district?: string;
  zone?: string;
  sector?: string;
  department?: string;
}

interface BaseUserRecord {
  userId: string;
  fullName: string;
  email: string;
  /** Hashed with SubtleCrypto SHA-256 client-side for this prototype. A real
   *  deployment must hash + verify passwords on the server (e.g. bcrypt/argon2). */
  passwordHash: string;
  cnic: string;
  phoneNumber: string;
  dateOfBirth: string;
  accountStatus: AccountStatus;
  identityVerificationStatus: VerificationStatus;
  createdAt: string;
}

export interface CitizenRecord extends BaseUserRecord {
  role: 'CITIZEN';
  accountStatus: CitizenAccountStatus;
  gender: string;
  province: string;
  city: string;
  district: string;
  area: string;
  address: string;
}

export interface OfficerRecord extends BaseUserRecord {
  role: GovRole;
  accountStatus: OfficerAccountStatus;
  employeeId: string;
  department: string;
  designation: string;
  grade: string;
  jurisdiction: Jurisdiction;
  govVerificationStatus: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type UserRecord = CitizenRecord | OfficerRecord;

/** What we keep in the session (sessionStorage) — never the password hash. */
export interface SessionUser {
  userId: string;
  fullName: string;
  email: string;
  role: AppRole;
  accountStatus: AccountStatus;
  jurisdiction?: Jurisdiction;
  department?: string;
  designation?: string;
  employeeId?: string;
}

export class AuthError extends Error {
  code: 'INVALID_CREDENTIALS' | 'NOT_FOUND' | 'PENDING_VERIFICATION' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED' | 'WRONG_PORTAL';
  constructor(code: AuthError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

export const ROLE_LABELS: Record<AppRole, string> = {
  CITIZEN: 'Citizen',
  FIELD_OFFICER: 'Field Officer',
  SUPERVISOR: 'Supervisor',
  DEPARTMENT_ADMIN: 'Department Admin',
  SYSTEM_ADMIN: 'System Admin',
};

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  CITIZEN: [
    'Report urban issues',
    'Upload issue images',
    'View own complaints',
    'Track complaint status',
    'Receive notifications',
    'Confirm issue resolution',
  ],
  FIELD_OFFICER: [
    'View assigned complaints',
    'View complaint details',
    'Update complaint status',
    'Upload before/after images',
    'Mark work as completed',
  ],
  SUPERVISOR: [
    'View complaints in assigned jurisdiction',
    'Assign complaints to field officers',
    'Monitor complaint progress',
    'Review completed cases',
  ],
  DEPARTMENT_ADMIN: [
    'View department-level complaints',
    'Manage officers within department',
    'Monitor overall resolution',
  ],
  SYSTEM_ADMIN: [
    'Manage the overall system',
    'Manage roles and permissions',
    'Manage users and departments',
  ],
};
