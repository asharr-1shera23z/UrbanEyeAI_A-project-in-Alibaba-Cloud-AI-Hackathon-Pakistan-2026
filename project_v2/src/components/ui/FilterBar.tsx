import { ChevronDown } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (v: string) => void;
  }[];
  onClear?: () => void;
  className?: string;
}

export function FilterBar({ filters, onClear, className = '' }: FilterBarProps) {
  const hasActive = filters.some((f) => f.value && f.value !== 'All');

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {filters.map((filter) => (
        <div key={filter.label} className="relative">
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="appearance-none h-10 pl-3.5 pr-9 rounded-lg border border-slate-200 bg-white text-sm font-medium text-navy-700 btn-focus transition-colors hover:border-slate-300 cursor-pointer"
            aria-label={filter.label}
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {filter.label}: {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      ))}
      {hasActive && onClear && (
        <button
          onClick={onClear}
          className="h-10 px-3 text-sm font-medium text-slate-500 hover:text-navy-900 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
