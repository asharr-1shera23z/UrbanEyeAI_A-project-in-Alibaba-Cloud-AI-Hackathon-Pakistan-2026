import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { SessionUser, AppRole } from '@/types/auth';
import { clearToken } from '@/services/httpClient';

interface AuthContextValue {
  /** Full session user (null when signed out). Prefer this for new code. */
  user: SessionUser | null;
  role: AppRole | null;

  // --- Citizen (back-compat with existing pages/components) ---
  isCitizenAuthed: boolean;
  citizenName: string | null;
  loginCitizen: (name?: string) => void;
  logoutCitizen: () => void;

  // --- Government officer (back-compat: any non-citizen role, must be APPROVED) ---
  isAdminAuthed: boolean;
  adminName: string | null;
  loginAdmin: (name?: string) => void;
  logoutAdmin: () => void;

  // --- New: role-aware session management used by the real auth flow ---
  setSession: (user: SessionUser) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'urbaneye-session-v1';

function readSession(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => readSession());

  const setSession = useCallback((sessionUser: SessionUser) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    clearToken();
    setUser(null);
  }, []);

  // --- Back-compat shims -----------------------------------------------
  // The pre-existing UI (Navbar, AdminSidebar, dashboards) was built against
  // a simpler isCitizenAuthed/isAdminAuthed boolean API. We keep that surface
  // working, now derived from the real role-aware session above, so none of
  // that UI needed to be rewritten.

  const isCitizenAuthed = user?.role === 'CITIZEN';
  const isAdminAuthed = !!user && user.role !== 'CITIZEN' && user.accountStatus === 'APPROVED';

  const loginCitizen = useCallback(
    (name?: string) => {
      // Fallback path only (e.g. quick demo use) — the real Citizen login
      // screen calls setSession() directly with a verified SessionUser.
      setSession({
        userId: 'demo-citizen',
        fullName: name || 'Citizen',
        email: 'citizen@urbaneye.ai',
        role: 'CITIZEN',
        accountStatus: 'ACTIVE',
      });
    },
    [setSession]
  );

  const loginAdmin = useCallback(
    (name?: string) => {
      setSession({
        userId: 'demo-officer',
        fullName: name || 'Officer',
        email: 'officer@urbaneye.ai',
        role: 'SUPERVISOR',
        accountStatus: 'APPROVED',
      });
    },
    [setSession]
  );

  const logoutCitizen = useCallback(() => {
    if (user?.role === 'CITIZEN') clearSession();
  }, [user, clearSession]);

  const logoutAdmin = useCallback(() => {
    if (user && user.role !== 'CITIZEN') clearSession();
  }, [user, clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isCitizenAuthed,
        citizenName: isCitizenAuthed ? user?.fullName ?? null : null,
        loginCitizen,
        logoutCitizen,
        isAdminAuthed,
        adminName: isAdminAuthed ? user?.fullName ?? null : null,
        loginAdmin,
        logoutAdmin,
        setSession,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
