import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ScanFace, CheckCircle2, BadgeCheck } from 'lucide-react';

interface VerificationStepProps {
  title: string;
  description: string;
  run: () => Promise<{ message: string; reference: string }>;
  onDone: () => void;
  icon?: 'identity' | 'employee';
}

/**
 * Shows a brief, clearly-labeled "Identity Verification: Demo/Prototype"
 * animation while the mock verification service runs, then a success state.
 * This is UI-only — the actual (fake) verification work happens in
 * services/mockVerification.ts.
 */
export function VerificationStep({ title, description, run, onDone, icon = 'identity' }: VerificationStepProps) {
  const [phase, setPhase] = useState<'running' | 'done'>('running');
  const [reference, setReference] = useState('');
  const started = useRef(false);
  const Icon = icon === 'identity' ? ScanFace : BadgeCheck;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run().then((res) => {
      setReference(res.reference);
      setPhase('done');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
      <div className="relative w-20 h-20 mx-auto mb-5">
        <motion.div
          animate={phase === 'running' ? { scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] } : { scale: 1, opacity: 0.15 }}
          transition={{ duration: 1.4, repeat: phase === 'running' ? Infinity : 0, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-blue-400/30"
        />
        <div className="absolute inset-2 rounded-full bg-navy-900 flex items-center justify-center">
          {phase === 'running' ? (
            <Icon className="w-8 h-8 text-blue-400" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          )}
        </div>
      </div>

      <h3 className="font-bold text-navy-900">{phase === 'running' ? title : 'Verification Complete'}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
        {phase === 'running' ? description : 'Your details matched our demo verification records.'}
      </p>

      <span className="inline-block mt-4 text-[11px] font-semibold tracking-wide uppercase text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
        Identity Verification: Demo / Prototype
      </span>

      {phase === 'done' && (
        <>
          <p className="mt-3 text-xs text-slate-400 font-mono">Ref: {reference}</p>
          <button
            type="button"
            onClick={onDone}
            className="mt-5 inline-flex items-center justify-center h-11 px-6 rounded-lg bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
          >
            Continue
          </button>
        </>
      )}
    </motion.div>
  );
}
