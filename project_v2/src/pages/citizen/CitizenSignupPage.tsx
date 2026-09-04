import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  IdCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  UserCircle2,
} from 'lucide-react';
import { LogoFull } from '@/components/Logo';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { AuthStepper } from '@/components/auth/AuthStepper';
import { PasswordField } from '@/components/auth/PasswordField';
import { MockCaptcha } from '@/components/auth/MockCaptcha';
import { VerificationStep } from '@/components/auth/VerificationStep';
import { OtpStep } from '@/components/auth/OtpStep';
import { PROVINCES, CITIES_BY_PROVINCE } from '@/data/locations';
import { registerCitizen } from '@/services/authService';
import { mockIdentityVerification } from '@/services/mockVerification';
import { AuthError } from '@/types/auth';

const STEPS = ['Personal', 'Location', 'Security', 'Verify'];

const CNIC_RE = /^\d{5}-\d{7}-\d{1}$/;
const PHONE_RE = /^03\d{2}-\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  fullName: string;
  cnic: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  email: string;
  province: string;
  city: string;
  district: string;
  area: string;
  address: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

const initialForm: FormState = {
  fullName: '',
  cnic: '',
  dateOfBirth: '',
  gender: '',
  mobileNumber: '',
  email: '',
  province: '',
  city: '',
  district: '',
  area: '',
  address: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
};

