export interface LockedScreen {
  id: number;
  screenCode: string;
  screenName: string;
  screenNameLocal: string;
  displayOrder: number;
  moduleId?: number;
  moduleCode?: string;
  moduleName?: string;
  moduleNameLocal?: string;
  moduleLabel?: string;
}

export interface LockUnlockPropertyItem extends Record<string, unknown> {
  propertyId: number;
  wardId: number;
  wardNo: string;
  propertyNo: string;
  partitionNo: string;
  property?: string;
  isLocked: boolean;
  lockedScreens: Array<number | LockedScreen>;
}

export const SEARCH_CATEGORY = {
  ZONE: 1,
  WARD: 2,
  BUILDING: 3,
  PROPERTY_RANGE: 4,
  EXCEL: 5,
} as const;

export type SearchCategoryType = (typeof SEARCH_CATEGORY)[keyof typeof SEARCH_CATEGORY];

export interface LockUnlockPropertiesResponse {
  items: LockUnlockPropertyItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  duplicateCount?: number;
  /** @deprecated Use duplicateCount instead */
  dublicateCount?: number;
  fileSessionId?: string;
}

export interface PaginationState {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface LockUnlockPropertiesQueryParams {
  ZoneId?: number;
  WardId?: number;
  FromPropertyNo?: string;
  ToPropertyNo?: string;
  PropertyFrom?: string;
  PropertyTo?: string;
  SearchCategory?: number;
  PartitionNo?: string;
  PropertyNo?: string;
  Search?: string;
  SearchPartitionNo?: string;
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  SortBy?: string;
  SortOrder?: string;
  FilterLogic?: number;
}

export interface BulkLockUnlockFilters {
  wardId: number;
  fromProperty?: string;
  toProperty?: string;
  partitionNo?: string;
  search?: string;
}

export interface BulkLockUnlockPayload {
  propertyIds?: number[];
  screenIds: number[];
  action: "lock" | "unlock";
  selectAll?: boolean;
  excludedPropertyIds?: number[];
  filters?: BulkLockUnlockFilters;
}

export interface ModuleItem {
  id: number;
  departmentId: number;
  moduleCode: string;
  moduleName: string;
  moduleNameLocal: string;
  moduleIcon: string;
  moduleLabel: string;
  moduleDescription: string;
  departmentName: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface ModuleMasterResponse {
  items: ModuleItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ExcelUploadRow {
  zoneNo: string;
  wardNo: string;
  propertyNo: string;
  partitionNo?: string;
}

export interface ExcelSearchRequest {
  rows: ExcelUploadRow[];
  pageNumber: number;
  pageSize: number;
  search?: string;
}

export const MAX_EXCEL_ROWS = 100_000;

