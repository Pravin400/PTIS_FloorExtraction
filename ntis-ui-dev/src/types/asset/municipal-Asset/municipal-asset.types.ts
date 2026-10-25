import type { LucideIcon } from 'lucide-react';

// ─── API Boundary Types ──────────────────────────────────────────────────────
// These represent the raw shapes coming from the backend API. The index
// signature is kept intentionally to handle extra/unexpected fields without
// breaking the app, but application-level types should add explicit fields
// instead of relying on it.

export interface ApiCategoryItem {
  id: number;
  /** Backend inconsistently returns boolean OR numeric 0/1 */
  isActive?: boolean | number;
  /** PascalCase variant returned by some endpoints */
  IsActive?: boolean | number;
  status?: string;
  [key: string]: unknown;
}

export interface ApiTypeItem {
  id: number;
  /** Backend inconsistently returns boolean OR numeric 0/1 */
  isActive?: boolean | number;
  /** PascalCase variant returned by some endpoints */
  IsActive?: boolean | number;
  status?: string;
  [key: string]: unknown;
}

// ─── Application-Level Types ─────────────────────────────────────────────────

export interface AssetCategory extends ApiCategoryItem {
  categoryName?: string;
  categoryCode?: string;
  categoryDescription?: string;
  isMovable?: boolean;
  hasFloorDetails?: boolean;
  hasInventory?: boolean;
  isInventoryMandatory?: boolean;
  hasLegalCompliance?: boolean;
  valuationType?: string;
}

export interface AssetType extends ApiTypeItem {
  id: number;
  assetTypeName?: string;
  typeName?: string;
  /** Third name variant returned by some legacy endpoints */
  name?: string;
  /** Category relationship — may be returned as either field name */
  categoryId?: number;
  assetCategoryId?: number;
}

export interface AssetMaster {
  id: number;
  assetName?: string;
  assetCode?: string;
  zoneId?: number;
  wardId?: number;
  [key: string]: unknown;
}

export interface PaginatedApiResponse<T = AssetMaster> {
  items?: T[];
  data?: T[];
  totalCount?: number;
}

export interface SubUnitItem {
  [key: string]: unknown;
}

export interface SubUnitsApiResponse {
  success?: boolean;
  items?: SubUnitItem[];
  message?: string;
}

export interface Ward {
  id: number;
  wardName?: string;
  [key: string]: unknown;
}

export interface Zone {
  id: number;
  zoneName?: string;
  [key: string]: unknown;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export type DashboardAssetTypeStat = {
  assetTypeId: number;
  assetTypeName: string;
  assetCount: number;
  /** Active-status fields needed for filtering */
  isActive?: boolean | number;
  IsActive?: boolean | number;
  status?: string;
};

export type DashboardCategoryStat = {
  categoryId: number;
  categoryName: string;
  categoryDescription?: string;
  registeredAssets?: number;
  totalCategoryItem?: number;
  totalValue?: number | null;
  assetTypeStats?: DashboardAssetTypeStat[];
};

export type DashboardStatsResponse = {
  totalAssets: number;
  totalCategories: number;
  categoryStats: DashboardCategoryStat[];
};

// ─── Asset Details Drawer Types ──────────────────────────────────────────────

export interface AssetTypeAssetItemDto extends Record<string, unknown> {
  id: number;
  assetName: string;
  capitalValue: number;
}

export interface AssetTypeDetailsResponse {
  totalCount: number;
  totalValuation: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  items: AssetTypeAssetItemDto[];
}

export interface AssetTypeCategoryStatsDto {
  assetTypeId: number;
  assetTypeName: string;
  assetCount: number;
  totalCapitalValue: number;
  totalLandAreaSqMeter?: number;
  totalInventoryQuantity?: number;
  [key: string]: unknown;
}

export interface AssetCategoryTypeStatsResponseDto {
  assetCategoryId: number;
  types: AssetTypeCategoryStatsDto[];
  [key: string]: unknown;
}

// ─── Component Props ─────────────────────────────────────────────────────────

export type MunicipalAssetDashboardProps = {
  initialStats?: DashboardStatsResponse | null;
  masterCategories?: AssetCategory[];
  masterTypes?: AssetType[];
  selectedAssetType?: AssetType | null;
  selectedCategory?: AssetCategory | null;
  initialDrawerData?: AssetTypeDetailsResponse | null;
  initialCategoryDrawerData?: AssetCategoryTypeStatsResponseDto | null;
  activeDrawerPage?: number;
};

/**
 * Theme configuration for an asset category card.
 * All fields are Tailwind CSS utility class strings.
 */
export interface AssetTheme {
  /** Dark overlay gradient shown on card hover */
  hero: string;
  /** Light background gradient always visible in the hero banner */
  heroBgLight: string;
  heroBorder: string;
  iconRing: string;
  statBg: string;
  statBorder: string;
  statText: string;
  statLabel: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
  chipHover: string;
  dot: string;
  accentBar: string;
}

/**
 * Visual metadata derived from a category name string.
 * Used to select the icon, description and theme for a category card.
 */
export interface CategoryMeta {
  id: string;
  icon: LucideIcon;
  description: string;
}

export interface AssetCategoryCardProps {
  category: AssetCategory;
  assetCount: number;
  totalValue?: number | null;
  meta: CategoryMeta;
  theme: AssetTheme;
  catTypes: AssetType[];
  visibleCount: number;
  /** Card index for staggered entrance animation */
  index?: number;
  onVisibleCountChange: (count: number) => void;
  onSelectCategory: () => void;
  onSelectType?: (type: AssetType) => void;
  onSelectCategoryAssetTypes?: (category: AssetCategory) => void;
}

export interface AssetTypeDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assetType?: AssetType | null;
  category?: AssetCategory | null;
  categoryDetailsData?: AssetCategoryTypeStatsResponseDto | null;
  data?: AssetTypeDetailsResponse | null;
  loading?: boolean;
  pageNumber?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}
