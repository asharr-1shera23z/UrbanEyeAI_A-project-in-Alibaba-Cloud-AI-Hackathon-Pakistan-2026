import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, AlertCircle, ArrowRight, Search } from 'lucide-react';
import { StatusTimeline } from '@/components/StatusTimeline';
import { DuplicateWarning } from '@/components/DuplicateWarning';
import { PriorityBadge, StatusBadge, SeverityBadge, ConfidenceBadge } from '@/components/ui/Badges';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { getTicketById, getTickets } from '@/services/api';
import { formatDate, formatDateTime } from '@/utils/formatters';
import type { Ticket } from '@/types';

export function TrackReportPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchId, setSearchId] = useState('');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState(false);

  useEffect(() => {
    if (ticketId) {
      let active = true;
      setLoading(true);
      getTicketById(ticketId)
        .then((t) => {
          if (active) {
            setTicket(t);
            setError(false);
          }
        })
        .catch(() => { if (active) setError(true); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }

    let active = true;
    setTicketsLoading(true);
    setTicketsError(false);
    getTickets()
      .then((data) => { if (active) setTickets(data); })
      .catch(() => { if (active) setTicketsError(true); })
      .finally(() => { if (active) setTicketsLoading(false); });
    return () => { active = false; };
  }, [ticketId]);

  if (!ticketId) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-navy-900 mb-2">Your Reports</h1>
              <p className="text-slate-500">All the issues you have reported and their current progress.</p>
            </div>
            <Link to="/report">
              <Button icon={<ArrowRight className="w-4 h-4" />}>Report New Issue</Button>
            </Link>
          </div>

          {/* Optional manual search */}
          <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-4 mb-5">
            <label className="text-sm font-medium text-navy-900 mb-2 block">Search by Ticket Reference</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                placeholder="e.g. CIV-1042"
                className="flex-1 h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-navy-900 placeholder:text-slate-400 btn-focus uppercase"
              />
              <Link to={`/track/${searchId || 'CIV-1042'}`}>
                <Button icon={<Search className="w-4 h-4" />}>Track</Button>
              </Link>
            </div>
          </div>

          {ticketsLoading && <ReportsListSkeleton />}

          {!ticketsLoading && ticketsError && (
            <ErrorState
              title="Could not load your reports"
              message="Something went wrong while fetching your reports. Please try again."
              onRetry={() => window.location.reload()}
            />
          )}

          {!ticketsLoading && !ticketsError && tickets.length === 0 && (
            <EmptyState
              icon={<AlertCircle className="w-8 h-8" />}
              title="No reports yet"
              message="You haven't submitted any reports. Start by reporting an issue in your area."
              actionLabel="Report an Issue"
              onAction={() => (window.location.href = '/report')}
            />
          )}

          {!ticketsLoading && !ticketsError && tickets.length > 0 && (
            <motion.div
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 gap-4"
            >
              {tickets.map((t) => (
                <motion.div
                  key={t.id}
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                >
                  <Link
                    to={`/track/${t.ticketId}`}
                    className="block bg-white rounded-2xl border border-slate-200 card-shadow p-5 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-0.5">Report</p>
                        <h3 className="text-lg font-extrabold text-navy-900">{t.ticketId}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={t.status} size="sm" />
                        <PriorityBadge priority={t.priority} size="sm" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-navy-700 mb-1">{t.category}</p>
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {t.location}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(t.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3.5 h-3.5" />
                        View details
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/track" className="text-sm text-slate-500 hover:text-navy-900 transition-colors flex items-center gap-1">
            ← Track another report
          </Link>
        </div>

        {loading && <TrackSkeleton />}

        {!loading && error && (
          <ErrorState
            title="Report not found"
            message="We couldn't find a report with that ticket ID. Please check the reference number and try again."
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && !ticket && (
          <EmptyState
            icon={<AlertCircle className="w-8 h-8" />}
            title="Report not found"
            message="No report matches this ticket ID."
            actionLabel="Report a New Issue"
            onAction={() => (window.location.href = '/report')}
          />
        )}

        {!loading && !error && ticket && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-6 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Report</p>
                  <h1 className="text-2xl font-extrabold text-navy-900">{ticket.ticketId}</h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </div>
              <p className="text-sm text-slate-600">{ticket.category}</p>
            </div>

            {ticket.isDuplicate && ticket.duplicateOfTicketId && (
              <DuplicateWarning
                duplicateOfTicketId={ticket.duplicateOfTicketId}
                nearbySimilarCount={ticket.nearbySimilarCount}
                linkTo={`/track/${ticket.duplicateOfTicketId}`}
                className="mb-5"
              />
            )}

            <div className="grid md:grid-cols-2 gap-5">
              {/* Left: Image & details */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden">
                  <img src={ticket.imageUrl} alt={ticket.category} className="w-full h-52 object-cover" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Location</p>
                        <p className="text-sm font-medium text-navy-900">{ticket.location}</p>
                        <p className="text-xs text-slate-400">{ticket.latitude.toFixed(4)}°N, {ticket.longitude.toFixed(4)}°E</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Reported on</p>
                        <p className="text-sm font-medium text-navy-900">{formatDate(ticket.createdAt)}</p>
                      </div>
                    </div>
                    {ticket.description && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Description</p>
                        <p className="text-sm text-navy-700">{ticket.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Analysis summary */}
                <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-5">
                  <h3 className="text-sm font-bold text-navy-900 mb-3">AI Analysis</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <ConfidenceBadge confidence={ticket.confidence} />
                    <SeverityBadge severity={ticket.severity} />
                  </div>
                  <p className="text-xs text-slate-500">
                    AI detected {ticket.category.toLowerCase()} with {ticket.confidence}% confidence.
                  </p>
                </div>
              </div>

              {/* Right: Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-5">
                <h3 className="text-sm font-bold text-navy-900 mb-4">Status Timeline</h3>
                <StatusTimeline currentStatus={ticket.status} history={ticket.statusHistory} />

                {ticket.status !== 'Resolved' && (
                  <div className="mt-6 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">Latest update</p>
                    <p className="text-xs text-navy-700">
                      {ticket.status === 'Detected'
                        ? 'Your report has been received and is awaiting verification.'
                        : ticket.status === 'Verified'
                        ? 'Your report has been verified and is being assigned for action.'
                        : 'Work is in progress. We will notify you when it is resolved.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Link to="/map">
                <Button variant="outline" icon={<MapPin className="w-4 h-4" />}>View on Map</Button>
              </Link>
              <Link to="/report">
                <Button variant="ghost" icon={<ArrowRight className="w-4 h-4" />}>Report Another Issue</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ReportsListSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 card-shadow p-5 space-y-3">
          <div className="flex items-start justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

function TrackSkeleton() {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-6">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden">
          <Skeleton className="h-52 w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-5 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
