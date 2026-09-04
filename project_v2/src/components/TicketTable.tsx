import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { Ticket } from '@/types';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badges';
import { timeAgo } from '@/utils/formatters';
import { prefersReducedMotion } from '@/utils/motion';

interface TicketTableProps {
  tickets: Ticket[];
  detailLinkBase?: string;
}

export function TicketTable({ tickets, detailLinkBase = '/admin/complaints' }: TicketTableProps) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 text-left">
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Location</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Reported</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket, i) => (
            <motion.tr
              key={ticket.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2, delay: i * 0.03 }}
              className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
            >
              <td className="px-4 py-3">
                <Link to={`${detailLinkBase}/${ticket.ticketId}`} className="font-semibold text-blue-600 hover:text-blue-700 text-sm">
                  {ticket.ticketId}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-navy-900">{ticket.category}</span>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <span className="text-sm text-slate-600">{ticket.location}</span>
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={ticket.priority} size="sm" />
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <StatusBadge status={ticket.status} size="sm" />
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-sm text-slate-500">{timeAgo(ticket.createdAt)}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`${detailLinkBase}/${ticket.ticketId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-blue-600 transition-colors group"
                >
                  View
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TicketCard({ ticket, detailLinkBase = '/admin/complaints' }: { ticket: Ticket; detailLinkBase?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -3, boxShadow: '0 8px 24px rgba(13, 29, 58, 0.08)' }}
      className="bg-white rounded-xl border border-slate-200 card-shadow p-4 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <Link to={`${detailLinkBase}/${ticket.ticketId}`} className="font-semibold text-blue-600 text-sm">
          {ticket.ticketId}
        </Link>
        <span className="text-xs text-slate-400">{timeAgo(ticket.createdAt)}</span>
      </div>
      <p className="text-sm font-medium text-navy-900 mb-1">{ticket.category}</p>
      <p className="text-xs text-slate-500 mb-3">{ticket.location}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <PriorityBadge priority={ticket.priority} size="sm" />
        <StatusBadge status={ticket.status} size="sm" />
      </div>
    </motion.div>
  );
}
