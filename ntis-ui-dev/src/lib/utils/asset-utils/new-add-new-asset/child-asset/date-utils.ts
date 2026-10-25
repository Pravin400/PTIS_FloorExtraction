/* eslint-disable @typescript-eslint/no-explicit-any */
/** Helper to calculate duration between start and end dates */
export function calculateDuration(startStr: string, endStr: string, t: any): string {
  if (!startStr || !endStr) return '';
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return '';

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];
  if (years > 0)
    parts.push(
      `${years} ${years > 1 ? t('subunit.duration.years', 'Yrs') : t('subunit.duration.year', 'Yr')}`
    );
  if (months > 0)
    parts.push(
      `${months} ${months > 1 ? t('subunit.duration.months', 'Months') : t('subunit.duration.month', 'Month')}`
    );
  if (days > 0)
    parts.push(
      `${days} ${days > 1 ? t('subunit.duration.days', 'Days') : t('subunit.duration.day', 'Day')}`
    );

  return parts.join(', ') || t('subunit.duration.zeroDays', '0 Days');
}
