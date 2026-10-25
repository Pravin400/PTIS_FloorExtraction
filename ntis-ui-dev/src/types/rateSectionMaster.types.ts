/**
 * Rate Section Master Types
 * Aligned with ASP.NET Core DTOs
 * Source: RateSectionCatalogResponse
 */

// Re-export all types from rateSectionDetails.types.ts for backward compatibility
export type {
  RateSectionWardItem,
  WardPagedResponse,
  SectionItem,
  WardCountResponse,
  RateSectionDetailsPagedResponse,
  RateSectionDetailsResponse,
  WardTotalCountResponse,
  UpdateWardStatusPayload,
  RateSectionDetailsBatchPayload,
  RateSectionDetailsBatchResultItem,
  RateSectionDetailsBatchItems,
  RateSectionDetailsBatchResponse,
  RateSectionDetailsPayload,
  RateSectionDetailPayload,
  ActionResult,
  WardListProps,
  GetWardColumnsParams,
  LinkWardProps,
  EditWardData,
  EditWardProps,
  HandleWardDeleteParams,
  HandleWardEditParams,
  EditWardErrors,
  WardListHeaderProps,
  WardTableProps,
  AvailableWardsProps,
  ViewWardsProps,
  RateSectionWardsProps,
  LinkWardTabsProps,
} from "./rateSectionDetails.types";

import type { SectionItem } from "./rateSectionDetails.types";

/* ------------------------------------------------------------------ */
/* MASTER (RATE SECTION) TYPES */
/* ------------------------------------------------------------------ */

/**
 * Rate Section (Node Section) master item
 * Maps to RateItem DTO in backend
 * Note: API returns camelCase property names
 */
export interface RateItem {
  id?: number;
  guid?: string;
  sectionDetails?: SectionItem[];
  rateSectionNo?: string;
  descriptionEnglish?: string;
  description?: string;
  createdBy?: number;
  createdDate?: string;
  updatedBy?: number;
  updatedDate?: string;
  isActive?: boolean;
}

export interface RateSectionCountResponse {
  totalCount: number;
}

/* ------------------------------------------------------------------ */
/* CATALOG RESPONSE */
/* ------------------------------------------------------------------ */

/**
 * Paginated response returned by backend API
 * GET /api/RateSection
 */
