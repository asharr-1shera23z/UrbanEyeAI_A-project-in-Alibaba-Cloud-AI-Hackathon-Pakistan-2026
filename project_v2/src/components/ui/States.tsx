import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-5">
        {icon || <AlertCircle className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-navy-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{message}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actionLabel && (
            <Button size="sm" onClick={onAction} icon={<ArrowRight className="w-4 h-4" />}>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && (
            <Button size="sm" variant="outline" onClick={onSecondary} icon={<RefreshCw className="w-4 h-4" />}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-5">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-navy-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} icon={<RefreshCw className="w-4 h-4" />}>
          Try Again
        </Button>
      )}
    </motion.div>
  );
}
