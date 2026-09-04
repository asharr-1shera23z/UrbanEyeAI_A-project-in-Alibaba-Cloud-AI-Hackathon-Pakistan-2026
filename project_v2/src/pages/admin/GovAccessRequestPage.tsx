import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  IdCard,
  Calendar,
  Phone,
  Mail,
  BadgeCheck,
  Building2,
  Briefcase,
  MapPin,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { LogoFull } from '@/components/Logo';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { AuthStepper } from '@/components/auth/AuthStepper';
import { PasswordField } from '@/components/auth/PasswordField';
import { MockCaptcha } from '@/components/auth/MockCaptcha';
import { VerificationStep } from '@/components/auth/VerificationStep';
import { OtpStep } from '@/components/auth/OtpStep';
import { PROVINCES, CITIES_BY_PROVINCE, ZONES, DEPARTMENTS, DESIGNATIONS, BPS_GRADES } from '@/data/locations';
import { requestGovAccess } from '@/services/authService';
import { mockGovEmployeeVerification } from '@/services/mockVerification';
import { AuthError } from '@/types/auth';

const STEPS = ['Personal', 'Employment', 'Security', 'Verify'];

const CNIC_RE = /^\d{5}-\d{7}-\d{1}$/;
const PHONE_RE = /^03\d{2}-\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
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
  confirmPassword: string;
  agreeTerms: boolean;
}

const initialForm: FormState = {
  fullName: '',
  cnic: '',
  dateOfBirth: '',
  officialPhoneNumber: '',
  officialEmail: '',
  employeeId: '',
  department: '',
  designation: '',
  grade: '',
  province: '',
  city: '',
  district: '',
  zone: '',
  govOffice: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
};