export interface RateSectionPaginatedResponse {
  items: RateItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Combined response for compatibility
 * Maps paginated response to legacy structure
 */
export interface RateSectionCatalogResponse {
  rateSectionMaster: RateItem[];
  rateSectionDetails: SectionItem[];
  // Pagination info
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

/**
 * Form state for Rate Section
 * Used in Add/Edit forms
 */
export interface RateSectionFormState {
  zoneCode: string;
  zoneEnglish: string;
  zoneRegional: string;
  description?: string;
  wards: string[];
  // status: boolean;
  isActive?: boolean;
  createdBy?: number;
  updatedBy?: number;
}

/* ------------------------------------------------------------------ */
/* API ACTION RESPONSE (FUTURE USE) */
/* ------------------------------------------------------------------ */

/**
 * Generic API action response
 * (keep for future Add/Edit APIs)
 */
export interface ActionResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

export interface RateSectionQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  rateSectionNo?: string;
  description?: string;
}

/* ------------------------------------------------------------------ */
/* COMPONENT PROPS TYPES - RATE SECTION RELATED */
/* ------------------------------------------------------------------ */

/**
 * Props for RateSectionMaster component
 */
// export interface RateSectionMasterProps {
//   initialZones: RateItem[];
//   initialSections: SectionItem[];
//   initialSectionsTotalCount?: number;
//   totalRateSectionCount: number;
//   totalWardsCount: number;
//   initialWardCounts?: Record<string, number>;
//   selectedRateSectionId?: string;
//   selectedRateSectionLabel?: string;
//   /** SSR pre-fetched ward data for EditWard */
//   initialEditWardData?: import("./wardMaster.types").WardItem;
//   /** SSR pre-fetched ALL wards for Link Ward drawer */
//   ssrAllWards?: { id: string; wardNo: string; name: string }[];
//   ssrAllWardsCount?: number;
//   /** SSR pre-fetched ward assignments map (wardNo -> rate section info) */
//   ssrWardAssignments?: Record<string, { rateSectionNo: string; id: number; description: string }>;
//   /** SSR pre-fetched ALL rate sections for labels */
//   ssrAllRateSections?: RateItem[];
//   /** SSR pre-fetched wards assigned to the selected rate section */
//   ssrSelectedWards?: string[];
//   /** SSR pre-fetched total count of selected wards */
//   ssrSelectedWardsTotalCount?: number;
//   /** SSR pre-fetched View All wards (paginated with search) */
//   ssrViewAllWards?: { id: string; wardNo: string; name: string }[];
//   /** SSR pre-fetched total count of all wards for View All tab */
//   ssrViewAllWardsTotalCount?: number;
//   /** SSR pre-fetched total pages for View All tab */
//   ssrViewAllWardsTotalPages?: number;
// }

/**
 * Props for RateSectionContent component
 */
export interface RateSectionContentProps {
  rates: RateItem[];
  sections: SectionItem[];
  sectionsTotalCount?: number;
  totalRateSectionCount: number;
  filteredRateSectionCount?: number;
  totalWardsCount: number;
  selectedRateSectionId?: string;
  initialWardCounts?: Record<string, number>;
  initialSelectedRateSection?: string;
  initialSelectedRateSectionLabel?: string;
  /** SSR pre-fetched ward data for EditWard */
  initialEditWardData?: import("./wardMaster.types").WardItem;
  /** SSR pre-fetched ALL wards for Link Ward drawer */
  ssrAllWards?: { id: string; wardNo: string; name: string }[];
  ssrAllWardsCount?: number;
  /** SSR pre-fetched ward assignments map (wardNo -> rate section info) */
  ssrWardAssignments?: Record<string, { rateSectionNo: string; id: number; description: string }>;
  /** SSR pre-fetched ALL rate sections for labels */
  ssrAllRateSections?: RateItem[];
  /** SSR pre-fetched wards assigned to the selected rate section */
  ssrSelectedWards?: string[];
  /** SSR pre-fetched total count of selected wards */
  ssrSelectedWardsTotalCount?: number;
  /** SSR pre-fetched View All wards (paginated with search) */
  ssrViewAllWards?: { id: string; wardNo: string; name: string }[];
  /** SSR pre-fetched total count of all wards for View All tab */
  ssrViewAllWardsTotalCount?: number;
  /** SSR pre-fetched total pages for View All tab */
  ssrViewAllWardsTotalPages?: number;
}

/**
 * Props for RateSectionList component
 */
export interface RateSectionListProps {
  rates: RateItem[];
  selectedRateSection: string | null;
  newlyCreatedRateNo?: string | null;
  onEdit?: (id: string) => void;
  initialWardCounts?: Record<string, number>;
  totalCount?: number;
  onDeleteSuccess?: () => void;
  rateSectionAlias?: string;
  wardAlias?: string;
  wardsAlias?: string;
}

/**
 * Form errors for RateSectionForm
 */
export interface RateSectionFormErrors {
  zoneRegional?: string;
  description?: string;
}

/**
 * Add mode props for RateSectionForm
 */
export interface RateSectionFormAddModeProps {
  mode: "add";
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (newRateSectionNo: string) => void;
  existingRates?: RateItem[];
  initialData?: undefined;
  zoneId?: undefined;
  rates?: undefined;
  onUpdate?: undefined;
}

/**
 * Edit mode props for RateSectionForm
 */
export interface RateSectionFormEditModeProps {
  mode: "edit";
  open?: boolean;
  zoneId: string;
  rates?: RateItem[];
  initialData?: RateItem;
  onClose?: () => void;
  onUpdate?: (updatedRate: RateItem) => void;
  existingRates?: undefined;
  onSuccess?: undefined;
}

/**
 * Combined props for RateSectionForm
 */
export type RateSectionFormProps = RateSectionFormAddModeProps | RateSectionFormEditModeProps;

/* ------------------------------------------------------------------ */
/* RATE SECTION COMPONENT HANDLER/HOOK PROPS */
/* ------------------------------------------------------------------ */

/**
 * Props for RateSectionCard component
 */
export interface RateSectionCardProps {
  rate: RateItem;
  index: number;
  serialNo: number;
  isSelected: boolean;
  isNewlyCreated: boolean;
  onDelete: (rateId: string, rateName: string) => void;
  deletingId: string | null;
  searchParams: URLSearchParams;
  pathname: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  rateSectionAlias?: string;
}

/**
 * Props for AddRateSection hook
 */
export interface AddRateSectionHookProps {
  onClose?: () => void;
  onSuccess?: (rateSectionNo: string) => void;
  existingRates: RateItem[];
}

/**
 * Props for EditRateSection hook
 */
export interface EditRateSectionHookProps {
  onClose?: () => void;
  onUpdate?: (updatedRate: RateItem) => void;
  zoneId: string;
  initialData?: RateItem;
  rates: RateItem[];
}

/**
 * Props for EditRateSectionContent component
 */
export interface EditRateSectionContentProps {
  form: RateSectionFormState;
  handleToggleStatus: () => void;
}

/**
 * Props for RateSectionListHeader component
 */
export interface RateSectionListHeaderProps {
  title: string;
  searchPlaceholder: string;
  addButtonLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

/**
 * Parameters for handleRateSectionDelete function
 */
export interface HandleRateSectionDeleteParams {
  rateId: string;
  rateName: string;
  wardCounts: Record<string, number>;
  searchParams: URLSearchParams;
  pathname: string;
  rates: Array<{ id?: number }>;
  router: {
    push: (url: string) => void;
    refresh: () => void;
  };
  onDeleteSuccess?: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  setDeletingId: (id: string | null) => void;
  rateSectionAlias?: string;
  wardsAlias?: string;
}