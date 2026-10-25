/**
 * Common PTIS revenue evaluation utilities.
 * Usable on both server (builders/SSR) and client (React components/hooks).
 */

export interface RevenueCheckablePerformance {
  thisAssessmentRevenue?: string | null;
  currentTax?: string | null;
}

/**
 * Checks whether property performance data has zero or unpopulated revenue.
 */
export function isPropertyRevenueZero(
  perf?: RevenueCheckablePerformance | null
): boolean {
  if (!perf) return true;
  return (
    !perf.thisAssessmentRevenue ||
    perf.thisAssessmentRevenue === '₹0' ||
    perf.thisAssessmentRevenue === '-' ||
    perf.currentTax === '₹0' ||
    perf.currentTax === '-'
  );
}
