import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2, ArrowUpRight, ChevronRight } from 'lucide-react';
import { fadeInUp, staggerContainer, viewportOnce, prefersReducedMotion } from '@/utils/motion';
import { StatCard } from '@/components/ui/StatCard';
import { TicketTable } from '@/components/TicketTable';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badges';
import { getDashboardStats, getTickets } from '@/services/api';
import { timeAgo } from '@/utils/formatters';
import type { DashboardStats, Ticket } from '@/types';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getDashboardStats(), getTickets()])
      .then(([s, t]) => {
        if (active) {
          setStats(s);
          setTickets(t.slice(0, 6));
        }
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-900">{greeting}, Officer.</h1>
        <p className="mt-1 text-sm text-slate-500">Here is today's urban infrastructure overview.</p>
      </div>

      {error && <ErrorState message="Unable to load dashboard data." onRetry={() => window.location.reload()} />}

      {!error && (
        <>
          {/* Stats */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {loading || !stats
              ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
              : (
                <>
                  <motion.div variants={fadeInUp}><StatCard label="Total Open Issues" value={stats.totalOpen} icon={<AlertCircle className="w-5 h-5" />} color="blue" trend={{ value: 12, up: true }} /></motion.div>
                  <motion.div variants={fadeInUp}><StatCard label="High Priority" value={stats.highPriority} icon={<ArrowUpRight className="w-5 h-5" />} color="red" trend={{ value: 8, up: true }} /></motion.div>
                  <motion.div variants={fadeInUp}><StatCard label="In Progress" value={stats.inProgress} icon={<Clock className="w-5 h-5" />} color="amber" trend={{ value: 5, up: false }} /></motion.div>
                  <motion.div variants={fadeInUp}><StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" trend={{ value: 23, up: true }} /></motion.div>
                </>
              )}
          </motion.div>

          {/* Recent complaints */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="bg-white rounded-2xl border border-slate-200 card-shadow"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-navy-900">Recent Complaints</h2>
              <Link to="/admin/complaints" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors group">
                View all <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="skeleton h-4 w-20" />
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-4 w-28" />
                    <div className="skeleton h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <TicketTable tickets={tickets} />
            )}
          </motion.div>

          {/* Quick stats footer */}
          {!loading && tickets.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="mt-6 grid sm:grid-cols-3 gap-4"
            >
              <motion.div variants={fadeInUp} whileHover={prefersReducedMotion ? undefined : { y: -3 }}><QuickStat label="Avg. Response Time" value="3.2 days" sub="Down from 4.1 days" /></motion.div>
              <motion.div variants={fadeInUp} whileHover={prefersReducedMotion ? undefined : { y: -3 }}><QuickStat label="Resolution Rate" value="67%" sub="This month" /></motion.div>
              <motion.div variants={fadeInUp} whileHover={prefersReducedMotion ? undefined : { y: -3 }}><QuickStat label="Active Sectors" value="8" sub="Across Islamabad" /></motion.div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}

function QuickStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 card-shadow p-4">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-xl font-extrabold text-navy-900 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}
