 
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function fmt(value: number | string | undefined | null): string {
  if (value == null || Number.isNaN(Number(value))) return '0.00';
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayDisplay(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function parseMonthRange(monthValue: string): { from: string; to: string; period: string } {
  if (!monthValue) return { from: '-', to: '-', period: '-' };
  const normalized = monthValue.trim();

  let year: number;
  let monthIndex: number;

  const isoMatch = /^(\d{4})[-/](\d{1,2})$/.exec(normalized);
  const slashMatch = /^(\d{1,2})[/](\d{4})$/.exec(normalized);
  const parts = normalized.split(' ');

  if (isoMatch) {
    year = Number(isoMatch[1]);
    monthIndex = Number(isoMatch[2]) - 1;
  } else if (slashMatch) {
    monthIndex = Number(slashMatch[1]) - 1;
    year = Number(slashMatch[2]);
  } else {
    const monthName = parts[0];
    year = Number.parseInt(parts[parts.length - 1], 10);
    monthIndex = MONTH_NAMES.indexOf(monthName);
  }

  if (monthIndex < 0 || monthIndex > 11 || !Number.isFinite(year)) {
    return { from: monthValue, to: monthValue, period: monthValue };
  }

  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const toDisplayDate = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const mName = MONTH_NAMES[monthIndex];

  return {
    from: toDisplayDate(firstDay),
    to: toDisplayDate(lastDay),
    period: `${mName.slice(0, 3)} ${year}`,
  };
}