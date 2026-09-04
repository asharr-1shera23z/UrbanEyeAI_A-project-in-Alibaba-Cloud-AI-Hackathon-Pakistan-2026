import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function RequireCitizenAuth({ children }: { children: React.ReactNode }) {
  const { isCitizenAuthed } = useAuth();
  const location = useLocation();

  if (!isCitizenAuthed) {
    return <Navigate to="/citizen/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

/**
 * Gates the government officer portal. Role- and status-aware:
 *  - no session at all -> Government Officer login
 *  - a citizen session -> Government Officer login (citizens can't self-elevate
 *    by editing the URL)
 *  - an officer session still pending verification/approval -> the pending
 *    approval screen, not the dashboard
 *  - a rejected/suspended officer -> back to login with an explanatory message
 */
export function RequireAdminAuth({ children }: { children: React.ReactNode }) {
  const { user, isAdminAuthed } = useAuth();
  const location = useLocation();

  if (isAdminAuthed) {
    return <>{children}</>;
  }

  if (user && user.role !== 'CITIZEN') {
    if (user.accountStatus === 'PENDING_VERIFICATION' || user.accountStatus === 'PENDING_APPROVAL') {
      return <Navigate to="/admin/pending-approval" replace />;
    }
  }

  return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
}
