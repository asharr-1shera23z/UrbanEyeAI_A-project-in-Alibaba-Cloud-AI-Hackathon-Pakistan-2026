import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Brain,
  AlertTriangle,
  Gauge,
  Target,
  MessageSquare,
  Send,
  Shield,
} from 'lucide-react';
import { StatusBadge, PriorityBadge, SeverityBadge, ConfidenceBadge } from '@/components/ui/Badges';
import { DuplicateWarning } from '@/components/DuplicateWarning';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { getTicketById, updateTicketStatus, addTicketNote, correctTicketCategory } from '@/services/api';
import { formatDate, formatDateTime } from '@/utils/formatters';
import type { Ticket, TicketStatus, IssueCategory } from '@/types';

const statusOptions: TicketStatus[] = ['Detected', 'Verified', 'In Progress', 'Resolved'];
const categoryOptions: IssueCategory[] = [
  'Pothole',
  'Drain',
  'Road Damage',
  'Garbage',
  'Damaged Pavement',
];

export function AdminComplaintDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [correctingCategory, setCorrectingCategory] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    let active = true;
    setLoading(true);
    getTicketById(ticketId)
      .then((t) => { if (active) { setTicket(t); setError(false); } })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ticketId]);

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      await updateTicketStatus(ticket.ticketId, status);
      setTicket({ ...ticket, status, updatedAt: new Date().toISOString() });
      show(`Complaint status updated to ${status}`, 'success');
    } catch {
      show('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim() || !ticket) return;
    setSavingNote(true);
    try {
      const newNote = await addTicketNote(ticket.ticketId, note.trim());
      setTicket({ ...ticket, notes: [...ticket.notes, newNote] });
      setNote('');
      show('Note added', 'success');
    } catch {
      show('Failed to add note', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleCorrectCategory = async (category: IssueCategory) => {
    if (!ticket || category === ticket.category) return;
    setCorrectingCategory(true);
    try {
      const updated = await correctTicketCategory(ticket.ticketId, category);
      setTicket(updated);
      show(`AI classification corrected to ${category}`, 'success');
    } catch {
      show('Failed to correct classification', 'error');
    } finally {
      setCorrectingCategory(false);
    }
  };

  if (loading) return <div className="p-6 lg:p-8 max-w-5xl mx-auto"><DetailSkeleton /></div>;
  if (error) return <div className="p-6 lg:p-8"><ErrorState message="Unable to load complaint details." onRetry={() => window.location.reload()} /></div>;
  if (!ticket) return null;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate('/admin/complaints')}
        className="text-sm text-slate-500 hover:text-navy-900 transition-colors flex items-center gap-1 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Complaints
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 card-shadow p-6 mb-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Complaint</p>
            <h1 className="text-2xl font-extrabold text-navy-900">{ticket.ticketId}</h1>
            <p className="text-sm text-slate-500 mt-1">{ticket.category}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <SeverityBadge severity={ticket.severity} />
          </div>
        </div>
      </motion.div>

      {ticket.isDuplicate && ticket.duplicateOfTicketId && (
        <DuplicateWarning
          duplicateOfTicketId={ticket.duplicateOfTicketId}
          nearbySimilarCount={ticket.nearbySimilarCount}
          linkTo={`/admin/complaints/${ticket.duplicateOfTicketId}`}
          className="mb-5"
        />
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left: Image + details */}
        <div className="space-y-5">
          {/* Image */}
          <div className="bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden">
            <img src={ticket.imageUrl} alt={ticket.category} className="w-full h-56 object-cover" />
            <div className="p-5 space-y-3">
              <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location" value={`${ticket.location} (${ticket.latitude.toFixed(4)}°N, ${ticket.longitude.toFixed(4)}°E)`} />
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Created" value={formatDate(ticket.createdAt)} />
              {ticket.description && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Description</p>
                  <p className="text-sm text-navy-700">{ticket.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-navy-950 flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-navy-900">AI Analysis</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-500">Detected Class</span>
                </div>
                <select
                  value={ticket.category}
                  disabled={correctingCategory}
                  onChange={(e) => handleCorrectCategory(e.target.value as IssueCategory)}
                  className="h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-navy-900 btn-focus disabled:opacity-60"
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-500">Confidence</span>
                </div>
                <ConfidenceBadge confidence={ticket.confidence} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-slate-500">Severity</span>
                </div>
                <SeverityBadge severity={ticket.severity} />
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-navy-700">
                AI assists human decision-making. Officials must verify before acting.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Status controls + notes */}
        <div className="space-y-5">
          {/* Status controls */}
          <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-5">
            <h3 className="text-sm font-bold text-navy-900 mb-4">Status Controls</h3>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => {
                const active = ticket.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updating || active}
                    className={`h-11 rounded-lg text-sm font-semibold border transition-all ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-navy-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                    } ${updating ? 'opacity-60' : ''}`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Last updated: {formatDateTime(ticket.updatedAt)}
            </p>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-navy-700" />
              <h3 className="text-sm font-bold text-navy-900">Notes</h3>
            </div>

            {ticket.notes.length > 0 ? (
              <div className="space-y-3 mb-4">
                {ticket.notes.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-sm text-navy-700">{n.text}</p>
                    <p className="text-xs text-slate-400 mt-1.5">{n.author} · {formatDateTime(n.timestamp)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-4">No notes yet.</p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                placeholder="Add a note..."
                disabled={savingNote}
                className="flex-1 h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-navy-900 placeholder:text-slate-400 btn-focus disabled:opacity-60"
              />
              <Button size="sm" onClick={handleAddNote} loading={savingNote} icon={<Send className="w-3.5 h-3.5" />}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-500">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-navy-900">{value}</p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
