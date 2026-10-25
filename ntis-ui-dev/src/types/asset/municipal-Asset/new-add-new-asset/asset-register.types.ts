import type { AssetRegisterRow } from "@/types/asset/asset-register/municipal-asset-register.types";
import type {
  AssetRegisterApiRecord,
  AssetRegisterPageResult,
} from "@/types/asset/asset-register/municipal-asset-service.types";

export interface AssetRegisterOption {
  id: number;
  label: string;
}

export interface AssetRegisterWardOption extends AssetRegisterOption {
  zoneId: number | null;
}

/**
 * Dashboard statistics types
 */
export interface AssetTypeStatsDto {
  assetTypeId: number;
  assetTypeName: string;
  assetCount: number;
}

export interface AssetCategoryStatsDto {
  categoryId: number;
  categoryName: string;
  categoryDescription?: string;
  registeredAssets: number;
  totalCategoryItem: number;
  totalValue?: number | null;
  assetTypeStats: AssetTypeStatsDto[];
}

export interface AssetDashboardStatsDto {
  totalAssets: number;
  totalCategories: number;
  categoryStats: AssetCategoryStatsDto[];
}

/**
 * Paginated response from /AssetMaster
 */
export interface PagedAssetMasterResponse {
  items: AssetRegisterApiRecord[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
  totalPurchaseValue?: number;
  totalMarketValue?: number;
  totalDepreciation?: number;
  netBookValue?: number;
  totalCapitalValue?: number;
  activeAssetsCount?: number;
}

/**
 * Component Props for Asset Register UI
 */
export interface AssetRegisterViewProps {
  locale: string;
  categoryId: number;
  categoryName: string | null;
  safeSearch: string;
  safeAssetTypeId: string;
  safeZoneId: string;
  finalWardId: string;
  safeOwningDepartmentId: string;
  safePageSize: number;
  finalPage: number;
  totalPages: number;
  assetsResult: AssetRegisterPageResult;
  typesResult: AssetRegisterOption[];
  zonesResult: AssetRegisterOption[];
  wardsResult: AssetRegisterWardOption[];
  departmentsResult: AssetRegisterOption[];
  updatedDate: string;
}

export interface AssetRegisterTableProps {
  assets: AssetRegisterRow[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface AssetRegisterFiltersProps {
  search: string;
  assetTypeId: string;
  zoneId: string;
  wardId: string;
  owningDepartmentId: string;
  assetTypeOptions: { label: string; value: string }[];
  zoneOptions: { label: string; value: string }[];
  wardOptions: { label: string; value: string }[];
  owningDepartmentOptions: { label: string; value: string }[];
}

export interface AssetRegisterExportButtonProps {
  categoryId: number;
  categoryName: string;
  search: string;
  assetTypeId: string;
  zoneId: string;
  wardId: string;
  totalCount: number;
  pageSize: number;
  assets: AssetRegisterApiRecord[];
}

export interface AssetRegisterHeaderSummaryProps {
  registerSubtitle: string;
  updatedDate: string;
  totalCount: number;
  totalPurchaseValue: number;
  totalMarketValue: number;
  totalDepreciation: number;
  netBookValue: number;
  totalCapitalValue: number;
  activeAssetsCount: number;
  translate: (key: string) => string;
}

export interface AssetRegisterControlsProps {
  categoryId: number;
  categoryName: string;
  search: string;
  assetTypeId: string;
  zoneId: string;
  wardId: string;
  owningDepartmentId: string;
  totalCount: number;
  pageSize: number;
  assets: AssetRegisterApiRecord[];
  assetTypeOptions: { label: string; value: string }[];
  zoneOptions: { label: string; value: string }[];
  wardOptions: { label: string; value: string }[];
  owningDepartmentOptions: { label: string; value: string }[];
}

