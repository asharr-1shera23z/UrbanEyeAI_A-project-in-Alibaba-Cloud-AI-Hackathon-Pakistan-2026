// Static reference data for signup / access-request forms.
// A real deployment would likely source this from a government administrative
// boundaries API — kept static here to keep the prototype self-contained.

export const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir',
] as const;

export const CITIES_BY_PROVINCE: Record<string, string[]> = {
  Punjab: ['Lahore', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur'],
  Sindh: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Mirpurkhas'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Abbottabad', 'Mardan', 'Swat', 'Kohat'],
  Balochistan: ['Quetta', 'Gwadar', 'Turbat', 'Sibi'],
  'Islamabad Capital Territory': ['Islamabad'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza'],
  'Azad Jammu & Kashmir': ['Muzaffarabad', 'Mirpur', 'Rawalakot'],
};

export const ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];

export const DEPARTMENTS = [
  'Municipal Corporation',
  'Water & Sanitation Agency (WASA)',
  'Solid Waste Management Department',
  'Roads & Infrastructure Department',
  'Development Authority',
  'Traffic Engineering & Planning Agency',
  'Parks & Horticulture Authority',
];

export const DESIGNATIONS = [
  'Field Inspector',
  'Field Officer',
  'Sanitary Supervisor',
  'Supervisor',
  'Assistant Director',
  'Deputy Director',
  'Department Administrator',
  'System Administrator',
];

export const BPS_GRADES = ['BPS-11', 'BPS-14', 'BPS-16', 'BPS-17', 'BPS-18', 'BPS-19', 'BPS-20'];

/** Rough heuristic mapping from a chosen designation to an internal role,
 *  used only by the mock approval flow to pre-select a sensible role. A real
 *  system would let a System Admin assign the role explicitly on approval. */
export function roleForDesignation(designation: string): 'FIELD_OFFICER' | 'SUPERVISOR' | 'DEPARTMENT_ADMIN' | 'SYSTEM_ADMIN' {
  const d = designation.toLowerCase();
  if (d.includes('system administrator')) return 'SYSTEM_ADMIN';
  if (d.includes('department administrator') || d.includes('deputy director') || d.includes('assistant director')) return 'DEPARTMENT_ADMIN';
  if (d.includes('supervisor')) return 'SUPERVISOR';
  return 'FIELD_OFFICER';
}
