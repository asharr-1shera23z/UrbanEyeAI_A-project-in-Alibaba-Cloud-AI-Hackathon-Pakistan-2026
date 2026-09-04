import type {
  Ticket,
  DashboardStats,
  MapIssue,
  IssueCategory,
  Priority,
  TicketStatus,
} from '@/types';

export const issueCategories: {
  name: IssueCategory;
  label: string;
  icon: string;
  count: number;
}[] = [
  { name: 'Pothole', label: 'Pothole / Surface Damage', icon: 'CircleDot', count: 47 },
  { name: 'Drain', label: 'Drain / Blockage', icon: 'Waves', count: 23 },
  { name: 'Road Damage', label: 'Road Damage', icon: 'Construction', count: 31 },
  { name: 'Garbage', label: 'Garbage', icon: 'Trash2', count: 58 },
  { name: 'Damaged Pavement', label: 'Damaged Pavement', icon: 'Route', count: 19 },
];

// Islamabad-area coordinates for realistic mock data
const locations = [
  { lat: 33.6844, lng: 73.0479, name: 'F-7 Markaz, Islamabad' },
  { lat: 33.7214, lng: 73.0568, name: 'F-10 Markaz, Islamabad' },
  { lat: 33.6994, lng: 73.0366, name: 'G-7 Markaz, Islamabad' },
  { lat: 33.6844, lng: 73.0299, name: 'G-6 Markaz, Islamabad' },
  { lat: 33.7382, lng: 73.0848, name: 'I-8 Markaz, Islamabad' },
  { lat: 33.6677, lng: 73.0752, name: 'Blue Area, Islamabad' },
  { lat: 33.6754, lng: 73.0917, name: 'Sadar, Islamabad' },
  { lat: 33.5651, lng: 73.0825, name: 'Bahria Town, Islamabad' },
  { lat: 33.6427, lng: 72.9905, name: 'G-13 Markaz, Islamabad' },
  { lat: 33.5884, lng: 73.0907, name: 'I-11 Markaz, Islamabad' },
];

const categories: IssueCategory[] = [
  'Pothole',
  'Drain',
  'Road Damage',
  'Garbage',
  'Damaged Pavement',
];

const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];
const statuses: TicketStatus[] = ['Detected', 'Verified', 'In Progress', 'Resolved'];

// Realistic pothole/infrastructure stock images from Pexels
const imagePool = [
  'https://images.pexels.com/photos/259947/pexels-photo-259947.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/378558/pexels-photo-378558.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2531237/pexels-photo-2531237.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2732098/pexels-photo-2732098.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/220182/pexels-photo-220182.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1031642/pexels-photo-1031642.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2432257/pexels-photo-2432257.jpeg?auto=compress&cs=tinysrgb&w=800',
];

