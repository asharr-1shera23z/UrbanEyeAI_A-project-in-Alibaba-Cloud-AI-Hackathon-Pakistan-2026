import type { Priority, TicketStatus, Severity, IssueCategory } from '@/types';

export function priorityClasses(priority: Priority): string {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'MEDIUM':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'LOW':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function statusClasses(status: TicketStatus): string {
  switch (status) {
    case 'Detected':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'Verified':
      return 'bg-violet-50 text-violet-800 border-violet-200';
    case 'In Progress':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Resolved':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function severityClasses(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-900 border-red-300';
    case 'HIGH':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'MEDIUM':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'LOW':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function priorityColor(priority: Priority): string {
  switch (priority) {
    case 'HIGH':
      return '#dc2626';
    case 'MEDIUM':
      return '#f59e0b';
    case 'LOW':
      return '#16a34a';
    default:
      return '#64748b';
  }
}

export function statusColor(status: TicketStatus): string {
  switch (status) {
    case 'Detected':
      return '#3b82f6';
    case 'Verified':
      return '#8b5cf6';
    case 'In Progress':
      return '#f59e0b';
    case 'Resolved':
      return '#16a34a';
    default:
      return '#64748b';
  }
}

export function categoryIcon(category: IssueCategory): string {
  const map: Record<IssueCategory, string> = {
    Pothole: 'CircleDot',
    Drain: 'Waves',
    'Road Damage': 'Construction',
    Garbage: 'Trash2',
    'Damaged Pavement': 'Route',
  };
  return map[category] || 'AlertCircle';
}

export function categoryLabel(category: IssueCategory): string {
  const map: Record<IssueCategory, string> = {
    Pothole: 'Pothole / Surface Damage',
    Drain: 'Drain / Blockage',
    'Road Damage': 'Road Damage',
    Garbage: 'Garbage',
    'Damaged Pavement': 'Damaged Pavement',
  };
  return map[category] || category;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}m ago`;
}
