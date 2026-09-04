import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, viewportOnce, prefersReducedMotion } from '@/utils/motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, Lightbulb, BarChart3, PieChart as PieIcon, Activity, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { getAnalyticsData } from '@/services/api';

export function AdminAnalyticsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAnalyticsData>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getAnalyticsData()
      .then((d) => { if (active) setData(d); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (error) return <div className="p-6 lg:p-8"><ErrorState message="Unable to load analytics data." onRetry={() => window.location.reload()} /></div>;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 max-w-7xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Insights into urban infrastructure complaints across the city.</p>
      </div>

      {loading || !data ? (
        <div className="grid lg:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-5"
        >
          {/* Trend chart */}
          <motion.div
            variants={fadeInUp}
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            className="bg-white rounded-2xl border border-slate-200 card-shadow p-5 transition-shadow duration-300 hover:shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-navy-900">Weekly Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="reports" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} name="Reports" />
                <Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* By Category */}
            <motion.div
              variants={fadeInUp}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              className="bg-white rounded-2xl border border-slate-200 card-shadow p-5 transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-navy-900">Complaints by Category</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.byCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {data.byCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Status Distribution */}
            <motion.div
              variants={fadeInUp}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              className="bg-white rounded-2xl border border-slate-200 card-shadow p-5 transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <PieIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-navy-900">Status Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data.byStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {data.byStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Priority Distribution */}
            <motion.div
              variants={fadeInUp}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              className="bg-white rounded-2xl border border-slate-200 card-shadow p-5 transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-navy-900">Priority Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data.byPriority}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {data.byPriority.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Top Locations */}
            <motion.div
              variants={fadeInUp}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              className="bg-white rounded-2xl border border-slate-200 card-shadow p-5 transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-navy-900">Top Issue Locations</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.topLocations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="location" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <Bar dataKey="issues" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Key Insights */}
          <motion.div
            variants={fadeInUp}
            className="bg-navy-950 rounded-2xl border border-navy-800 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white">Key Insights</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-navy-900 border border-navy-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-300 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
