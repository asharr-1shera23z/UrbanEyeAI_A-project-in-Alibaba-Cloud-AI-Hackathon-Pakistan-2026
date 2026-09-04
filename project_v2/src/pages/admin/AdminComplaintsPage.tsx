import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, SlidersHorizontal } from 'lucide-react';
import { fadeInUp, staggerFast, viewportOnce } from '@/utils/motion';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterBar } from '@/components/ui/FilterBar';
import { TicketTable, TicketCard } from '@/components/TicketTable';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { getTickets } from '@/services/api';
import type { Ticket, IssueCategory, Priority, TicketStatus } from '@/types';

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

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'priority', label: 'Highest Priority' },
];

type SortKey = 'newest' | 'oldest' | 'priority';

export function AdminComplaintsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: 'All', priority: 'All', status: 'All' });
  const [sort, setSort] = useState<SortKey>('newest');

  useEffect(() => {
    let active = true;
    getTickets()
      .then((t) => { if (active) setTickets(t); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    let result = [...tickets];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticketId.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    if (filters.category !== 'All') result = result.filter((t) => t.category === filters.category);
    if (filters.priority !== 'All') result = result.filter((t) => t.priority === filters.priority);
    if (filters.status !== 'All') result = result.filter((t) => t.status === filters.status);

    if (sort === 'newest') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sort === 'oldest') result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sort === 'priority') {
      const order: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      result.sort((a, b) => order[a.priority] - order[b.priority]);
    }
    return result;
  }, [tickets, search, filters, sort]);

  const clearFilters = () => {
    setSearch('');
    setFilters({ category: 'All', priority: 'All', status: 'All' });
    setSort('newest');
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy-900">Complaints</h1>
        <p className="mt-1 text-sm text-slate-500">Search, filter, and manage all urban infrastructure complaints.</p>
      </div>

      {/* Controls */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by ticket, category, or location..."
            className="flex-1"
          />
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="appearance-none h-10 pl-3.5 pr-9 rounded-lg border border-slate-200 bg-white text-sm font-medium text-navy-700 btn-focus cursor-pointer"
              aria-label="Sort"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>
            <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <FilterBar
          filters={[
            { label: 'Category', value: filters.category, options: categoryOptions, onChange: (v) => setFilters((f) => ({ ...f, category: v })) },
            { label: 'Priority', value: filters.priority, options: priorityOptions, onChange: (v) => setFilters((f) => ({ ...f, priority: v })) },
            { label: 'Status', value: filters.status, options: statusOptions, onChange: (v) => setFilters((f) => ({ ...f, status: v })) },
          ]}
          onClear={clearFilters}
        />
      </div>

      {/* Content */}
      {error ? (
        <ErrorState message="Unable to load complaints." onRetry={() => window.location.reload()} />
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 card-shadow">
          <TableSkeleton rows={8} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 card-shadow">
          <EmptyState
            icon={<ClipboardList className="w-8 h-8" />}
            title="No complaints found"
            message="No reports match your filters. Try adjusting your search or filters."
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden">
            <TicketTable tickets={filtered} />
          </div>

          {/* Mobile cards */}
          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {filtered.map((t) => (
              <motion.div key={t.id} variants={fadeInUp}>
                <TicketCard ticket={t} />
              </motion.div>
            ))}
          </motion.div>

          <p className="mt-4 text-xs text-slate-400">
            Showing {filtered.length} of {tickets.length} complaints
          </p>
        </>
      )}
    </motion.div>
  );
}
