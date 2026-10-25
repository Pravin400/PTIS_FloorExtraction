/**
 * Rate Section Details Types
 * Types for ward assignments and rate section details (SectionItem, batch operations, etc.)
 */

import type { RateItem } from "./rateSectionMaster.types";
import type { WardItem } from "./wardMaster.types";

/* ------------------------------------------------------------------ */
/* WARD MASTER TYPES (for available wards API) */
/* ------------------------------------------------------------------ */

/**
 * Ward master item (for available wards)
 * Maps to WardItem DTO in backend
 * Note: API returns camelCase property names
 */
export interface RateSectionWardItem {
  id: string;
  name: string;
  wardNo: string;
  zoneNo?: string;
}

/**
 * Paginated response for wards
 */
export interface WardPagedResponse {
  items: RateSectionWardItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Interface for rate section detail payload used in update operations.
 * Represents the data structure for updating ward assignments to rate sections.
 */
// export interface RateSectionDetailPayload {
//   isActive: boolean;
//   updatedBy: number;
//   id: number;
//   wardId: number;
//   wardNo?: string;
//   description?: string;
// }
/* ------------------------------------------------------------------ */
/* DETAILS (WARD) TYPES */
/* ------------------------------------------------------------------ */

/**
 * Ward / Section details
 * Maps to SectionItem DTO in backend
 * Note: API returns camelCase property names
 */
export interface SectionItem {
  [key: string]: unknown;
  id?: number;
  rateSectionId?: number;
  wardId?: number;
  rateSectionNo?: string;
  wardNo?: string;
  description?: string;
  createdBy?: number;
  createdDate?: string;
  updatedBy?: number;
  updatedDate?: string;
  isActive?: boolean;
}

export interface WardCountResponse {
  totalCount: number;
}

/**
 * WardNo from Rate Section details/ SectionItem
 */
export interface RateSectionDetailsPagedResponse {
  items: SectionItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface RateSectionDetailsResponse {
  RateSectionDetailsID?: number;
  RateSectionNo?: string;
  WardNo?: string;
  CreatedBy?: number;
  CreatedDate?: string;
  UpdatedBy?: number;
  UpdatedDate?: string;
}

export interface WardTotalCountResponse {
  items: SectionItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

/* =========================
   UPDATE WARD STATUS
========================= */

export interface UpdateWardStatusPayload {
  rateSectionDetailsID: number;
  isActive: boolean;
  updatedBy?: number | string | null;
}

/* =========================
   BATCH CREATION TYPES
========================= */

/**
 * Payload for batch creating rate section details
 * POST /api/RateSectionDetails/batch
 */
export interface RateSectionDetailsBatchPayload {
  isActive: boolean;
  createdBy: number;
  rateSectionId: number;
  wardId: number;
}

/**
 * Individual result item in batch response
 */
export interface RateSectionDetailsBatchResultItem {
  rateSectionDetailsId: number;
  id: number;
  wardId: number;
  wardNo: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * Batch response items wrapper
 */
export interface RateSectionDetailsBatchItems {
  successCount: number;
  failedCount: number;
  results: RateSectionDetailsBatchResultItem[];
  errors: unknown[] | null;
  hasFailures: boolean;
  allSucceeded: boolean;
}

/**
 * Full batch API response
 */
export interface RateSectionDetailsBatchResponse {
  success: boolean;
  message: string;
  items: RateSectionDetailsBatchItems;
  errors: unknown[] | null;
}

export interface RateSectionDetailsPayload {
  id: number;
  rateSectionId: number;
  wardId: number;
  isActive?: boolean;
  createdBy?: number;

}

/**
 * Interface for rate section detail payload used in update operations.
 * Represents the data structure for updating ward assignments to rate sections.
 */
export interface RateSectionDetailPayload {
  isActive: boolean;
  updatedBy: number;
  createdBy?: number;
  rateSectionId: number;
  wardId: number;
  wardNo?: string;
  description?: string;
}

/**
 * Generic action result interface with optional typed data.
 * Used for consistent response structure across ward operations.
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

/* ------------------------------------------------------------------ */
/* COMPONENT PROPS TYPES - WARD RELATED */
/* ------------------------------------------------------------------ */

/**
 * Props for WardList component
 */
export interface WardListProps {
  rates: RateItem[];
  sections: SectionItem[];
  sectionsTotalCount?: number;
  selectedRateSection: string | null;
  selectedRateSectionLabel?: string;
  selectedWard?: string | null;
  onWardSelect?: (wardNo: string) => void;
  onWardsChanged?: () => void;
  rateSectionAlias?: string;
  wardAlias?: string;
  wardsAlias?: string;
}

/**
 * Params for getWardColumns function
 */
export interface GetWardColumnsParams {
  t: (key: string, values?: Record<string, string | number>) => string;
  wardAlias?: string;
}

/**
 * Props for LinkWard component
 */
export interface LinkWardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  rates: RateItem[];
  sections: SectionItem[];
  selectedZoneNo: string | null;
  /** SSR pre-fetched data for Available Wards tab */
  ssrAllWards: RateSectionWardItem[];
  ssrAllWardsCount: number;
  ssrWardAssignments: Record<string, { rateSectionNo: string; id: number; description: string }>;
  ssrAllRateSections: RateItem[];
  /** SSR pre-fetched wards assigned to the selected rate section */
  ssrSelectedWards: string[];
  /** SSR pre-fetched total count of selected wards from API */
  ssrSelectedWardsTotalCount?: number;
  /** SSR pre-fetched View All wards (paginated with search) */
  ssrViewAllWards?: RateSectionWardItem[];
  /** SSR pre-fetched total count of all wards for View All tab from API */
  ssrViewAllWardsTotalCount?: number;
  /** SSR pre-fetched total pages for View All tab */
  ssrViewAllWardsTotalPages?: number;
  rateSectionAlias?: string;
  wardAlias?: string;
  wardsAlias?: string;
}

/**
 * Data for editing a ward
 */
export interface EditWardData {
  rateSectionId: number;
  id: number;
  wardNo: string;
  description: string;
  isActive: boolean;
  zoneId: number;
  sequenceNo: number | null;
}

/**
 * Props for EditWard component
 */
export interface EditWardProps {
  open: boolean;
  onClose: () => void;
  id: string | null;
  wardId: string | null;
  rates: RateItem[];
  sections: SectionItem[];
  /** SSR pre-fetched ward data - if provided, avoids client-side API call */
  initialWardData?: WardItem;
  rateSectionAlias?: string;
  wardAlias?: string;
  wardsAlias?: string;
}

/* ------------------------------------------------------------------ */
/* HANDLER PARAMS TYPES */
/* ------------------------------------------------------------------ */

/**
 * Parameters for handleWardDelete function
 */
export interface HandleWardDeleteParams {
  row: SectionItem;
  rateSectionLabel: string | null;
  effectiveSelectedRateSection: string | null;
  confirm: (params: { title: string; description: string; onConfirm: () => void; variant?: "delete" | "add" | "update" | "info" | "warning" }) => void;
  setDeletedIds: (updater: (prev: Set<number>) => Set<number>) => void;
  onWardsChanged?: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  wardAlias?: string;
  rateSectionAlias?: string;
  wardsAlias?: string;
}

/**
 * Parameters for handleWardEdit function
 */
export interface HandleWardEditParams {
  row: SectionItem;
  searchParams: URLSearchParams;
  router: {
    push: (url: string) => void;
  };
}

/**
 * Errors for EditWard form
 */
export interface EditWardErrors {
  wardNo?: string;
  description?: string;
}

/* ------------------------------------------------------------------ */
/* WARD LIST COMPONENT PROPS */
/* ------------------------------------------------------------------ */

/**
 * Props for WardListHeader component
 */
export interface WardListHeaderProps {
  title: string;
  effectiveSelectedRateSection: string | null;
  rateSectionLabel: string | null;
  selectRateSectionText: string;
  totalCount: number;
  totalWardsLabel: string;
  search: string;
  searchPlaceholder: string;
  linkWardLabel: string;
  onSearch: (value: string) => void;
  onAddWard: () => void;
}

/**
 * Props for WardTable component
 */
export interface WardTableProps {
  data: SectionItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (row: SectionItem) => void;
  onDelete: (row: SectionItem) => void;
  emptyText: string;
  wardAlias?: string;
  rateSectionAlias?: string;
}

/* ------------------------------------------------------------------ */
/* LINK WARD COMPONENT PROPS */
/* ------------------------------------------------------------------ */

/**
 * Props for AvailableWards component
 */
export interface AvailableWardsProps {
  allAvailableWards: RateSectionWardItem[];
  wardAssignments: Record<string, { rateSectionNo: string; description?: string }>;
  selectedWards: string[];
  availableSearch: string;
  availablePage: number;
  availablePageSize: number;
  checkedAvailable: Set<string>;
  loading: boolean;
  onSearch: (value: string) => void;
  onToggle: (wardNo: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectAll?: (isChecked: boolean) => void;
  isSelectAllActive?: boolean;
  selectAllLoading?: boolean;
  wardAlias?: string;
  wardsAlias?: string;
}

/**
 * Props for ViewWards component
 */
export interface ViewWardsProps {
  viewAllWards: RateSectionWardItem[];
  wardAssignments: Record<string, { rateSectionNo: string; id: number; description?: string }>;
  selectedWards: string[];
  viewAllSearch: string;
  viewWardPage: number;
  viewWardPageSize: number;
  totalViewAllPages: number;
  checkedAvailable: Set<string>;
  loading: boolean;
  onSearch: (value: string) => void;
  onToggle: (wardNo: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectAll?: (isChecked: boolean) => void;
  isSelectAllActive?: boolean;
  selectAllLoading?: boolean;
  wardAlias?: string;
  wardsAlias?: string;
}

/**
 * Props for RateSectionWards component
 */
export interface RateSectionWardsProps {
  filteredSelected: string[];
  selectedSearch: string;
  selectedPage: number;
  selectedPageSize: number;
  selectedWardsTotalCount: number;
  checkedSelected: Set<string>;
  selectedZoneNo: string | undefined | null;
  selectedZoneName: string;
  onSearch: (value: string) => void;
  onToggle: (wardNo: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectAll?: (wardNos: string[]) => void;
  isSelectAllActive?: boolean;
  selectAllLoading?: boolean;
  allSelectedWards?: string[];
  rateSectionAlias?: string;
  wardAlias?: string;
  wardsAlias?: string;
}

/**
 * Props for LinkWardTabs component
 */
export interface LinkWardTabsProps {
  activeTab: string;
  totalUnassignedForHeader: number;
  totalViewAllCount: number;
  allAvailableWards: RateSectionWardItem[];
  wardAssignments: Record<string, { rateSectionNo: string; id: number; description?: string }>;
  selectedWards: string[];
  availableSearch: string;
  availablePage: number;
  availablePageSize: number;
  checkedAvailable: Set<string>;
  loading: boolean;
  viewAllWards: RateSectionWardItem[];
  viewAllSearch: string;
  viewWardPage: number;
  viewWardPageSize: number;
  totalViewAllPages: number;
  onTabChange: (tabValue: string | number) => void;
  onAvailableSearch: (value: string) => void;
  onToggleAvailable: (wardNo: string) => void;
  onAvailablePageChange: (page: number) => void;
  onAvailablePageSizeChange: (size: number) => void;
  onViewAllSearch: (value: string) => void;
  onViewWardPageChange: (page: number) => void;
  onViewWardPageSizeChange: (size: number) => void;
  isAvailableSelectAllActive?: boolean;
  isViewAllSelectAllActive?: boolean;
  availableSelectAllLoading?: boolean;
  viewAllSelectAllLoading?: boolean;
  onAvailableSelectAll?: (isChecked: boolean) => void;
  onViewAllSelectAll?: (isChecked: boolean) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  rateSectionAlias?: string;
  wardAlias?: string;
  wardsAlias?: string;
}