export function GovAccessRequestPage() {
  const navigate = useNavigate();
  const { isAdminAuthed } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifySubStep, setVerifySubStep] = useState<'employee' | 'otp'>('employee');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAdminAuthed) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validatePersonal = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    if (!CNIC_RE.test(form.cnic)) e.cnic = 'Use CNIC format 12345-1234567-1.';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required.';
    if (!PHONE_RE.test(form.officialPhoneNumber)) e.officialPhoneNumber = 'Use phone format 03XX-XXXXXXX.';
    if (!EMAIL_RE.test(form.officialEmail)) e.officialEmail = 'Enter a valid official email address.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateEmployment = () => {
    const e: Record<string, string> = {};
    if (!form.employeeId.trim()) e.employeeId = 'Employee / Service ID is required.';
    if (!form.department) e.department = 'Select a department.';
    if (!form.designation) e.designation = 'Select a designation.';
    if (!form.grade) e.grade = 'Select a BPS / grade.';
    if (!form.province) e.province = 'Select a province.';
    if (!form.city) e.city = 'Select a city.';
    if (!form.district.trim()) e.district = 'District is required.';
    if (!form.zone) e.zone = 'Select an assigned zone / sector.';
    if (!form.govOffice.trim()) e.govOffice = 'Government office / unit is required.';
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
    if (step === 1 && !validateEmployment()) return;
    if (step === 2 && !validateSecurity()) return;
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const finalizeRequest = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const user = await requestGovAccess({
        fullName: form.fullName,
        cnic: form.cnic,
        dateOfBirth: form.dateOfBirth,
        officialPhoneNumber: form.officialPhoneNumber,
        officialEmail: form.officialEmail,
        employeeId: form.employeeId,
        department: form.department,
        designation: form.designation,
        grade: form.grade,
        province: form.province,
        city: form.city,
        district: form.district,
        zone: form.zone,
        govOffice: form.govOffice,
        password: form.password,
      });
      navigate('/admin/pending-approval', { state: { userId: user.userId, email: user.email } });
    } catch (err) {
      setSubmitError(err instanceof AuthError ? err.message : 'Could not submit your request. Please try again.');
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  const cities = form.province ? CITIES_BY_PROVINCE[form.province] || [] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="gov-signup-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0d1d3a" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gov-signup-grid)" />
        </svg>
      </div>
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />

      <Link
        to="/admin/login"
        className="absolute top-6 left-6 z-10 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-2xl"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 sm:p-10">
          <div className="flex flex-col items-center mb-7">
            <LogoFull size={42} />
            <h1 className="mt-4 text-xl font-extrabold text-navy-900 tracking-tight text-center">
              Request Government Officer Access
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Access Request &amp; Verification
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            This is not automatic public sign-up. Requests go through demo identity/employee verification and require
            administrator approval before officer access is granted.
          </div>

          <AuthStepper steps={STEPS} currentIndex={step} />

          <AnimatePresence>
            {step === 0 && (
              <motion.div key="personal" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                <h2 className="text-sm font-semibold text-navy-900">Personal Information</h2>
                <Field label="Full Name" icon={User} value={form.fullName} onChange={(v) => update('fullName', v)} error={errors.fullName} placeholder="Officer Khan" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="CNIC Number" icon={IdCard} value={form.cnic} onChange={(v) => update('cnic', v)} error={errors.cnic} placeholder="37405-7654321-3" />
                  <Field label="Date of Birth" icon={Calendar} type="date" value={form.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} error={errors.dateOfBirth} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Official Phone Number" icon={Phone} value={form.officialPhoneNumber} onChange={(v) => update('officialPhoneNumber', v)} error={errors.officialPhoneNumber} placeholder="0301-7654321" />
                  <Field label="Official Email Address" icon={Mail} type="email" value={form.officialEmail} onChange={(v) => update('officialEmail', v)} error={errors.officialEmail} placeholder="you@department.gov.pk" />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="employment" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                <h2 className="text-sm font-semibold text-navy-900">Government Employment Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Employee / Service ID" icon={BadgeCheck} value={form.employeeId} onChange={(v) => update('employeeId', v)} error={errors.employeeId} placeholder="GOV-10245" />
                  <SelectField label="Department / Organization" icon={Building2} value={form.department} onChange={(v) => update('department', v)} error={errors.department} options={DEPARTMENTS} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <SelectField label="Designation" icon={Briefcase} value={form.designation} onChange={(v) => update('designation', v)} error={errors.designation} options={DESIGNATIONS} />
                  <SelectField label="BPS / Grade" icon={BadgeCheck} value={form.grade} onChange={(v) => update('grade', v)} error={errors.grade} options={BPS_GRADES} />
                </div>
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
                  <Field label="District" icon={MapPin} value={form.district} onChange={(v) => update('district', v)} error={errors.district} placeholder="Islamabad" />
                  <SelectField label="Assigned Zone / Sector" icon={MapPin} value={form.zone} onChange={(v) => update('zone', v)} error={errors.zone} options={ZONES} />
                </div>
                <Field label="Government Office / Unit" icon={Building2} value={form.govOffice} onChange={(v) => update('govOffice', v)} error={errors.govOffice} placeholder="Zonal Office, Sector G-9" />
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
                {verifySubStep === 'employee' ? (
                  <VerificationStep
                    title="Verifying government employment"
                    description="Running a demo employee-directory check for your department."
                    icon="employee"
                    run={() => mockGovEmployeeVerification({ employeeId: form.employeeId, department: form.department, cnic: form.cnic })}
                    onDone={() => setVerifySubStep('otp')}
                  />
                ) : (
                  <OtpStep destination={form.officialEmail} onVerified={finalizeRequest} />
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

          {step === 3 && submitting && (
            <p className="text-center text-xs text-slate-400 mt-4">Submitting your request…</p>
          )}
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

interface SelectFieldProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  options: readonly string[] | string[];
}

function SelectField({ label, icon: Icon, value, onChange, error, options }: SelectFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-navy-900 mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-navy-900 btn-focus transition-colors appearance-none"
        >
          <option value="">Select</option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
