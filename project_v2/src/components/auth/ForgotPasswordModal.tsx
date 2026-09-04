import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  label?: string;
}

export function ForgotPasswordModal({ open, onClose, label = 'email or CNIC' }: ForgotPasswordModalProps) {
  const [value, setValue] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 700);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSent(false);
      setValue('');
    }, 200);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Reset Password" size="sm">
      {sent ? (
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-navy-800 font-medium">Reset link sent (demo)</p>
          <p className="text-xs text-slate-500 mt-1">
            In production, a password reset link would be emailed to you. This prototype doesn't send real email.
          </p>
          <Button size="md" className="mt-5" fullWidth onClick={handleClose}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-500">
            Enter your {label} and we'll send you a link to reset your password.
          </p>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              placeholder={`Your ${label}`}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-navy-900 placeholder:text-slate-400 btn-focus transition-colors"
            />
          </div>
          <Button type="submit" size="md" fullWidth loading={loading} icon={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}>
            Send Reset Link
          </Button>
        </form>
      )}
    </Modal>
  );
}
