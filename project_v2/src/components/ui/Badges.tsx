import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUp, ArrowDown, Minus, CheckCircle2, Clock, CircleDot } from 'lucide-react';
import type { Priority, TicketStatus, Severity } from '@/types';
import { priorityClasses, statusClasses, severityClasses } from '@/utils/formatters';

export function Badge({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${className}`}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority, size = 'md' }: { priority: Priority; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const icon =
    priority === 'HIGH' ? (
      <ArrowUp className={iconSize} />
    ) : priority === 'LOW' ? (
      <ArrowDown className={iconSize} />
    ) : (
      <Minus className={iconSize} />
    );
  return (
    <Badge className={priorityClasses(priority)}>
      {icon}
      {priority}
    </Badge>
  );
}

export function StatusBadge({ status, size = 'md' }: { status: TicketStatus; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const icon =
    status === 'Resolved' ? (
      <CheckCircle2 className={iconSize} />
    ) : status === 'In Progress' ? (
      <Clock className={iconSize} />
    ) : status === 'Verified' ? (
      <CheckCircle2 className={iconSize} />
    ) : (
      <CircleDot className={iconSize} />
    );
  return (
    <Badge className={statusClasses(status)}>
      {icon}
      {status}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge className={severityClasses(severity)}>
      <AlertTriangle className="w-3.5 h-3.5" />
      {severity}
    </Badge>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
      {confidence}% confidence
    </motion.div>
  );
}
