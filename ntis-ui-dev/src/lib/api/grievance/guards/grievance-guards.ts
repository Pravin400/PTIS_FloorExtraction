/**
 * Grievance Runtime Guards and Normalizers
 * Enterprise validation layer matching NTIS pattern (e.g., lookup-guards.ts)
 */

import type { Grievance } from '@/types/grievance';

export function isGrievanceObject(obj: unknown): obj is Grievance {
  if (!obj || typeof obj !== 'object') return false;
  const g = obj as Record<string, unknown>;
  return typeof g.id === 'string' && typeof g.title === 'string';
}

export function normalizeGrievance(raw: unknown): Grievance | null {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Record<string, unknown>;

  const str = (v: unknown, defaultVal: string): string =>
    v !== undefined && v !== null ? String(v) : defaultVal;
  const num = (v: unknown, defaultVal: number): number => {
    const n = Number(v);
    return isNaN(n) || v === null || v === undefined ? defaultVal : n;
  };

  const reporter = g['reporter'] && typeof g['reporter'] === 'object'
    ? g['reporter'] as Record<string, unknown>
    : {};

  return {
    id: str(g['id'], ''),
    trackingId: str(g['trackingId'] ?? g['token'] ?? g['id'], ''),
    title: str(g['title'], ''),
    titleMr: str(g['titleMr'] ?? g['title'], ''),
    description: str(g['description'], ''),
    descriptionMr: str(g['descriptionMr'] ?? g['description'], ''),
    category: (g['category'] as Grievance['category']) || 'other',
    subCategory: str(g['subCategory'], ''),
    status: (g['status'] as Grievance['status']) || 'PENDING',
    priority: (g['priority'] as Grievance['priority']) || 'LOW',
    ward: str(g['ward'], ''),
    wardNumber: num(g['wardNumber'], 0),
    zone: str(g['zone'], ''),
    address: str(g['address'], ''),
    landmark: str(g['landmark'], ''),
    lat: num(g['lat'], 0),
    lng: num(g['lng'], 0),
    reportedAt: str(g['reportedAt'], new Date().toISOString()),
    updatedAt: str(g['updatedAt'], new Date().toISOString()),
    slaHours: num(g['slaHours'], 0),
    slaDeadline: str(g['slaDeadline'], ''),
    slaStatus: (g['slaStatus'] as Grievance['slaStatus']) || 'ON_TRACK',
    reporter: {
      name: str(reporter['name'], ''),
      phoneMasked: str(reporter['phoneMasked'], ''),
    },
    timeline: Array.isArray(g['timeline']) ? g['timeline'] : [],
    images: Array.isArray(g['images']) ? g['images'] : [],
    upvotesCount: num(g['upvotesCount'], 0),
  };
}

export function normalizeGrievanceList(raw: unknown): Grievance[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeGrievance)
    .filter((g): g is Grievance => g !== null);
}
