import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp, fadeIn, scaleIn, staggerContainer, viewportOnce, prefersReducedMotion, useReducedMotion } from '@/utils/motion';
import {
  ArrowRight,
  MapPin,
  Camera,
  Brain,
  Ticket,
  CheckCircle2,
  CircleDot,
  Waves,
  Construction,
  Trash2,
  Route,
  ScanLine,
  Activity,
  Map as MapIcon,
  UserCircle2,
  Shield,
  LogIn,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { NeuralNetwork } from '@/components/NeuralNetwork';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CircleDot,
  Waves,
  Construction,
  Trash2,
  Route,
};

const steps = [
  { num: '01', title: 'Report', desc: 'Upload a photo and location.', icon: Camera },
  { num: '02', title: 'AI Analysis', desc: 'UrbanEye AI analyzes the problem.', icon: Brain },
  { num: '03', title: 'Ticket', desc: 'A trackable complaint is created.', icon: Ticket },
  { num: '04', title: 'Action', desc: 'Authorities verify and resolve it.', icon: CheckCircle2 },
];

const categories = [
  {
    label: 'Pothole / Surface Damage',
    icon: 'CircleDot',
    count: 47,
    color: 'bg-blue-50 text-blue-600',
    description: 'Surface cavities and road-bed damage detected from citizen photos, ranked by depth and traffic risk.',
  },
  {
    label: 'Drain / Blockage',
    icon: 'Waves',
    count: 23,
    color: 'bg-pink-50 text-pink-600',
    description: 'Clogged or overflowing drainage points that raise flooding risk during heavy rain.',
  },
  {
    label: 'Road Damage',
    icon: 'Construction',
    count: 31,
    color: 'bg-amber-50 text-amber-600',
    description: 'Cracked surfaces, sinkholes and structural road defects flagged for inspection crews.',
  },
  {
    label: 'Garbage',
    icon: 'Trash2',
    count: 58,
    color: 'bg-emerald-50 text-emerald-600',
    description: 'Overflowing bins and illegal dumping spots reported by residents across the city.',
  },
  {
    label: 'Damaged Pavement',
    icon: 'Route',
    count: 19,
    color: 'bg-indigo-50 text-indigo-600',
    description: 'Broken, uneven or missing pavement tiles creating hazards for pedestrians and cyclists.',
  },
];

