import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ShieldAlert, ArrowLeft, Wrench, CheckCircle2, Building2, MapPin } from 'lucide-react';
import { LogoFull } from '@/components/Logo';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getOfficerStatus, approveOfficerDemo } from '@/services/authService';
import type { OfficerStatus } from '@/services/authService';
import { ROLE_LABELS } from '@/types/auth';
import type { AppRole } from '@/types/auth';

/**
 * Shown while a government officer access request is under review. In a real
 * deployment this status is set by a Supervisor / System Admin from a
 * back-office tool. Since this is a hackathon prototype with no such back
 * office, a clearly-labeled demo button lets you simulate that approval so
 * the rest of the officer flow can be reviewed end-to-end.
 */
export function GovPendingApprovalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { show } = useToast();
  const state = location.state as { userId?: string; email?: string } | null;
  const [record, setRecord] = useState<OfficerStatus | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (state?.userId) {
      getOfficerStatus(state.userId).then((r) => setRecord(r ?? null));
    }
  }, [state?.userId]);

  const handleDemoApprove = async () => {
    if (!record) return;
    setApproving(true);
    try {
      await approveOfficerDemo(record.userId);
      show('Application approved (demo). You can now log in.', 'success');
      navigate('/admin/login');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 flex items-center justify-center px-4 py-10 relative overflow-hidden">
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
        className="relative w-full max-w-lg"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 sm:p-10 text-center">
          <LogoFull size={36} className="mx-auto" />

          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mt-6 mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>

          <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">Access Request Pending</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            {record?.accountStatus === 'PENDING_VERIFICATION'
              ? 'Your details are being verified.'
              : 'Your identity and employment details have been demo-verified. A Supervisor or System Administrator now needs to approve this account before you can log in.'}
          </p>

          {record && (
            <div className="mt-6 text-left rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
              <Row icon={ShieldAlert} label="Full Name" value={record.fullName} />
              <Row icon={Building2} label="Department" value={record.department || '-'} />
              <Row
                icon={MapPin}
                label="Jurisdiction"
                value={record.jurisdiction ? `${record.jurisdiction.city}, ${record.jurisdiction.zone || ''}` : '-'}
              />
              <Row icon={CheckCircle2} label="Requested Role" value={ROLE_LABELS[record.role as AppRole] || record.role} />
            </div>
          )}

          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3.5 text-left">
            <p className="text-xs font-semibold text-navy-800 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              Prototype Tool — Demo Approval
            </p>
            <p className="mt-1 text-xs text-slate-500">
              In production this step is performed by a System Administrator in a back-office review tool, not by the
              applicant. This button exists only so the officer dashboards can be reviewed in this demo.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              loading={approving}
              disabled={!record}
              onClick={handleDemoApprove}
            >
              Simulate Admin Approval
            </Button>
          </div>

          {!record && (
            <p className="mt-6 text-xs text-slate-400">
              Already have a pending request? Try signing in — you'll be brought back here automatically.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-navy-900 font-medium truncate">{value}</span>
    </div>
  );
}
