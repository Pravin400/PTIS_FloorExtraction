/**
 * Types for the Revenue Management Dashboard.
 *
 * These mirror the API contract exposed by `RevenueDashboardController`
 * (`/api/RevenueDashboard/*`) on the NTIS platform. Money fields are plain rupee
 * decimals; the UI formats them via `revenue-format.ts`.
 */

export const REVENUE_DEFAULT_PAGE_SIZE = 10;
export const REVENUE_MAX_PAGE_SIZE = 100;
export const REVENUE_LEASE_TYPES = ['Lease', 'Rent'] as const;
export const REVENUE_PAYMENT_STATUSES = ['Paid', 'Unpaid'] as const;

export interface RevenueDashboardPageCopy {
  title: string;
  errors: { loadFailed: string };
  cards: { demand: string; collected: string; lease: string; rent: string; paid: string; unpaid: string };
  filters: { label: string; allZones: string; allWards: string };
  summary: {
    leasedAssets: string;
    leasedAssetsSub: string;
    totalDemand: string;
    totalDemandSub: string;
    totalCollection: string;
    collectionRate: string;
  };
  distribution: { title: string; empty: string };
  format: { currencyPrefix: string; lakhsSuffix: string; croresSuffix: string };
  trend: { title: string; collected: string; pending: string };
  zones: { title: string; totalDemand: string };
  currency: { symbol: string; lakh: string; crore: string };
}

export interface RevenueRecordsPageCopy {
  errors: { loadFailed: string };
  cards: { lease: string; rent: string; demand: string };
  filters: {
    label: string;
    allZones: string;
    allWards: string;
    type: string;
    allTypes: string;
    status: string;
    allStatuses: string;
  };
  records: {
    cols: {
      srNo: string;
      assetId: string;
      assetName: string;
      zone: string;
      ward: string;
      leaseType: string;
      tenant: string;
      status: string;
      rent: string;
    };
    statusPaid: string;
    statusUnpaid: string;
    empty: string;
    allCategories: string;
    searchPlaceholder: string;
    backToDashboard: string;
    totalLeasedAssets: string;
    allCategoriesCount: string;
    total: string;
    collected: string;
    pending: string;
  };
  currency: { symbol: string; lakh: string; crore: string };
}

/** Top KPI cards: leased-asset counts plus demand / collection money for the period. */
export interface RevenueKpiSummary {
  totalLeasedAssets: number;
  totalDistinctAssets: number;
  paidLeaseCount: number;
  unpaidLeaseCount: number;
  monthlyRentTarget: number;
  totalDemand: number;
  totalCollection: number;
  totalPending: number;
  collectionRatePercent: number;
  totalSecurityDeposit: number;
}

/** One "Asset Distribution by Category" card. */
export interface RevenueCategoryDistribution {
  assetCategoryId: number;
  categoryName: string;
  categoryCode: string;
  valuationType: string;
  assetCount: number;
  leaseCount: number;
  rentCount: number;
  paidCount: number;
  unpaidCount: number;
  demand: number;
  collection: number;
  pending: number;
}

/** One point on the "Monthly Revenue Collection Trend" chart. */
export interface RevenueMonthlyTrend {
  month: number;
  monthName: string;
  demand: number;
  collected: number;
  pending: number;
}

/** One row of the "Zone-wise Demand & Collection" panel. */
export interface RevenueZoneStats {
  zoneId: number;
  zoneName: string;
  zoneNo: string;
  demand: number;
  collection: number;
  pending: number;
  collectionRatePercent: number;
  demandSharePercent: number;
}

/** The complete revenue dashboard in a single payload. */
export interface RevenueDashboardOverview {
  year: number;
  month: number | null;
  summary: RevenueKpiSummary;
  categoryDistribution: RevenueCategoryDistribution[];
  monthlyTrend: RevenueMonthlyTrend[];
  zoneStats: RevenueZoneStats[];
}

/** One row of the revenue records list (a lease/rent record joined to its asset). */
export interface AssetRevenueListItem {
  id: number;
  assetId: number;
  assetNo: string;
  assetName: string;
  zoneNo: string;
  zoneName: string;
  wardName: string;
  leaseType: string;
  tenantName: string;
  paymentStatus: string;
  monthlyRent: number;
}