export function HomePage() {
  const { isCitizenAuthed, citizenName } = useAuth();
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number] | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#choose-portal') {
      const timer = setTimeout(() => {
        document.getElementById('choose-portal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/30 min-h-[88vh] flex items-start pt-20 lg:pt-24 pb-12 lg:pb-16">
        {/* AI Neural Network background */}
        <div className="absolute inset-0 pointer-events-none">
          <NeuralNetwork />
        </div>
        {/* Soft radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-200/10 blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 mb-4 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  UrbanEye AI: AI-Powered Urban Infrastructure Intelligence Platform
                </span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-navy-900 leading-[1.05] tracking-tight">
                <span className="block">Report Issues.</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-950 via-blue-900 to-blue-700">
                  AI Prioritizes. City Acts.
                </span>
              </h1>

              <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-xl">
                No more waiting in line at the municipal office. Snap a photo, and UrbanEye AI
                instantly detects the issue, ranks its urgency, and routes it to the right department.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/report">
                  <Button size="lg" icon={<Camera className="w-5 h-5" />}>
                    Report an Issue
                  </Button>
                </Link>
                <Link to="/map">
                  <Button size="lg" variant="outline" icon={<MapIcon className="w-5 h-5" />}>
                    Explore City Map
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>146 active reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>86 resolved this month</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Product visual */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.02, rotate: 0.5 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <HeroVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Choose Your Portal / Citizen Quick Actions */}
      <section id="choose-portal" className="relative py-20 overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/30 to-white scroll-mt-20">
        {/* Decorative glow blobs for the glass effect */}
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isCitizenAuthed ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl font-extrabold text-navy-900">
                  Welcome back, {citizenName?.split(' ')[0] || 'Citizen'}
                </h2>
                <p className="mt-2 text-slate-500">Manage your reports and help improve your city</p>
              </motion.div>

              <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
                {[
                  {
                    title: 'Report an Issue',
                    desc: 'Snap a photo and submit a new infrastructure complaint.',
                    icon: Camera,
                    to: '/report',
                    gradient: 'from-blue-500/20 to-cyan-500/20',
                    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
                    glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.35)]',
                  },
                  {
                    title: 'Track Reports',
                    desc: 'View status updates on all reports you have submitted.',
                    icon: Ticket,
                    to: '/track',
                    gradient: 'from-emerald-500/20 to-teal-500/20',
                    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-400',
                    glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.35)]',
                  },
                  {
                    title: 'Explore City Map',
                    desc: 'Browse live issue map and see nearby infrastructure problems.',
                    icon: MapIcon,
                    to: '/map',
                    gradient: 'from-indigo-500/20 to-violet-500/20',
                    iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-400',
                    glow: 'group-hover:shadow-[0_0_30px_rgba(99,102,241,0.35)]',
                  },
                ].map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/40 backdrop-blur-2xl shadow-lg transition-all duration-300 hover:border-white/70 hover:bg-white/55 hover:shadow-2xl"
                  >
                    {/* Gradient mesh background */}
                    <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${card.gradient} blur-2xl opacity-60 transition-opacity duration-300 group-hover:opacity-100`} />
                    <div className={`absolute -left-10 -bottom-10 w-28 h-28 rounded-full bg-gradient-to-tr ${card.gradient} blur-2xl opacity-40 transition-opacity duration-300 group-hover:opacity-80`} />

                    <div className="relative p-7 flex flex-col h-full">
                      <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center mb-5 shadow-lg ${card.glow} transition-shadow duration-300`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-navy-900 mb-2">{card.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">{card.desc}</p>
                      <Link to={card.to}>
                        <Button fullWidth variant="secondary" icon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}>
                          Go
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl font-extrabold text-navy-900">Choose Your Portal</h2>
                <p className="mt-2 text-slate-500">Login to the portal that matches your role</p>
              </motion.div>

              <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Citizen Portal */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl p-8 flex flex-col"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
                    <UserCircle2 className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 mb-2">Citizen Portal</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                    Report infrastructure problems, track your complaints, and explore the live
                    city issue map.
                  </p>
                  <Link to="/citizen/login">
                    <Button fullWidth variant="secondary" icon={<LogIn className="w-4 h-4" />}>
                      Login as Citizen
                    </Button>
                  </Link>
                </motion.div>

                {/* Admin Portal */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl p-8 flex flex-col"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
                    <Shield className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 mb-2">Admin / Operations Portal</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                    Verify AI-detected issues, manage complaints, and monitor city-wide analytics
                    and resolution progress.
                  </p>
                  <Link to="/admin/login">
                    <Button fullWidth icon={<LogIn className="w-4 h-4" />}>
                      Login as Government Officer
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold text-navy-900">How It Works</h2>
            <p className="mt-2 text-slate-500">From reporting to resolution in four simple steps</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  variants={fadeInUp}
                  whileHover={prefersReducedMotion ? undefined : { y: -6 }}
                  className="relative bg-white rounded-2xl border border-slate-200 card-shadow p-6 transition-shadow duration-300 hover:shadow-lg"
                >
                  <span className="absolute top-5 right-5 text-3xl font-extrabold text-slate-100 tabular-nums">
                    {step.num}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-navy-950 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-base font-bold text-navy-900 mb-1.5">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Issue Categories */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold text-navy-900">Issue Categories</h2>
            <p className="mt-2 text-slate-500">UrbanEye AI detects and classifies common infrastructure problems</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon];
              return (
                <motion.button
                  key={cat.label}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  variants={fadeInUp}
                  whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                  className="text-left bg-white rounded-2xl border border-slate-200 card-shadow p-5 cursor-pointer group btn-focus transition-shadow duration-300 hover:shadow-md"
                >
                  <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                    {Icon && <Icon className="w-6 h-6" />}
                  </div>
                  <h3 className="text-sm font-bold text-navy-900">{cat.label}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{cat.count} reports</p>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-navy-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="cta-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-grid)" />
          </svg>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              AI-powered intelligence for better cities
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Help make your city safer and cleaner. Report infrastructure problems in seconds
              and track them through to resolution.
            </p>
            <Link to="/report">
              <Button size="lg" variant="secondary" icon={<ArrowRight className="w-5 h-5" />}>
                Report an Issue Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Issue Category Details Modal */}
      <Modal
        open={!!activeCategory}
        onClose={() => setActiveCategory(null)}
        title={activeCategory?.label}
        size="sm"
      >
        {activeCategory && (
          <div>
            <div className={`w-14 h-14 rounded-2xl ${activeCategory.color} flex items-center justify-center mb-4`}>
              {(() => {
                const Icon = iconMap[activeCategory.icon];
                return Icon ? <Icon className="w-7 h-7" /> : null;
              })()}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">{activeCategory.description}</p>
            <div className="flex items-center gap-2 mb-6 text-sm">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-navy-900">{activeCategory.count}</span>
              <span className="text-slate-500">active reports in this category</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={isCitizenAuthed ? '/report' : '/citizen/login'} className="flex-1">
                <Button fullWidth icon={<Camera className="w-4 h-4" />}>
                  Report This Issue
                </Button>
              </Link>
              <Link to={isCitizenAuthed ? '/map' : '/citizen/login'} className="flex-1">
                <Button fullWidth variant="outline" icon={<MapIcon className="w-4 h-4" />}>
                  View on Map
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

type MapType = 'standard' | 'satellite' | 'terrain';

const mapThemes: Record<MapType, { bg: string; road: string; block: string; water: string; park: string; glow: string }> = {
  standard: {
    bg: 'bg-slate-100',
    road: '#cbd5e1',
    block: '#f8fafc',
    water: '#dbeafe',
    park: '#dcfce7',
    glow: 'rgba(59,130,246,0.12)',
  },
  satellite: {
    bg: 'bg-slate-800',
    road: '#475569',
    block: '#334155',
    water: '#1e3a8a',
    park: '#14532d',
    glow: 'rgba(255,255,255,0.08)',
  },
  terrain: {
    bg: 'bg-amber-50',
    road: '#d6c098',
    block: '#f5f0e1',
    water: '#bae6fd',
    park: '#bbf7d0',
    glow: 'rgba(217,119,6,0.12)',
  },
};

const markers = [
  { top: '20%', left: '25%', color: '#dc2626', label: 'Pothole' },
  { top: '55%', left: '60%', color: '#f59e0b', label: 'Drain' },
  { top: '75%', left: '35%', color: '#16a34a', label: 'Resolved' },
  { top: '40%', left: '75%', color: '#dc2626', label: 'Road Damage' },
];

function HeroVisual() {
  const reduced = useReducedMotion();
  const [mapType, setMapType] = useState<MapType>('standard');
  const theme = mapThemes[mapType];

  return (
    <div className="relative">
      {/* Ambient glow behind the card */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-3xl pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: theme.glow }}
      />

      {/* Main card — Map */}
      <motion.div
        animate={reduced ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative bg-white rounded-2xl border border-slate-200/80 card-shadow-lg p-4 z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-navy-950 flex items-center justify-center">
              <MapIcon className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm font-semibold text-navy-900">City Issue Map</span>
          </div>

          {/* Map type toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {(['standard', 'satellite', 'terrain'] as MapType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMapType(t)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                  mapType === t ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Map surface */}
        <div className={`relative h-52 rounded-xl overflow-hidden transition-colors duration-500 ${theme.bg}`}>
          {/* Base map illustration */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            {/* Water */}
            <path d="M0,200 Q120,155 200,180 T400,200 L400,200 Z" fill={theme.water} opacity="0.7" />
            {/* Park */}
            <rect x="32" y="24" width="72" height="44" rx="6" fill={theme.park} opacity="0.55" />
            {/* Building blocks */}
            <rect x="220" y="16" width="64" height="36" rx="4" fill={theme.block} opacity="0.85" />
            <rect x="280" y="110" width="72" height="40" rx="4" fill={theme.block} opacity="0.85" />
            <rect x="60" y="124" width="80" height="32" rx="4" fill={theme.block} opacity="0.85" />
            <rect x="150" y="70" width="44" height="28" rx="4" fill={theme.block} opacity="0.75" />
            {/* Roads */}
            <path d="M0,70 L400,70" stroke={theme.road} strokeWidth="5" strokeLinecap="round" />
            <path d="M0,144 L400,144" stroke={theme.road} strokeWidth="5" strokeLinecap="round" />
            <path d="M128,0 L128,200" stroke={theme.road} strokeWidth="5" strokeLinecap="round" />
            <path d="M272,0 L272,200" stroke={theme.road} strokeWidth="5" strokeLinecap="round" />
            <path d="M0,0 Q200,100 400,200" stroke={theme.road} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
          </svg>

          {/* Route line linking markers */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="none">
            <path
              d="M100,40 C160,40 180,110 240,110 S300,80 300,80"
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5 5"
              opacity="0.55"
            />
          </svg>

          {/* Inset shadow for depth */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-500"
            style={{ boxShadow: `inset 0 0 45px ${mapType === 'satellite' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.08)'}` }}
          />

          {/* Markers */}
          {markers.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}
              className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ top: m.top, left: m.left, backgroundColor: m.color, boxShadow: `0 0 0 4px ${m.color}30, 0 0 12px ${m.color}66` }}
            >
              <motion.div
                animate={reduced ? {} : { scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35 }}
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: m.color }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floating card — AI Analysis */}
      <motion.div
        animate={reduced ? {} : { y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -bottom-6 -left-4 sm:-left-8 z-20 w-56"
      >
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-400/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                <ScanLine className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-navy-900">AI Detection</span>
            </div>
            <p className="text-sm font-bold text-navy-900 mb-1">Pothole</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-500">Confidence</span>
              <span className="text-xs font-bold text-blue-600">92%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '92%' }}
                transition={{ duration: 1.5, delay: 1 }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              />
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">HIGH</span>
              <span className="text-xs text-slate-400">Priority</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating card — Ticket */}
      <motion.div
        animate={reduced ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -top-4 -right-4 sm:-right-8 z-20"
      >
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl p-3 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-400/5 pointer-events-none" />
          <div className="relative flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Ticket</p>
              <p className="text-sm font-bold text-navy-900">CIV-1042</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
