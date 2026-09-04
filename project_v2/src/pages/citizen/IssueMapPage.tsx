import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Loader2, Navigation } from 'lucide-react';
import { MapComponent } from '@/components/MapComponent';
import { useGeolocation } from '@/hooks/useGeolocation';
import { fadeInUp, staggerFast, viewportOnce, prefersReducedMotion } from '@/utils/motion';
import { FilterBar } from '@/components/ui/FilterBar';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badges';
import { MapSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
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

export function IssueMapPage() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MapIssue | null>(null);
  const [filters, setFilters] = useState({
    category: 'All',
    priority: 'All',
  });

  const mapCenter: [number, number] | undefined =
    geo.status === 'ok' ? [geo.latitude, geo.longitude] : undefined;
  const userLocation: [number, number] | undefined =
    geo.status === 'ok' ? [geo.latitude, geo.longitude] : undefined;

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params: Parameters<typeof getMapIssues>[0] = {
      category: filters.category as IssueCategory | 'All',
      priority: filters.priority as Priority | 'All',
    };
    if (geo.status === 'ok') {
      params.lat = geo.latitude;
      params.lng = geo.longitude;
      params.radius = 15;
    }
    getMapIssues(params)
      .then((data) => { if (active) setIssues(data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters.category, filters.priority, geo.status, geo.latitude, geo.longitude]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-navy-900">City Issue Map</h1>
              <p className="mt-1.5 text-slate-500">
                Explore reported infrastructure issues across the city in real time.
              </p>
            </div>
            <button
              onClick={geo.retry}
              disabled={geo.status === 'detecting'}
              className="inline-flex items-center gap-2 self-start px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-navy-700 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-60"
            >
              {geo.status === 'detecting' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              {geo.status === 'ok'
                ? `Centered on ${geo.locationName || 'your location'}`
                : geo.status === 'detecting'
                ? 'Detecting your location...'
                : 'Use my location'}
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <FilterBar
            filters={[
              { label: 'Category', value: filters.category, options: categoryOptions, onChange: (v) => setFilters((f) => ({ ...f, category: v })) },
              { label: 'Priority', value: filters.priority, options: priorityOptions, onChange: (v) => setFilters((f) => ({ ...f, priority: v })) },
            ]}
            onClear={() => setFilters({ category: 'All', priority: 'All' })}
          />
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> High</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Low</span>
          </div>
        </div>

        {/* Map + side panel */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-[600px]">
            {loading ? (
              <MapSkeleton />
            ) : issues.length === 0 ? (
              <div className="h-full flex items-center justify-center bg-white rounded-xl border border-slate-200">
                <EmptyState
                  icon={<MapPin className="w-8 h-8" />}
                  title="No issues found"
                  message="No issues match your current filters. Try adjusting them."
                  actionLabel="Clear Filters"
                  onAction={() => setFilters({ category: 'All', priority: 'All' })}
                />
              </div>
            ) : (
              <MapComponent
                issues={issues}
                center={mapCenter}
                userLocation={userLocation}
                onMarkerClick={(issue) => setSelected(issue)}
                selectedId={selected?.id}
                height="600px"
              />
            )}
          </div>

          {/* Side panel */}
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
                  <div className="relative">
                    <div className="h-2 bg-blue-600" />
                    <button
                      onClick={() => setSelected(null)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-navy-900 transition-colors p-1 rounded-lg hover:bg-slate-100"
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
                      onClick={() => navigate(`/track/${selected.ticketId}`)}
                      className="w-full h-10 rounded-lg bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 card-shadow p-5"
                >
                  <h3 className="text-sm font-bold text-navy-900 mb-2">Issue List</h3>
                  <p className="text-xs text-slate-400 mb-4">Click a marker on the map to see details, or browse issues below.</p>
                  <motion.div
                    variants={staggerFast}
                    initial="hidden"
                    animate="visible"
                    className="space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin"
                  >
                    {issues.map((issue) => (
                      <motion.button
                        key={issue.id}
                        variants={fadeInUp}
                        onClick={() => setSelected(issue)}
                        whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                        className="w-full text-left p-3 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-navy-900">{issue.ticketId}</span>
                          <PriorityBadge priority={issue.priority} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500">{issue.category} · {issue.location}</p>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