export function CitizenSignupPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { isCitizenAuthed, setSession } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifySubStep, setVerifySubStep] = useState<'identity' | 'otp'>('identity');
  const [submitError, setSubmitError] = useState('');
  const [creating, setCreating] = useState(false);

  if (isCitizenAuthed) {
    return <Navigate to="/" replace />;
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validatePersonal = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    if (!CNIC_RE.test(form.cnic)) e.cnic = 'Use CNIC format 12345-1234567-1.';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required.';
    if (!form.gender) e.gender = 'Please select a gender.';
    if (!PHONE_RE.test(form.mobileNumber)) e.mobileNumber = 'Use phone format 03XX-XXXXXXX.';
    if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateLocation = () => {
    const e: Record<string, string> = {};
    if (!form.province) e.province = 'Select a province.';
    if (!form.city) e.city = 'Select a city.';
    if (!form.district.trim()) e.district = 'District is required.';
    if (!form.area.trim()) e.area = 'Area / Tehsil is required.';
    if (!form.address.trim()) e.address = 'Residential address is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSecurity = () => {
    const e: Record<string, string> = {};
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    if (!form.agreeTerms) e.agreeTerms = 'You must agree to the Terms and Conditions.';
    if (!captchaValid) e.captcha = 'Please complete the verification check.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 0 && !validatePersonal()) return;
    if (step === 1 && !validateLocation()) return;
    if (step === 2 && !validateSecurity()) return;
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const finalizeAccount = async () => {
    setCreating(true);
    setSubmitError('');
    try {
      const user = await registerCitizen({
        fullName: form.fullName,
        cnic: form.cnic,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phoneNumber: form.mobileNumber,
        email: form.email,
        province: form.province,
        city: form.city,
        district: form.district,
        area: form.area,
        address: form.address,
        password: form.password,
      });
      setSession(user);
      show(`Account created — welcome, ${user.fullName}!`, 'success');
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(err instanceof AuthError ? err.message : 'Could not create your account. Please try again.');
      setStep(2);
    } finally {
      setCreating(false);
    }
  };

  const cities = form.province ? CITIES_BY_PROVINCE[form.province] || [] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="signup-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0d1d3a" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#signup-grid)" />
        </svg>
      </div>
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      <Link
        to="/citizen/login"
        className="absolute top-6 left-6 z-10 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-xl"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 sm:p-10">
          <div className="flex flex-col items-center mb-7">
            <LogoFull size={42} />
            <h1 className="mt-4 text-xl font-extrabold text-navy-900 tracking-tight">
              Create Your Citizen Account
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium flex items-center gap-1.5">
              <UserCircle2 className="w-3.5 h-3.5" />
              Citizen Registration
            </p>
          </div>

          <AuthStepper steps={STEPS} currentIndex={step} />

          <AnimatePresence>
            {step === 0 && (
              <motion.div key="personal" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                <h2 className="text-sm font-semibold text-navy-900">Personal Information</h2>
                <Field label="Full Name" icon={User} value={form.fullName} onChange={(v) => update('fullName', v)} error={errors.fullName} placeholder="Ayesha Khan" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="CNIC Number" icon={IdCard} value={form.cnic} onChange={(v) => update('cnic', v)} error={errors.cnic} placeholder="35201-1234567-1" />
                  <Field label="Date of Birth" icon={Calendar} type="date" value={form.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} error={errors.dateOfBirth} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-navy-900 mb-1.5 block">Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => update('gender', e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-navy-900 btn-focus transition-colors"
                    >
                      <option value="">Select</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
                  </div>
                  <Field label="Mobile Number" icon={Phone} value={form.mobileNumber} onChange={(v) => update('mobileNumber', v)} error={errors.mobileNumber} placeholder="0300-1234567" />
                </div>
                <Field label="Email Address" icon={Mail} type="email" value={form.email} onChange={(v) => update('email', v)} error={errors.email} placeholder="you@example.com" />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="location" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                <h2 className="text-sm font-semibold text-navy-900">Location Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-navy-900 mb-1.5 block">Province</label>
                    <select
                      value={form.province}
                      onChange={(e) => {
                        update('province', e.target.value);
                        update('city', '');
                      }}
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-navy-900 btn-focus transition-colors"
                    >
                      <option value="">Select province</option>
                      {PROVINCES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                    {errors.province && <p className="mt-1 text-xs text-red-600">{errors.province}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-navy-900 mb-1.5 block">City</label>
                    <select
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      disabled={!form.province}
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-navy-900 btn-focus transition-colors disabled:opacity-50"
                    >
                      <option value="">Select city</option>
                      {cities.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="District" icon={MapPin} value={form.district} onChange={(v) => update('district', v)} error={errors.district} placeholder="Rawalpindi" />
                  <Field label="Area / Tehsil" icon={MapPin} value={form.area} onChange={(v) => update('area', v)} error={errors.area} placeholder="Satellite Town" />
                </div>
                <div>
                  <label className="text-sm font-medium text-navy-900 mb-1.5 block">Residential Address</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-navy-900 placeholder:text-slate-400 btn-focus transition-colors resize-none"
                    placeholder="House / street / locality"
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="security" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                <h2 className="text-sm font-semibold text-navy-900">Account Security</h2>
                <PasswordField label="Create Password" value={form.password} onChange={(v) => update('password', v)} autoComplete="new-password" hint="At least 8 characters." />
                {errors.password && <p className="-mt-2 text-xs text-red-600">{errors.password}</p>}
                <PasswordField label="Confirm Password" value={form.confirmPassword} onChange={(v) => update('confirmPassword', v)} autoComplete="new-password" />
                {errors.confirmPassword && <p className="-mt-2 text-xs text-red-600">{errors.confirmPassword}</p>}

                <MockCaptcha onChange={setCaptchaValid} />
                {errors.captcha && <p className="-mt-2 text-xs text-red-600">{errors.captcha}</p>}

                <label className="flex items-start gap-2.5 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={(e) => update('agreeTerms', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 btn-focus"
                  />
                  I agree to the Terms and Conditions
                </label>
                {errors.agreeTerms && <p className="text-xs text-red-600">{errors.agreeTerms}</p>}

                {submitError && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="verify" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                {verifySubStep === 'identity' ? (
                  <VerificationStep
                    title="Verifying your identity"
                    description="Running a demo identity check against your CNIC details."
                    icon="identity"
                    run={() => mockIdentityVerification({ fullName: form.fullName, cnic: form.cnic, dateOfBirth: form.dateOfBirth })}
                    onDone={() => setVerifySubStep('otp')}
                  />
                ) : (
                  <OtpStep destination={form.email} onVerified={finalizeAccount} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {step < 3 && (
            <div className="flex items-center gap-3 mt-7">
              {step > 0 && (
                <Button type="button" variant="outline" size="lg" onClick={goBack}>
                  Back
                </Button>
              )}
              <Button type="button" size="lg" fullWidth onClick={goNext} icon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          )}

          {step === 3 && creating && (
            <p className="text-center text-xs text-slate-400 mt-4">Creating your account…</p>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/citizen/login" className="text-blue-600 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

interface FieldProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
}

function Field({ label, icon: Icon, value, onChange, error, placeholder, type = 'text' }: FieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-navy-900 mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-navy-900 placeholder:text-slate-400 btn-focus transition-colors"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
