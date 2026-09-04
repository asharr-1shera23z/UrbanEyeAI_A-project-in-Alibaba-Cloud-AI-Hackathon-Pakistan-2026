import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { fadeInUp, viewportOnce, prefersReducedMotion } from '@/utils/motion';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'amber' | 'emerald';
  trend?: { value: number; up: boolean };
  delay?: number;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
};

export function StatCard({ label, value, icon, color, trend, delay = 0 }: StatCardProps) {
  const animatedValue = useCountUp(value);
  const colors = colorMap[color];

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay }}
      whileHover={prefersReducedMotion ? undefined : { y: -3, boxShadow: '0 8px 24px rgba(13, 29, 58, 0.08)' }}
      className="bg-white rounded-xl border border-slate-200 card-shadow p-5 transition-colors duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-extrabold text-navy-900 tabular-nums">{animatedValue}</span>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold mb-1.5 ${trend.up ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
