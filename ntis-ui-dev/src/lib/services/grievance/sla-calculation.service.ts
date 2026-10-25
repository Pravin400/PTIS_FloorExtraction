/**
 * SLA Calculation & Escalation Service
 */

import type { SlaStatus, GrievanceStatus } from '@/types/grievance.types';

export interface SlaCalculationResult {
  slaDeadline: string;
  totalSlaHours: number;
  remainingHours: number;
  elapsedHours: number;
  status: SlaStatus;
  isBreached: boolean;
  escalationLevel: 0 | 1 | 2 | 3;
  escalationTitle: string;
  escalationTitleMr: string;
}

/**
 * Computes SLA deadline date from report time and allocated SLA hours.
 */
export function calculateSlaDeadline(reportedAt: string | Date, slaHours: number): Date {
  const start = new Date(reportedAt);
  const deadline = new Date(start.getTime() + slaHours * 60 * 60 * 1000);
  return deadline;
}

/**
 * Calculates current SLA progression, breach status, and administrative escalation level.
 */
export function calculateSlaStatus(
  reportedAt: string | Date,
  slaHours: number,
  currentStatus: GrievanceStatus
): SlaCalculationResult {
  const start = new Date(reportedAt).getTime();
  const now = Date.now();
  const totalMs = slaHours * 60 * 60 * 1000;
  const deadlineMs = start + totalMs;
  const remainingMs = deadlineMs - now;

  const elapsedHours = Math.max(0, Math.round((now - start) / (1000 * 60 * 60)));
  const remainingHours = Math.round(remainingMs / (1000 * 60 * 60));

  // Resolved complaints don't breach further
  if (currentStatus === 'RESOLVED') {
    return {
      slaDeadline: new Date(deadlineMs).toISOString(),
      totalSlaHours: slaHours,
      remainingHours: Math.max(0, remainingHours),
      elapsedHours,
      status: 'ON_TRACK',
      isBreached: false,
      escalationLevel: 0,
      escalationTitle: 'Resolved within SLA',
      escalationTitleMr: 'निकाली काढले',
    };
  }

  let status: SlaStatus = 'ON_TRACK';
  let escalationLevel: 0 | 1 | 2 | 3 = 0;
  let escalationTitle = 'On Track - Ward Officer';
  let escalationTitleMr = 'वेळेत - प्रभाग अधिकारी';

  if (remainingMs <= 0) {
    status = 'BREACHED';
    const overdueHours = Math.abs(remainingHours);
    if (overdueHours > 48) {
      escalationLevel = 3;
      escalationTitle = 'Critical Breach - Commissioner / Super Admin';
      escalationTitleMr = 'गंभीर उल्लंघन - मा. आयुक्त कार्यालय';
    } else {
      escalationLevel = 2;
      escalationTitle = 'SLA Breached - Head of Department (HOD)';
      escalationTitleMr = 'वेळोल्लंघन - विभाग प्रमुख';
    }
  } else if (remainingMs < 0.25 * totalMs || remainingHours <= 6) {
    status = 'NEAR_BREACH';
    escalationLevel = 1;
    escalationTitle = 'Near Breach - Urgent Ward Alert';
    escalationTitleMr = 'मुदत संपत आली - तातडीचा इशारा';
  }

  return {
    slaDeadline: new Date(deadlineMs).toISOString(),
    totalSlaHours: slaHours,
    remainingHours,
    elapsedHours,
    status,
    isBreached: status === 'BREACHED',
    escalationLevel,
    escalationTitle,
    escalationTitleMr,
  };
}

/**
 * Calculates overall SLA compliance percentage from a list of grievances.
 */
export function calculateSlaComplianceRate(
  items: Array<{ reportedAt: string; slaHours: number; status: GrievanceStatus }>
): number {
  if (items.length === 0) return 100;
  const onTrackOrResolved = items.filter((item) => {
    if (item.status === 'RESOLVED') return true;
    const { isBreached } = calculateSlaStatus(item.reportedAt, item.slaHours, item.status);
    return !isBreached;
  });
  return parseFloat(((onTrackOrResolved.length / items.length) * 100).toFixed(1));
}
