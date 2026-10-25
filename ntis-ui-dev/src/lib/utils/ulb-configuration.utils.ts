import type { RenewalAlert } from '@/types/ulbconfig-master.types';

type AlertInterval = { label: string } & ({ months: number } | { days: number });

const PRIMARY_ALERT_INTERVALS: AlertInterval[] = [
  { months: 9, label: '9 Months Before' },
  { months: 6, label: '6 Months Before' },
  { months: 3, label: '3 Months Before' },
  { months: 1, label: '1 Month Before' },
  { days: 15, label: '15 Days Before' },
  { days: 10, label: '10 Days Before' },
  { days: 5, label: '5 Days Before' },
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function diffInDays(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function shiftDate(base: Date, interval: AlertInterval): Date {
  const out = new Date(base);
  if ('months' in interval) {
    out.setMonth(out.getMonth() - interval.months);
  } else {
    out.setDate(out.getDate() - interval.days);
  }
  return out;
}

/** Builds the renewal alert schedule (months, days, daily-final-week, expiry) for an end date. */
export function calculateRenewalAlerts(endDate: string): RenewalAlert[] {
  if (!endDate) return [];

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alerts: RenewalAlert[] = PRIMARY_ALERT_INTERVALS.map((interval) => {
    const alertDate = shiftDate(end, interval);
    return {
      label: interval.label,
      date: alertDate.toISOString().split('T')[0],
      daysRemaining: diffInDays(today, alertDate),
      triggered: today >= alertDate,
    };
  });

  for (let i = 4; i >= 1; i--) {
    const alertDate = shiftDate(end, { days: i, label: '' });
    alerts.push({
      label: `${i} ${i === 1 ? 'Day' : 'Days'} Before`,
      date: alertDate.toISOString().split('T')[0],
      daysRemaining: diffInDays(today, alertDate),
      triggered: today >= alertDate,
    });
  }

  alerts.push({
    label: 'Expiry Day',
    date: end.toISOString().split('T')[0],
    daysRemaining: diffInDays(today, end),
    triggered: today >= end,
  });

  return alerts;
}

/**
 * Computes the licence end date from a start date and a duration string.
 *
 * Numeric values are treated as months. The sentinel `'999'` means perpetual
 * (lifetime) licence and adds 100 years — it is **not** interpreted as 999 months.
 */
export function calculateLicenseEndDate(startDate: string, duration: string): string {
  if (!startDate || !duration || duration === 'custom') return '';

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return '';

  if (duration === '999') {
    start.setFullYear(start.getFullYear() + 100);
    return start.toISOString().split('T')[0];
  }

  const months = Number.parseInt(duration, 10);
  if (!Number.isFinite(months)) return '';

  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return Number.isNaN(end.getTime()) ? '' : end.toISOString().split('T')[0];
}

/**
 * Computes the duration in months between a start date and an end date.
 */
export function calculateDurationInMonths(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';

  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += end.getMonth();
  
  // Adjust for days if end day is significantly earlier in the month than start day
  if (end.getDate() < start.getDate() - 15) {
      months--;
  } else if (end.getDate() > start.getDate() + 15) {
      months++;
  }

  return months > 0 ? months.toString() : '0';
}

/**
 * Formats a duration in months into a human readable string (e.g., "1 Year, 2 Months")
 */
export function formatDurationText(duration: string): string {
  if (!duration || duration === '0') return '0 Months';
  if (duration === '999') return 'Lifetime';
  
  const months = Number.parseInt(duration, 10);
  if (Number.isNaN(months)) return duration;
  
  const y = Math.floor(months / 12);
  const m = months % 12;
  
  const parts = [];
  if (y === 1) parts.push('1 Year');
  else if (y > 1) parts.push(`${y} Years`);
  
  if (m === 1) parts.push('1 Month');
  else if (m > 1) parts.push(`${m} Months`);
  
  return parts.join(', ') || '0 Months';
}

const LICENSE_KEY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomLicenseKeyChar(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return LICENSE_KEY_CHARS.charAt(bytes[0]! % LICENSE_KEY_CHARS.length);
}

/** Generates an `XXXX-XXXX-XXXX-XXXX` activation key using a CSPRNG. */
export function generateLicenseKey(): string {
  const segments: string[] = [];
  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let c = 0; c < 4; c++) {
      segment += randomLicenseKeyChar();
    }
    segments.push(segment);
  }
  return segments.join('-');
}

/** Formats an ISO date as `dd Mon yyyy` in IN locale. */
export function formatExpiryDate(iso: string): string {
  if (!iso) return 'Not Set';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not Set';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
