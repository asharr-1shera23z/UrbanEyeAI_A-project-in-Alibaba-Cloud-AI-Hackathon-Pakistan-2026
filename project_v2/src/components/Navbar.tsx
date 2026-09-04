import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MapPin, Home, FilePlus, Search, LogOut, UserCircle2, Languages, LayoutDashboard } from 'lucide-react';
import { LogoFull } from './Logo';
import Button from './ui/Button';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isCitizenAuthed, citizenName, logoutCitizen } = useAuth();
  const { t, toggleLang } = useLanguage();

  const navItems = [
    { label: t('nav_home'), path: '/', icon: Home },
    { label: t('nav_report'), path: '/report', icon: FilePlus },
    { label: t('nav_track'), path: '/track', icon: Search },
    { label: t('nav_map'), path: '/map', icon: MapPin },
  ];

  const handleCitizenLogout = () => {
    logoutCitizen();
    navigate('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="shrink-0" aria-label="UrbanEye AI Home">
            <LogoFull size={40} />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-underline px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    active ? 'text-blue-700 active' : 'text-navy-700 hover:text-navy-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:text-navy-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors"
              aria-label="Toggle language"
            >
              <Languages className="w-4 h-4" />
              {t('nav_language_toggle')}
            </button>
            {isCitizenAuthed ? (
              <>
                <NotificationBell />
                <div className="hidden lg:flex flex-col items-end leading-tight">
                  <span className="text-[11px] text-slate-400 font-medium">Welcome back</span>
                  <span className="text-sm font-semibold text-navy-900">{citizenName || 'Citizen'}</span>
                </div>
                <Link
                  to="/track"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/track' ? 'text-blue-700 bg-blue-50' : 'text-navy-700 hover:text-navy-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Reports
                </Link>
                <button
                  onClick={handleCitizenLogout}
                  className="text-sm font-medium text-slate-500 hover:text-navy-900 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
                <Link to="/report">
                  <Button size="sm">{t('nav_report')}</Button>
                </Link>
              </>
            ) : (
              <Link to="/#choose-portal">
                <Button size="sm" icon={<UserCircle2 className="w-4 h-4" />}>Login</Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-navy-900"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-navy-950/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col pt-20 pb-6 px-4"
            >
              {navItems.map((item, i) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i + 0.1 }}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        active ? 'bg-blue-50 text-blue-700' : 'text-navy-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
              <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
                <button
                  onClick={toggleLang}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-navy-700 hover:bg-slate-100 transition-colors"
                >
                  <Languages className="w-5 h-5" />
                  {t('nav_language_toggle')}
                </button>
                {isCitizenAuthed ? (
                  <>
                    <div className="px-4 py-3 mb-2 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-[11px] text-blue-600 font-medium">Welcome back</p>
                      <p className="text-sm font-semibold text-navy-900">{citizenName || 'Citizen'}</p>
                    </div>
                    <Link
                      to="/track"
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        location.pathname === '/track' ? 'bg-blue-50 text-blue-700' : 'text-navy-700 hover:bg-slate-100'
                      }`}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      My Reports
                    </Link>
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm font-medium text-navy-700">Notifications</span>
                      <NotificationBell />
                    </div>
                    <button
                      onClick={handleCitizenLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                    <Link to="/report">
                      <Button size="md" fullWidth>{t('nav_report')}</Button>
                    </Link>
                  </>
                ) : (
                  <Link to="/#choose-portal">
                    <Button size="md" fullWidth icon={<UserCircle2 className="w-4 h-4" />}>Login</Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
