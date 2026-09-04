// -----------------------------------------------------------------------------
// MOCK VERIFICATION LAYER — Identity Verification: Demo/Prototype
// -----------------------------------------------------------------------------
// This file intentionally simulates the services a production deployment would
// call out to:
//   - a government identity verification API (e.g. an authorized NADRA
//     integration) for citizen CNIC verification
//   - a government HR / employee-directory service for officer verification
//   - an SMS/email OTP provider
//
// NONE of that is real here. Everything below is a deliberately fake, timed
// "simulation" so the rest of the authentication system can be built against
// a stable interface. Swap the function bodies for real API calls later —
// nothing else in the app needs to change.
//
// This app must never claim to be "Verified by NADRA" — only ever
// "Identity Verification: Demo/Prototype".
// -----------------------------------------------------------------------------

import type { VerificationStatus } from '@/types/auth';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface VerificationResult {
  status: VerificationStatus;
  message: string;
  reference: string;
}

/** Simulated CNIC / identity verification for citizen signup. */
export async function mockIdentityVerification(input: {
  fullName: string;
  cnic: string;
  dateOfBirth: string;
}): Promise<VerificationResult> {
  void input;
  await delay(1400);
  return {
    status: 'DEMO_VERIFIED',
    message: 'Identity details matched against demo verification records.',
    reference: `DEMO-ID-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  };
}

/** Simulated government employee / HR-directory verification for officer requests. */
export async function mockGovEmployeeVerification(input: {
  employeeId: string;
  department: string;
  cnic: string;
}): Promise<VerificationResult> {
  void input;
  await delay(1600);
  return {
    status: 'DEMO_VERIFIED',
    message: 'Employee ID and department matched against demo HR records.',
    reference: `DEMO-EMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  };
}

// ------------------------------- OTP (demo) --------------------------------

/** Generates a 6-digit demo OTP. In production this would be generated
 *  server-side and delivered via SMS/email, never returned to the client. */
export function generateDemoOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendDemoOtp(destination: string): Promise<{ otp: string }> {
  await delay(700);
  const otp = generateDemoOtp();
  console.info(`[UrbanEye AI demo] OTP for ${destination}: ${otp}`);
  return { otp };
}

export function verifyDemoOtp(entered: string, expected: string): boolean {
  return entered.trim() === expected.trim();
}
