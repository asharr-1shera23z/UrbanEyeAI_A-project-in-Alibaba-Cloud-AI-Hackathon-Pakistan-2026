import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ClipboardList, Map, BarChart3, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { LogoFull } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/types/auth';

const adminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Complaints', path: '/admin/complaints', icon: ClipboardList },
  { label: 'Map', path: '/admin/map', icon: Map },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutAdmin, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  const displayName = user?.fullName || 'Officer';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const roleLabel = user && user.role !== 'CITIZEN' ? ROLE_LABELS[user.role] : 'Officer';
  const jurisdictionLabel = user?.jurisdiction
    ? [user.jurisdiction.city, user.jurisdiction.zone].filter(Boolean).join(' · ')
    : undefined;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <Link to="/admin/dashboard" className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-200 shrink-0">
        <LogoFull size={28} />
        <span className="text-[10px] text-slate-500 font-medium">Operations Portal</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {adminNav.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-navy-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {initials || 'GO'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy-900 truncate">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">
              {user?.designation || roleLabel}
              {jurisdictionLabel ? ` · ${jurisdictionLabel}` : ''}
            </p>
          </div>
        </div>
        <div className="px-3 mb-2">
          <span className="inline-block text-[10px] font-semibold tracking-wide uppercase text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
            {roleLabel}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <LogoFull size={26} />
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-slate-500 p-1"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[60]"
          >
            <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-500 z-10"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
