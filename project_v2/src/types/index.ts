export type IssueCategory =
  | 'Pothole'
  | 'Drain'
  | 'Road Damage'
  | 'Garbage'
  | 'Damaged Pavement';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketStatus = 'Detected' | 'Verified' | 'In Progress' | 'Resolved';

export interface AIAnalysis {
  detectedClass: IssueCategory;
  displayClass?: string;
  confidence: number;
  severity: Severity;
  priority: Priority;
  description: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface StatusEvent {
  status: TicketStatus;
  timestamp: string;
  note: string;
}

export interface TicketNote {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  ticketId: string;
  category: IssueCategory;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  location: string;
  priority: Priority;
  severity: Severity;
  status: TicketStatus;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusEvent[];
  notes: TicketNote[];
  isDuplicate: boolean;
  duplicateOfTicketId?: string | null;
  nearbySimilarCount: number;
}

export interface DashboardStats {
  totalOpen: number;
  highPriority: number;
  inProgress: number;
  resolved: number;
}

export interface NamedValue {
  name: string;
  value: number;
  fill: string;
}

export interface TopLocation {
  location: string;
  issues: number;
}

export interface TrendPoint {
  day: string;
  reports: number;
  resolved: number;
}

export interface AnalyticsData {
  byCategory: NamedValue[];
  byStatus: NamedValue[];
  byPriority: NamedValue[];
  topLocations: TopLocation[];
  trend: TrendPoint[];
  insights: string[];
}

export interface AppNotification {
  id: string;
  ticketId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface MapIssue {
  id: string;
  ticketId: string;
  category: IssueCategory;
  latitude: number;
  longitude: number;
  priority: Priority;
  status: TicketStatus;
  location: string;
}
