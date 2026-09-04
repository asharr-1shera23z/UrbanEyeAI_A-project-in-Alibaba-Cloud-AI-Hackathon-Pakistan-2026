import { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, BadgeCheck, ArrowRight, Shield, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { LogoFull } from '@/components/Logo';
import { CityIllustration } from '@/components/CityIllustration';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { PasswordField } from '@/components/auth/PasswordField';
import { MockCaptcha } from '@/components/auth/MockCaptcha';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { OtpStep } from '@/components/auth/OtpStep';
import { loginOfficer } from '@/services/authService';
import { AuthError } from '@/types/auth';
import type { SessionUser } from '@/types/auth';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { show } = useToast();
  const { isAdminAuthed, setSession } = useAuth();
  const [identifier, setIdentifier] = useState('officer@urbaneye.ai');
  const [password, setPassword] = useState('demo1234');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [mfaUser, setMfaUser] = useState<SessionUser | null>(null);

  if (isAdminAuthed) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const from = (location.state as { from?: string } | null)?.from || '/admin/dashboard';
  const usingEmployeeId = /^gov-/i.test(identifier.trim());

  const finishLogin = (user: SessionUser) => {
    setSession(user);
    show(`Welcome back, ${user.fullName}`, 'success');
    navigate(from, { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!captchaValid) {
      setError('Please complete the verification check.');
      return;
    }
    setLoading(true);
    try {
      const user = await loginOfficer(identifier, password);
      // Simulated MFA step after password authentication, as allowed for the prototype.
      setMfaUser(user);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.code === 'PENDING_VERIFICATION' || err.code === 'PENDING_APPROVAL') {
          navigate('/admin/pending-approval', { state: { email: identifier } });
          return;
        }
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (mfaUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8"
        >
          <div className="flex flex-col items-center mb-6">
            <LogoFull size={36} />
            <h1 className="mt-3 text-lg font-extrabold text-navy-900 tracking-tight">Two-Factor Verification</h1>
            <p className="mt-1 text-xs text-slate-500">Extra security step for government accounts</p>
          </div>
          <OtpStep destination={mfaUser.email} onVerified={() => finishLogin(mfaUser)} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.05]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0d1d3a" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
        </svg>
      </div>

      {/* Decorative glow blobs */}
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />

      <Link
        to="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-4xl"
      >
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 overflow-hidden grid lg:grid-cols-2">
          {/* Animated city illustration — login pages only */}
          <div className="hidden lg:block relative bg-blue-50 min-h-[520px]">
            <CityIllustration />
            <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-white/90 via-white/10 to-transparent">
              <h2 className="text-2xl font-extrabold text-navy-900 leading-tight">
                Watching over the city,
                <br /> block by block.
              </h2>
              <p className="mt-2 text-sm text-slate-600 max-w-xs">
                Real-time AI monitoring of infrastructure issues across every district.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center mb-8">
              <LogoFull size={44} />
              <p className="mt-3 text-sm text-slate-500 font-medium flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Official Operations Portal
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-navy-900 mb-1.5 block">Official Email or Employee ID</label>
                <div className="relative">
                  {usingEmployeeId ? (
                    <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  ) : (
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  )}
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-navy-900 placeholder:text-slate-400 btn-focus transition-colors"
                    placeholder="officer@urbaneye.ai or GOV-10245"
                  />
                </div>
              </div>

              <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />

              <MockCaptcha onChange={setCaptchaValid} />

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" size="lg" fullWidth loading={loading} icon={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}>
                Login
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Demo credentials are pre-filled. Click Login to continue.
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <Link to="/admin/request-access" className="text-blue-600 font-semibold hover:underline">
                Request Government Access
              </Link>
            </div>

            <p className="mt-3 text-center text-xs text-slate-500">
              Not an official? <Link to="/citizen/login" className="text-blue-600 font-semibold hover:underline">Login as Citizen</Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          UrbanEye AI — AI-powered intelligence for better cities
        </p>
      </motion.div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} label="official email or employee ID" />
    </div>
  );
}
