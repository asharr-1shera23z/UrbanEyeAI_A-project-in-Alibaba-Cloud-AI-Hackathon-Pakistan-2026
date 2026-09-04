import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, ArrowRight, Map as MapIcon, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badges';
import { DuplicateWarning } from '@/components/DuplicateWarning';
import type { Priority, TicketStatus, IssueCategory } from '@/types';

interface SubmittedState {
  ticketId: string;
  category: IssueCategory;
  displayCategory?: string;
  priority: Priority;
  location: string;
  status: TicketStatus;
  isDuplicate?: boolean;
  duplicateOfTicketId?: string | null;
  nearbySimilarCount?: number;
}

export function SubmittedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state as SubmittedState | null;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No submission data found.</p>
          <Link to="/report">
            <Button>Report a New Issue</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white rounded-2xl border border-slate-200 card-shadow-lg p-8 text-center"
      >
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2, stiffness: 300 }}
            className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>

        <h1 className="text-2xl font-extrabold text-navy-900 mb-2">Report submitted successfully</h1>
        <p className="text-sm text-slate-500 mb-6">
          Your report has been received and is now being processed.
        </p>

        {/* Ticket reference */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6">
          <p className="text-xs text-slate-400 font-medium mb-1">Your Reference</p>
          <p className="text-2xl font-extrabold text-navy-900 tracking-tight">{data.ticketId}</p>
        </div>

        {data.isDuplicate && data.duplicateOfTicketId && (
          <DuplicateWarning
            duplicateOfTicketId={data.duplicateOfTicketId}
            nearbySimilarCount={data.nearbySimilarCount}
            linkTo={`/track/${data.duplicateOfTicketId}`}
            className="mb-6 text-left"
          />
        )}

        {/* Summary */}
        <div className="space-y-3 text-left mb-8">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Issue Type</span>
            <span className="text-sm font-semibold text-navy-900">{data.displayCategory || data.category}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Priority</span>
            <PriorityBadge priority={data.priority} size="sm" />
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Location</span>
            <span className="text-sm font-semibold text-navy-900 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {data.location}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-500">Status</span>
            <StatusBadge status={data.status} size="sm" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            fullWidth
            onClick={() => navigate(`/track/${data.ticketId}`)}
            icon={<Search className="w-4 h-4" />}
          >
            Track Report
          </Button>
          <Button
            fullWidth
            variant="outline"
            onClick={() => navigate('/map')}
            icon={<MapIcon className="w-4 h-4" />}
          >
            View Issue Map
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
