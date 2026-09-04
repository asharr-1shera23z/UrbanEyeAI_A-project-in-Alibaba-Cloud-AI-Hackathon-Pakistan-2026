import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { MapComponent } from '@/components/MapComponent';
import { FilterBar } from '@/components/ui/FilterBar';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badges';
import { MapSkeleton } from '@/components/ui/Skeleton';
import { getMapIssues } from '@/services/api';
import type { MapIssue, IssueCategory, Priority, TicketStatus } from '@/types';

const categoryOptions = [
  { value: 'All', label: 'All' },
  { value: 'Pothole', label: 'Pothole / Surface Damage' },
  { value: 'Drain', label: 'Drain / Blockage' },
  { value: 'Road Damage', label: 'Road Damage' },
  { value: 'Garbage', label: 'Garbage' },
  { value: 'Damaged Pavement', label: 'Damaged Pavement' },
];

const priorityOptions = [
  { value: 'All', label: 'All' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const statusOptions = [
  { value: 'All', label: 'All' },
  { value: 'Detected', label: 'Detected' },
  { value: 'Verified', label: 'Verified' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
];

export function AdminMapPage() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MapIssue | null>(null);
  const [filters, setFilters] = useState({ category: 'All', priority: 'All', status: 'All' });

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMapIssues({
      category: filters.category as IssueCategory | 'All',
      priority: filters.priority as Priority | 'All',
      status: filters.status as TicketStatus | 'All',
    })
      .then((data) => { if (active) setIssues(data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy-900">Operations Map</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor and triage infrastructure issues geographically.</p>
      </div>

      {/* Filters + Legend */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterBar
          filters={[
            { label: 'Category', value: filters.category, options: categoryOptions, onChange: (v) => setFilters((f) => ({ ...f, category: v })) },
            { label: 'Priority', value: filters.priority, options: priorityOptions, onChange: (v) => setFilters((f) => ({ ...f, priority: v })) },
            { label: 'Status', value: filters.status, options: statusOptions, onChange: (v) => setFilters((f) => ({ ...f, status: v })) },
          ]}
          onClear={() => setFilters({ category: 'All', priority: 'All', status: 'All' })}
        />
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium text-slate-500">Legend:</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> High</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Low</span>
        </div>
      </div>

      {/* Map + side panel */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-[600px]">
          {loading ? <MapSkeleton /> : (
            <MapComponent
              issues={issues}
              onMarkerClick={(issue) => setSelected(issue)}
              selectedId={selected?.id}
              height="600px"
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <AnimatePresence>
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl border border-slate-200 card-shadow-lg overflow-hidden"
              >
                <div className="h-2 bg-blue-600 relative">
                  <button
                    onClick={() => setSelected(null)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-navy-900 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-xs text-slate-400 font-medium mb-1">Ticket</p>
                  <h3 className="text-xl font-extrabold text-navy-900 mb-3">{selected.ticketId}</h3>
                  <p className="text-sm font-semibold text-navy-700 mb-1">{selected.category}</p>
                  <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selected.location}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mb-5">
                    <PriorityBadge priority={selected.priority} size="sm" />
                    <StatusBadge status={selected.status} size="sm" />
                  </div>
                  <button
                    onClick={() => navigate(`/admin/complaints/${selected.ticketId}`)}
                    className="w-full h-10 rounded-lg bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
                  >
                    View Full Details
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-slate-200 card-shadow p-5"
              >
                <h3 className="text-sm font-bold text-navy-900 mb-2">All Issues</h3>
                <p className="text-xs text-slate-400 mb-4">Select a marker or click an issue below.</p>
                <div className="space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin">
                  {issues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => setSelected(issue)}
                      className="w-full text-left p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-navy-900">{issue.ticketId}</span>
                        <PriorityBadge priority={issue.priority} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500">{issue.category} · {issue.location}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
