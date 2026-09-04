import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

interface MockCaptchaProps {
  onChange: (valid: boolean) => void;
}

/**
 * A lightweight, self-contained "prove you're human" widget for this
 * prototype — a simple arithmetic check. Not a real CAPTCHA / bot-defense
 * service; swap for something like hCaptcha or reCAPTCHA in production.
 */
export function MockCaptcha({ onChange }: MockCaptchaProps) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const regenerate = useCallback(() => {
    setA(Math.floor(Math.random() * 8) + 2);
    setB(Math.floor(Math.random() * 8) + 1);
    setValue('');
    setTouched(false);
    onChange(false);
  }, [onChange]);

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (v: string) => {
    setValue(v);
    setTouched(true);
    onChange(Number(v) === a + b);
  };

  const isValid = Number(value) === a + b;

  return (
    <div>
      <label className="text-sm font-medium text-navy-900 mb-1.5 block">Verification</label>
      <div className="flex items-center gap-2">
        <div className="h-11 px-4 rounded-lg border border-slate-200 bg-slate-100 flex items-center gap-2 text-sm font-semibold text-navy-800 select-none tracking-wide shrink-0">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          {a} + {b} =
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => handleChange(e.target.value.replace(/[^0-9]/g, ''))}
          required
          placeholder="?"
          className={`w-full h-11 px-4 rounded-lg border bg-slate-50 text-sm text-navy-900 btn-focus transition-colors ${
            touched ? (isValid ? 'border-emerald-300' : 'border-red-300') : 'border-slate-200'
          }`}
        />
        <button
          type="button"
          onClick={regenerate}
          aria-label="Refresh verification"
          className="shrink-0 h-11 w-11 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-navy-900 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {touched && !isValid && (
        <p className="mt-1.5 text-xs text-red-600">That doesn't look right — try again.</p>
      )}
    </div>
  );
}
