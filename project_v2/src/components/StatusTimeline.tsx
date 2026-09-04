import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import type { TicketStatus, StatusEvent } from '@/types';
import { statusColor, formatDateTime } from '@/utils/formatters';
import { prefersReducedMotion } from '@/utils/motion';

const statusOrder: TicketStatus[] = ['Detected', 'Verified', 'In Progress', 'Resolved'];

interface StatusTimelineProps {
  currentStatus: TicketStatus;
  history: StatusEvent[];
}

export function StatusTimeline({ currentStatus, history }: StatusTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="space-y-0">
      {statusOrder.map((status, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const event = history.find((h) => h.status === status);

        return (
          <div key={status} className="flex gap-4">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3, delay: i * 0.1 }}
                className="relative"
              >
                {isComplete || isCurrent ? (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: isCurrent ? statusColor(status) : '#16a34a' }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center">
                    <Circle className="w-2.5 h-2.5 text-slate-300" />
                  </div>
                )}
                {isCurrent && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: statusColor(status) }}
                  />
                )}
              </motion.div>
              {i < statusOrder.length - 1 && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: isComplete ? 1 : 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: i * 0.1 + 0.2 }}
                  style={{ originY: 0 }}
                  className={`w-0.5 h-12 ${isComplete ? 'bg-emerald-500' : 'bg-slate-200'}`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${i === statusOrder.length - 1 ? 'pb-0' : ''}`}>
              <p
                className={`text-sm font-semibold ${
                  isCurrent ? 'text-navy-900' : isComplete ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {status}
              </p>
              {event ? (
                <div className="mt-0.5">
                  <p className="text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{event.note}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">Pending</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
