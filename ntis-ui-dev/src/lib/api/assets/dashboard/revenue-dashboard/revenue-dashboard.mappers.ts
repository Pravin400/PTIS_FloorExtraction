/**
 * Runtime type guards + normalizers for the Revenue Dashboard API boundary.
 * The backend is trusted but not assumed: every list item and overview section is
 * narrowed from `unknown` and coerced into the strict UI types.
 */
import type {
  AssetRevenueListItem,
  RevenueCategoryDistribution,
  RevenueDashboardOverview,
  RevenueKpiSummary,
  RevenueListResult,
  RevenueMonthlyTrend,
  RevenueZoneStats,
} from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  return value == null ? '' : String(value);
}

export function isRevenueListItemShape(value: unknown): value is Record<string, unknown> {
  const obj = asRecord(value);
  if (!obj) return false;
  return Number.isFinite(Number(obj.id)) && Number.isFinite(Number(obj.assetId));
}

export function normalizeRevenueListItem(data: Record<string, unknown>): AssetRevenueListItem {
  return {
    id: num(data.id),
    assetId: num(data.assetId),
    assetNo: str(data.assetNo),
    assetName: str(data.assetName),
    zoneNo: str(data.zoneNo),
    zoneName: str(data.zoneName),
    wardName: str(data.wardName),
    leaseType: str(data.leaseType),
    tenantName: str(data.tenantName),
    paymentStatus: str(data.paymentStatus),
    monthlyRent: num(data.monthlyRent),
  };
}

export function normalizeRevenueListResult(data: unknown): RevenueListResult {
  const obj = asRecord(data) ?? {};
  const rawItems = Array.isArray(obj.items) ? obj.items : Array.isArray(data) ? data : [];
  const items = rawItems.filter(isRevenueListItemShape).map(normalizeRevenueListItem);
  const pageSize = num(obj.pageSize) || items.length || 10;
  const totalCount = num(obj.totalCount) || items.length;
  return {
    items,
    totalCount,
    pageNumber: num(obj.pageNumber) || 1,
    pageSize,
    totalPages: num(obj.totalPages) || (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1),
    hasPrevious: Boolean(obj.hasPrevious),
    hasNext: Boolean(obj.hasNext),
  };
}

function normalizeSummary(data: unknown): RevenueKpiSummary {
  const obj = asRecord(data) ?? {};
  return {
    totalLeasedAssets: num(obj.totalLeasedAssets),
    totalDistinctAssets: num(obj.totalDistinctAssets),
    paidLeaseCount: num(obj.paidLeaseCount),
    unpaidLeaseCount: num(obj.unpaidLeaseCount),
    monthlyRentTarget: num(obj.monthlyRentTarget),
    totalDemand: num(obj.totalDemand),
    totalCollection: num(obj.totalCollection),
    totalPending: num(obj.totalPending),
    collectionRatePercent: num(obj.collectionRatePercent),
    totalSecurityDeposit: num(obj.totalSecurityDeposit),
  };
}

function normalizeCategory(data: unknown): RevenueCategoryDistribution {
  const obj = asRecord(data) ?? {};
  return {
    assetCategoryId: num(obj.assetCategoryId),
    categoryName: str(obj.categoryName),
    categoryCode: str(obj.categoryCode),
    valuationType: str(obj.valuationType),
    assetCount: num(obj.assetCount),
    leaseCount: num(obj.leaseCount),
    rentCount: num(obj.rentCount),
    paidCount: num(obj.paidCount),
    unpaidCount: num(obj.unpaidCount),
    demand: num(obj.demand),
    collection: num(obj.collection),
    pending: num(obj.pending),
  };
}

function normalizeTrend(data: unknown): RevenueMonthlyTrend {
  const obj = asRecord(data) ?? {};
  return {
    month: num(obj.month),
    monthName: str(obj.monthName),
    demand: num(obj.demand),
    collected: num(obj.collected),
    pending: num(obj.pending),
  };
}

function normalizeZone(data: unknown): RevenueZoneStats {
  const obj = asRecord(data) ?? {};
  return {
    zoneId: num(obj.zoneId),
    zoneName: str(obj.zoneName),
    zoneNo: str(obj.zoneNo),
    demand: num(obj.demand),
    collection: num(obj.collection),
    pending: num(obj.pending),
    collectionRatePercent: num(obj.collectionRatePercent),
    demandSharePercent: num(obj.demandSharePercent),
  };
}

export function normalizeOverview(data: unknown): RevenueDashboardOverview {
  const obj = asRecord(data) ?? {};
  const rawMonth = obj.month;
  return {
    year: num(obj.year),
    month: rawMonth == null ? null : num(rawMonth),
    summary: normalizeSummary(obj.summary),
    categoryDistribution: (Array.isArray(obj.categoryDistribution) ? obj.categoryDistribution : []).map(
      normalizeCategory
    ),
    monthlyTrend: (Array.isArray(obj.monthlyTrend) ? obj.monthlyTrend : []).map(normalizeTrend),
    zoneStats: (Array.isArray(obj.zoneStats) ? obj.zoneStats : []).map(normalizeZone),
  };
}
