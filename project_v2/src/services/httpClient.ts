// -----------------------------------------------------------------------------
// HTTP CLIENT (real backend)
// -----------------------------------------------------------------------------
// Thin wrapper around fetch() that:
//  - prefixes requests with the backend base URL (VITE_API_BASE_URL, defaults
//    to http://localhost:8000 for local development)
//  - attaches the JWT from sessionStorage as a Bearer token when present
//  - throws AuthError for auth-shaped errors ({ code, message } detail) and
//    a plain Error otherwise, so callers can handle both uniformly
// -----------------------------------------------------------------------------

import { AuthError } from '@/types/auth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const TOKEN_KEY = 'urbaneye-token-v1';

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

interface ApiErrorDetail {
  code?: AuthError['code'];
  message?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.');
  }

  if (!response.ok) {
    let detail: ApiErrorDetail | string | null = null;
    try {
      const body = await response.json();
      detail = body?.detail ?? null;
    } catch {
      // no JSON body
    }

    if (detail && typeof detail === 'object' && detail.code) {
      throw new AuthError(detail.code, detail.message || 'Request failed');
    }
    const message =
      (typeof detail === 'string' && detail) ||
      (detail && typeof detail === 'object' && detail.message) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
};
