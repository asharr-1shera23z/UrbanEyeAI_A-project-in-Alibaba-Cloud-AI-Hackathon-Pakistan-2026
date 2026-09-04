// -----------------------------------------------------------------------------
// AUTH SERVICE (real backend)
// -----------------------------------------------------------------------------
// Talks to the FastAPI backend's /api/auth/* endpoints. Every exported
// function keeps the exact same name and signature the pages already import
// (see the original prototype header this replaced), so nothing in the UI
// layer needed to change — only this file and api.ts were swapped for real
// HTTP calls.
//
// The JWT returned on login/register is stored via httpClient's
// setToken/clearToken (sessionStorage), and AuthContext.setSession/
// clearSession continue to manage the SessionUser exactly as before.
// -----------------------------------------------------------------------------

import type { SessionUser } from '@/types/auth';
import { clearToken, http, setToken } from './httpClient';

interface AuthResponse {
  token: string;
  user: SessionUser;
}

// ------------------------------- Register -----------------------------------

export interface CitizenRegistrationInput {
  fullName: string;
  cnic: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  email: string;
  province: string;
  city: string;
  district: string;
  area: string;
  address: string;
  password: string;
}

export async function registerCitizen(input: CitizenRegistrationInput): Promise<SessionUser> {
  const res = await http.post<AuthResponse>('/api/auth/citizen/register', input);
  setToken(res.token);
  return res.user;
}

export interface OfficerRegistrationInput {
  fullName: string;
  cnic: string;
  dateOfBirth: string;
  officialPhoneNumber: string;
  officialEmail: string;
  employeeId: string;
  department: string;
  designation: string;
  grade: string;
  province: string;
  city: string;
  district: string;
  zone: string;
  govOffice: string;
  password: string;
}

export async function requestGovAccess(input: OfficerRegistrationInput): Promise<SessionUser> {
  // No token yet — the account is PENDING_APPROVAL until an admin approves it.
  return http.post<SessionUser>('/api/auth/officer/request-access', input);
}

// --------------------------------- Login ------------------------------------

export async function loginCitizen(identifier: string, password: string): Promise<SessionUser> {
  const res = await http.post<AuthResponse>('/api/auth/citizen/login', { identifier, password });
  setToken(res.token);
  return res.user;
}

export async function loginOfficer(identifier: string, password: string): Promise<SessionUser> {
  const res = await http.post<AuthResponse>('/api/auth/officer/login', { identifier, password });
  setToken(res.token);
  return res.user;
}

export function logout(): void {
  clearToken();
}

// ---------------------------- Officer approval -------------------------------

export interface OfficerStatus {
  userId: string;
  fullName: string;
  email: string;
  accountStatus: string;
  role: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  jurisdiction?: { province: string; city: string; district?: string; zone?: string; department?: string };
}

export async function getOfficerStatus(userId: string): Promise<OfficerStatus | undefined> {
  try {
    return await http.get<OfficerStatus>(`/api/auth/officer/status/${userId}`);
  } catch {
    return undefined;
  }
}

/** DEMO ONLY: stands in for a System Admin / Supervisor clicking "approve" in
 *  a real back-office tool, matching the original prototype's demo button.
 *  Logs the newly-approved officer in immediately (their JWT is returned by
 *  the approval endpoint) so the pending-approval screen can continue into
 *  the dashboard, same as before. */
export async function approveOfficerDemo(userId: string): Promise<SessionUser> {
  const res = await http.post<AuthResponse>(`/api/auth/officer/approve/${userId}`);
  setToken(res.token);
  return res.user;
}
