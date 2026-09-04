import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, RotateCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { sendDemoOtp, verifyDemoOtp } from '@/services/mockVerification';

interface OtpStepProps {
  destination: string;
  onVerified: () => void;
}

/**
 * Simulated OTP verification. Since there is no real SMS/email provider in
 * this prototype, the demo code is logged to the console and shown in a
 * banner so reviewers can complete the flow — a production build would
 * remove that banner entirely and rely on the user's inbox/phone.
 */
export function OtpStep({ destination, onVerified }: OtpStepProps) {
  const [expected, setExpected] = useState('');
  const [entered, setEntered] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const sentOnce = useRef(false);

  const send = async () => {
    setSending(true);
    setError('');
    const { otp } = await sendDemoOtp(destination);
    setExpected(otp);
    setSending(false);
  };

  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    setError('');
    await new Promise((r) => setTimeout(r, 500));
    if (verifyDemoOtp(entered, expected)) {
      onVerified();
    } else {
      setError('That code doesn\u2019t match. Please check and try again.');
    }
    setVerifying(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
        <MessageSquareText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-navy-800">
          <p className="font-semibold">Verify {destination}</p>
          <p className="text-navy-600 mt-0.5">
            {sending ? 'Sending a one-time code…' : 'Enter the 6-digit code we sent.'}
          </p>
        </div>
      </div>

      {!sending && (
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Prototype demo — no real SMS/email is sent. Your code: <span className="font-mono font-bold">{expected}</span>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-navy-900 mb-1.5 block">One-Time Code</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={entered}
          onChange={(e) => setEntered(e.target.value.replace(/[^0-9]/g, ''))}
          disabled={sending}
          placeholder="123456"
          className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 text-center text-lg tracking-[0.4em] font-semibold text-navy-900 placeholder:text-slate-300 btn-focus transition-colors disabled:opacity-50"
        />
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Resend code
        </button>
      </div>

      <Button
        type="button"
        fullWidth
        size="lg"
        loading={verifying}
        disabled={sending || entered.length !== 6}
        onClick={handleVerify}
      >
        Verify & Continue
      </Button>
    </motion.div>
  );
}