function randomFrom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function formatDate(daysAgo: number, hoursAgo: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

function generateStatusHistory(
  currentStatus: TicketStatus,
  createdAt: string,
  seed: number
): { status: TicketStatus; timestamp: string; note: string }[] {
  const statusOrder: TicketStatus[] = ['Detected', 'Verified', 'In Progress', 'Resolved'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const history: { status: TicketStatus; timestamp: string; note: string }[] = [];

  const createdDate = new Date(createdAt);
  const notes = [
    'Report received and AI analysis completed.',
    'Verified by field inspector.',
    'Work order assigned to maintenance team.',
    'Issue resolved. Maintenance work completed.',
  ];

  for (let i = 0; i <= currentIndex; i++) {
    const timestamp = new Date(createdDate);
    timestamp.setHours(timestamp.getHours() + i * (6 + (seed % 12)));
    history.push({
      status: statusOrder[i],
      timestamp: timestamp.toISOString(),
      note: notes[i] || 'Status updated.',
    });
  }

  return history;
}

export const mockTickets: Ticket[] = Array.from({ length: 15 }, (_, i) => {
  const seed = i + 1;
  const category = randomFrom(categories, seed);
  const priority = randomFrom(priorities, seed * 3);
  const status = randomFrom(statuses, seed * 7);
  const loc = randomFrom(locations, seed * 2);
  const daysAgo = Math.floor(seed * 1.5) % 20;
  const createdAt = formatDate(daysAgo, seed);
  const confidence = 78 + ((seed * 7) % 20);

  return {
    id: `ticket-${seed}`,
    ticketId: `CIV-${1040 + seed}`,
    category,
    description: [
      'Large pothole near the intersection causing traffic issues.',
      'Drain completely blocked causing water overflow onto road.',
      'Road surface severely damaged with cracks and depressions.',
      'Accumulated garbage not collected for several days.',
      'Pavement tiles broken and creating hazard for pedestrians.',
    ][seed % 5],
    imageUrl: randomFrom(imagePool, seed),
    latitude: loc.lat + (seed * 0.001 - 0.005),
    longitude: loc.lng + (seed * 0.001 - 0.005),
    location: loc.name,
    priority,
    severity: priority === 'HIGH' ? 'HIGH' : priority === 'MEDIUM' ? 'MEDIUM' : 'LOW',
    status,
    confidence,
    createdAt,
    updatedAt: formatDate(Math.max(0, daysAgo - 1), seed * 2),
    statusHistory: generateStatusHistory(status, createdAt, seed),
    notes:
      seed % 3 === 0
        ? [
            {
              id: `note-${seed}`,
              text: 'Inspector visited the site and confirmed the issue.',
              author: 'Officer Khan',
              timestamp: formatDate(Math.max(0, daysAgo - 1)),
            },
          ]
        : [],
    isDuplicate: seed % 5 === 0,
    duplicateOfTicketId: seed % 5 === 0 ? `CIV-${1040 + Math.max(1, seed - 2)}` : null,
    nearbySimilarCount: seed % 5 === 0 ? 2 : 0,
  };
});

export const mockDashboardStats: DashboardStats = {
  totalOpen: 42,
  highPriority: 12,
  inProgress: 28,
  resolved: 86,
};

export const mockMapIssues: MapIssue[] = mockTickets.map((t) => ({
  id: t.id,
  ticketId: t.ticketId,
  category: t.category,
  latitude: t.latitude,
  longitude: t.longitude,
  priority: t.priority,
  status: t.status,
  location: t.location,
}));

export const mockAnalyticsData = {
  byCategory: [
    { name: 'Potholes', value: 47, fill: '#2563eb' },
    { name: 'Drains', value: 23, fill: '#db2777' },
    { name: 'Road Damage', value: 31, fill: '#7c3aed' },
    { name: 'Garbage', value: 58, fill: '#0891b2' },
    { name: 'Pavement', value: 19, fill: '#16a34a' },
  ],
  byStatus: [
    { name: 'Detected', value: 18, fill: '#3b82f6' },
    { name: 'Verified', value: 14, fill: '#8b5cf6' },
    { name: 'In Progress', value: 28, fill: '#f59e0b' },
    { name: 'Resolved', value: 86, fill: '#16a34a' },
  ],
  byPriority: [
    { name: 'High', value: 12, fill: '#dc2626' },
    { name: 'Medium', value: 24, fill: '#f59e0b' },
    { name: 'Low', value: 18, fill: '#16a34a' },
  ],
  topLocations: [
    { location: 'F-7 Markaz', issues: 14 },
    { location: 'G-7 Markaz', issues: 11 },
    { location: 'Blue Area', issues: 9 },
    { location: 'F-10 Markaz', issues: 8 },
    { location: 'I-8 Markaz', issues: 7 },
    { location: 'Sadar', issues: 6 },
    { location: 'Bahria Town', issues: 5 },
  ],
  trend: [
    { day: 'Mon', reports: 12, resolved: 8 },
    { day: 'Tue', reports: 15, resolved: 10 },
    { day: 'Wed', reports: 9, resolved: 12 },
    { day: 'Thu', reports: 18, resolved: 11 },
    { day: 'Fri', reports: 22, resolved: 14 },
    { day: 'Sat', reports: 14, resolved: 16 },
    { day: 'Sun', reports: 8, resolved: 9 },
  ],
  insights: [
    'Pothole reports increased 23% this week, concentrated in F-sector roads.',
    'Average resolution time is 3.2 days, down from 4.1 days last month.',
    'Garbage accumulation reports peak on weekends in commercial areas.',
    'High-priority issues are being verified 40% faster than last quarter.',
  ],
};
