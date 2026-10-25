import type { PropertyPerformanceData, ApartmentQcAdditionalRevenueDto } from '@/types/property-tax/apartment';

export function formatAmount(
  val: unknown,
  opts?: { showSign?: boolean; absolute?: boolean }
): string {
  if (val === null || val === undefined) return '-';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return '-';
  const absVal = Math.abs(num);
  const formatted = `₹${absVal.toLocaleString('en-IN')}`;
  if (opts?.absolute) return formatted;
  if (num < 0) return `-₹${absVal.toLocaleString('en-IN')}`;
  if (opts?.showSign && num > 0) return `+₹${absVal.toLocaleString('en-IN')}`;
  return formatted;
}

export function mapPerformanceSummary(
  addRev?: ApartmentQcAdditionalRevenueDto | null
): PropertyPerformanceData {
  if (!addRev) {
    return {
      thisAssessmentRevenue: '₹0',
      revenueGrowthPct: '',
      currentTax: '-',
      retroTax: '-',
      totalTax: '-',
      totalDemand: '-',
      currentDemand: '-',
      pendingDemand: '-',
      collectionAmount: '-',
      collectionPercent: '0%',
      totalBalance: '-',
      totalOutstanding: '-',
      arrears: '-',
      interest: '-',
      advance: '-',
      oldCurrentTax: '-',
      differenceAmount: '-',
      rawDifferenceAmount: null,
      changePercent: null,
      isGrowthNegative: false,
    };
  }

  const rawDifference = addRev.differenceAmount;
  const rawThisAssessment = addRev.thisAssessment;
  const rawTotalTax = addRev.totalTax;
  const heroAmount = rawDifference ?? rawThisAssessment ?? rawTotalTax;

  const thisAssessmentRevenue =
    heroAmount !== undefined && heroAmount !== null
      ? formatAmount(heroAmount)
      : '₹0';

  const rawChangePct = addRev.changePercent;
  let revenueGrowthPct = '';
  let isGrowthNegative = false;

  if (rawChangePct !== undefined && rawChangePct !== null && !isNaN(rawChangePct)) {
    const formattedPct = Math.abs(rawChangePct).toFixed(2).replace(/\.00$/, '');
    if (rawChangePct < 0) {
      revenueGrowthPct = `↓ ${formattedPct}%`;
      isGrowthNegative = true;
    } else if (rawChangePct > 0) {
      revenueGrowthPct = `↑ ${formattedPct}%`;
      isGrowthNegative = false;
    } else {
      revenueGrowthPct = '0%';
      isGrowthNegative = false;
    }
  }

  const collVal = addRev.collection;
  const demandVal = addRev.totalDemand ?? addRev.totalTax;
  let collectionPercent = '0%';
  if (collVal != null && demandVal != null && demandVal > 0) {
    collectionPercent = `${Math.round((collVal / demandVal) * 100)}%`;
  }

  return {
    thisAssessmentRevenue,
    revenueGrowthPct,
    currentTax: formatAmount(addRev.currentTax),
    retroTax: formatAmount(addRev.retroTax),
    totalTax: formatAmount(addRev.totalTax),
    totalDemand: formatAmount(addRev.totalDemand),
    currentDemand: formatAmount(addRev.currentTax ?? addRev.currentDemand),
    pendingDemand: formatAmount(addRev.pendingDemand ?? addRev.retroTax),
    collectionAmount: formatAmount(addRev.collection),
    collectionPercent,
    totalBalance: formatAmount(addRev.totalBalance),
    totalOutstanding: formatAmount(addRev.totalOutstanding ?? addRev.totalBalance),
    arrears: formatAmount(addRev.arrears ?? addRev.pendingDemand),
    interest: formatAmount(addRev.interest),
    advance: formatAmount(addRev.advance),
    oldCurrentTax: formatAmount(addRev.oldCurrentTax),
    differenceAmount: formatAmount(addRev.differenceAmount, { showSign: true }),
    rawDifferenceAmount: addRev.differenceAmount ?? null,
    changePercent: addRev.changePercent ?? null,
    isGrowthNegative,
  };
}
