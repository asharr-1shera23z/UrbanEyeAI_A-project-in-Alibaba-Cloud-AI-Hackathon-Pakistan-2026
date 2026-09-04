import { Check } from 'lucide-react';

interface AuthStepperProps {
  steps: string[];
  currentIndex: number;
}

export function AuthStepper({ steps, currentIndex }: AuthStepperProps) {
  return (
    <div className="flex items-center w-full mb-8">
      {steps.map((label, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-[11px] font-medium text-center leading-tight max-w-[72px] ${
                  active ? 'text-navy-900' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-200 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
