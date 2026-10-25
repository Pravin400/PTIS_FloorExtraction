/**
 * Types for the AssetDashboard API endpoints:
 *  GET /AssetDashboard/summary
 *  GET /AssetDashboard/category-counts
 *  GET /AssetDashboard/types-by-category?categoryId=<n>
 *  GET /AssetDashboard/assets-by-type?assetTypeId=<n>
 */

/** A single card in the assetValueCardDetails or assetCountCardDetails arrays */
export interface AssetDashboardValueCard {
  title: string;
  subtitle: string;
  value: string;
  secondaryValue: string | null;
  hint: string | null;
}

export interface AssetDashboardCountCard {
  id: number;
  category: string;
  count: number;
  totalValue: number | null;
}

export interface AssetTypeStatsDto {
  assetTypeId: number;
  assetTypeName: string;
  assetCount: number;
}

export interface AssetCategoryStatsDto {
  categoryId: number;
  categoryName: string;
  categoryDescription?: string | null;
  registeredAssets: number;
  totalCategoryItem: number;
  totalValue?: number | null;
  totalValueUnit?: string | null;
  assetTypeStats: AssetTypeStatsDto[];
}

/** Full response shape from GET /AssetDashboard/summary */
export interface AssetDashboardSummaryDto {
  totalAssets: number;
  totalValue: number;
  encroachments: number;
  maintenanceDue: number;
  activeAuctions: number;
  assetAcquisition: number;
  percentageChange: number;
  valueChange: number;
  encroachmentChange: number;
  maintenanceChange: number;
  auctionChange: number;
  acquisitionChange: number;
  monetizedAssetsCount: number;
  activeLeasedAssetsCount: number;
  activeRentedAssetsCount: number;
  assetValueCardDetails: AssetDashboardValueCard[];
  assetCountCardDetails: AssetDashboardCountCard[];
  categoryStats?: AssetCategoryStatsDto[];
}

/** One entry from GET /AssetDashboard/category-counts */
export interface AssetDashboardCategoryCount {
  id: number;
  category: string;
  count: number;
  totalValue: number;
  isActive?: boolean;
}

/** One entry from GET /AssetDashboard/types-by-category?categoryId=<n> */
export interface AssetDashboardTypeByCategory {
  id: number;
  assetType: string;
  count: number;
  totalValue: number;
  categoryId: number;
  isActive?: boolean;
}

/** One entry from GET /AssetDashboard/assets-by-type?assetTypeId=<n> */
export interface AssetDashboardAssetByType {
  id: number;
  name: string;
  code: string;
  status: string;
  marketValue: number | null;
  latitude: number | null;
  longitude: number | null;
  wardName: string;
  zoneName: string;
  __typeId?: number;
  capitalValue?: number | null;
  zone?: string;
  ward?: string;
  location?: string;
}

/** One entry from GET /AssetDashboard/locations */
export interface AssetDashboardLocation {
  id: number;
  name: string;
  categoryName: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  assetNo: string;
  marketValue: number | null;
  capitalValue?: number | null;
}

export interface AssetDashboardDataResponseDto {
  summary: AssetDashboardSummaryDto;
  types: AssetDashboardTypeByCategory[];
  locations: AssetDashboardLocation[];
}