/** Paged envelope for the revenue records list. */
export interface RevenueListResult {
  items: AssetRevenueListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/** Scope parameters for the overview endpoints. */
export interface RevenueOverviewQuery {
  year?: number;
  month?: number;
  assetCategoryId?: number;
  zoneId?: number;
  wardId?: number;
}

/** Filter / search / sort / pagination parameters for the records list. */
export interface RevenueListQuery {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  assetCategoryId?: number;
  zoneId?: number;
  wardId?: number;
  leaseType?: string;
  paymentStatus?: string;
}

/** A zone / ward option used to populate the dashboard filter dropdowns. */
export interface RevenueFilterOption {
  id: number;
  label: string;
  originalName?: string;
}

/** SSR payload for the Revenue Management Dashboard landing screen. */
export interface RevenueDashboardData {
  overview: RevenueDashboardOverview;
  zones: RevenueFilterOption[];
  wards: RevenueFilterOption[];
  selectedZoneId: number | null;
  selectedWardId: number | null;
}

/** SSR payload for the per-category revenue records screen. */
export interface RevenueRecordsData {
  categories: RevenueCategoryDistribution[];
  summary: RevenueKpiSummary;
  list: RevenueListResult;
  zones: RevenueFilterOption[];
  wards: RevenueFilterOption[];
  selectedCategoryId: number | null;
}

// ----------------------------------------------------------------------
// Component Prop Interfaces
// ----------------------------------------------------------------------

export interface ZoneWiseDemandCollectionProps {
  data: RevenueZoneStats[];
  title: string;
  totalDemandLabel: string;
  tWrapper?: (key: string, options?: Record<string, unknown>) => string;
}

export interface RevenueFiltersProps {
  zones: RevenueFilterOption[];
  wards: RevenueFilterOption[];
  selectedZoneId: number | null;
  selectedWardId: number | null;
  onZoneChange: (zoneId: number | null) => void;
  onWardChange: (wardId: number | null) => void;
  filtersLabel: string;
  allZonesLabel: string;
  allWardsLabel: string;
}

export interface SummaryCardProps {
  icon: React.ElementType;
  value: string | number;
  title: string;
  subtitle: string;
  className?: string;
}

export interface RevenueCategoryCardProps {
  item: RevenueCategoryDistribution;
  index: number;
  icon: React.ElementType;
  labels: {
    demand: string;
    collected: string;
    lease: string;
    rent: string;
    paid: string;
    unpaid: string;
  };
  onClick: () => void;
  tWrapper: (key: string, options?: Record<string, unknown>) => string;
}

export interface RevenueCategorySectionProps {
  title: string;
  emptyText: string;
  items: RevenueCategoryDistribution[];
  labels: RevenueCategoryCardProps['labels'];
  onOpenCategory: (categoryId: number) => void;
  getIcon: (valuationType: string) => React.ElementType;
  tWrapper: (key: string, options?: Record<string, unknown>) => string;
}

export interface RevenueAssetDashboardProps {
  data?: RevenueDashboardData;
  copy: RevenueDashboardPageCopy;
}

export interface RevenueAssetRecordsViewProps {
  data?: RevenueRecordsData;
  searchTerm?: string;
  copy: RevenueRecordsPageCopy;
}

export type RevenueAssetTableRow = Record<string, unknown> &
  AssetRevenueListItem & {
    srNo?: number;
  };

export interface RevenueCategorySidebarProps {
  categories: RevenueRecordsData['categories'];
  selectedCategoryId: number | null | undefined;
  totalAssets: number;
  onCategoryChange: (categoryId: number | null) => void;
  onBack: () => void;
  copy: RevenueRecordsPageCopy;
}

export interface RevenueRecordsHeaderProps {
  headerName: string;
  searchInput: string;
  setSearchInput: (value: string) => void;
  submitSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  currentZoneId: number | null;
  currentWardId: number | null;
  currentType: string;
  currentStatus: string;
  zones: RevenueRecordsData['zones'];
  wards: RevenueRecordsData['wards'];
  allValue: string;
  onSetParams: (params: Record<string, string | number | null>, options?: { resetPage?: boolean }) => void;
  copy: RevenueRecordsPageCopy;
}

export interface ChartPoint {
  month: string;
  collected: number;
  pending: number;
}

export interface MonthlyRevenueTrendProps {
  data: RevenueMonthlyTrend[];
  title: string;
  collectedLabel: string;
  pendingLabel: string;
  tWrapper?: (key: string, options?: Record<string, unknown>) => string;
}

export interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartPoint }>;
  collectedLabel: string;
  pendingLabel: string;
  tWrapper?: (key: string, options?: Record<string, unknown>) => string;
}

export interface RevenueSummaryCardProps {
  title: string;
  value: string | number;
  variant: 'default' | 'success' | 'purple' | 'warning';
}

export interface StatusBadgeProps {
  status: string;
  paidLabel: string;
  unpaidLabel: string;
}

export interface LeaseTypeBadgeProps {
  type: string;
  label?: string;
}

export interface RevenueRecordsSummaryProps {
  total: number;
  demand: number;
  collected: number;
  pending: number;
  copy: RevenueRecordsPageCopy;
}
