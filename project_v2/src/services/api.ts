// -----------------------------------------------------------------------------
// API SERVICE (real backend)
// -----------------------------------------------------------------------------
// Talks to the FastAPI backend's REST endpoints. Every function that the
// original mock version exported (getTickets, getTicketById, submitReport,
// updateTicketStatus, getMapIssues, getDashboardStats, getAnalyticsData,
// analyzeImage) keeps the exact same name and signature, so no page needed
// to change its imports. addTicketNote and correctTicketCategory are new,
// additive exports used by AdminComplaintDetailsPage to reach the backend's
// note and AI-class-correction endpoints.
// -----------------------------------------------------------------------------

import type {
  Ticket,
  DashboardStats,
  MapIssue,
  IssueCategory,
  Priority,
  TicketStatus,
  AIAnalysis,
  TicketNote,
  AppNotification,
  AnalyticsData,
} from '@/types';
import { http } from './httpClient';

export async function getTickets(): Promise<Ticket[]> {
  return http.get<Ticket[]>('/api/tickets');
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  try {
    return await http.get<Ticket>(`/api/tickets/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function submitReport(data: {
  image: string;
  latitude: number;
  longitude: number;
  location: string;
  description?: string;
  aiAnalysis: AIAnalysis;
}): Promise<{ ticketId: string; isDuplicate: boolean; duplicateOfTicketId?: string | null; nearbySimilarCount: number }> {
  return http.post<{ ticketId: string; isDuplicate: boolean; duplicateOfTicketId?: string | null; nearbySimilarCount: number }>(
    '/api/tickets',
    data
  );
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
  note?: string
): Promise<{ success: boolean }> {
  return http.patch<{ success: boolean }>(`/api/tickets/${encodeURIComponent(id)}/status`, { status, note });
}

export async function addTicketNote(id: string, text: string): Promise<TicketNote> {
  return http.post<TicketNote>(`/api/tickets/${encodeURIComponent(id)}/notes`, { text });
}

export async function correctTicketCategory(id: string, category: IssueCategory): Promise<Ticket> {
  return http.patch<Ticket>(`/api/tickets/${encodeURIComponent(id)}/category`, { category });
}

export async function getMapIssues(filters?: {
  category?: IssueCategory | 'All';
  priority?: Priority | 'All';
  status?: TicketStatus | 'All';
  lat?: number;
  lng?: number;
  radius?: number;
}): Promise<MapIssue[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.priority) params.set('priority', filters.priority);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.lat != null) params.set('lat', String(filters.lat));
  if (filters?.lng != null) params.set('lng', String(filters.lng));
  if (filters?.radius != null) params.set('radius', String(filters.radius));
  const qs = params.toString();
  return http.get<MapIssue[]>(`/api/map/issues${qs ? `?${qs}` : ''}`);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return http.get<DashboardStats>('/api/dashboard/stats');
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  return http.get<AnalyticsData>('/api/analytics');
}

export async function analyzeImage(image: string): Promise<AIAnalysis> {
  return http.post<AIAnalysis>('/api/ai/analyze', { image });
}

export async function getNotifications(): Promise<AppNotification[]> {
  return http.get<AppNotification[]>('/api/notifications');
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  return http.post<AppNotification>(`/api/notifications/${encodeURIComponent(id)}/read`);
}
