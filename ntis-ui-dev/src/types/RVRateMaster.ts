/**
 * Props for Rate Master Form component (extended)
 */
export interface RateMasterFormProps extends RateFormProps {
  assessmentYearRanges: Array<{
    label: string;
    value: string;
    fromYear: string | number;
    toYear: string | number;
  }>;
}
// Assessment year option with extra fields for dropdowns
export interface AssessmentYearRangeOption extends ISelectOption {
  fromYear: string | number;
  toYear: string | number;
}

export interface ITypeOfUseDetails {
  id: number;
  description?: string;
  typeOfUseCode?: string;
  typeOfUseGroupId?: number;
  typeOfUseCategoryId?: number;
  typeOfUseCategoryName?: string;
  typeOfUseCategoryCode?: string;
  typeOfUseGroupCode?: string;
  groupName?: string;
}

/**
 * Rate categories shown in Rate Master grid
 * Now dynamic based on backend construction types
 */
export type RateCategory = {
  constructionId: string; // constructionTypeId as string
  constructionCode?: string; // constructionCode for display in table headers
  description?: string; // Full description for tooltips
  typeOfUseGroupId?: number; // Optional group ID for open plot mode
  typeOfUseGroupCode?: string;
  groupName?: string;
  associatedUseTypes?: { code: string; description: string }[]; // Associated types of use for open plot
};

/**
 * Single rate value for a construction category
 */
export interface IRateValue {
  rateCategory: string; // constructionId
  ratePerSqMtr: number | null;
  ratePerSqFt?: number | null; // Rate per square feet for SqFeet display
  id?: number | string; // Backend record id for update
  rateRemark?: string; // Optional, for edit mode compatibility
}

/**
 * Main Rate Master row (Zone-wise)
 */
export interface IRateMaster {
  id?: string;
  rateSection: string;
  zoneNo: string;
  assessmentYear: string;
  useGroup: string;
  // Optional aliases for backward compatibility or backend inconsistencies
  year?: string;
  zoneSection?: string;
  rates: IRateValue[];
}


/**
 * Filters used on Rate Master screen
 */
export interface IRateMasterFilter {
  zoneSectionId?: number;
  assessmentYearId?: number;
  useGroupId?: number;
}

/**
 * API request payload (future use)
 */
export interface IRateMasterRequest {
  filter: IRateMasterFilter;
}

/**
 * API response structure (future use)
 */
export interface IRateMasterResponse {
  data: IRateMaster[];
  totalCount?: number;
}


export type RateMasterFilterProps = {
  zones: { id: number; name: string }[];
  years: string[];
  useGroups: { id: number; name: string }[];
  selectedZone: string;
  selectedYear: string;
  selectedUseGroup: string;
  onZoneChange: (zone: string) => void;
  onYearChange: (year: string) => void;
  onUseGroupChange: (useGroup: string) => void;
};


export interface ISelectOption {
  label: string;
  value: string;
}

/**
 * Matrix column configuration for rate grid display
 */
export interface MatrixColumn {
  id: string;
  label: React.ReactNode;
  tooltip?: string;
  headerClassName?: string;
}

export interface IZoneOption {
  id: number;
  name: string;
}

export interface IUseGroupOption {
  id: number;
  name: string;
}

/**
 * Zone description mapping
 */
export interface IZoneDescription {
  taxZoneId: number;
  zoneNo: string;
  description: string;
}

/**
 * Backend API Response Types
 */
export interface IBackendRateMaster {
  id: number;
  year: number;
  floorId: number;
  constructionTypeId: number;
  typeOfUseGroupId: number;
  rateSectionId: number;
  taxZoneId: number;
  yearRangeRVId: number; 
  yearRangeId?: number; 
  taxZoneNo?: string; 
  floorID?: string; 
  constructionID?: string; 
  typeOfUseGroupID?: string; 
  rateSectionNo?: string; 
  rateSquareMeter: number;
  rateSquareFeet: number;
  rateRemark: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
  createdBy?: number;
  updatedBy?: number | null;
}

export interface IBackendConstructionType {
  constructionTypeId: number;
  id?: number; // Optional for backward compatibility
  constructionId?: string; // Optional for backward compatibility
  constructionCode: string;
  description: string;
  groupID?: string;
  searchKey?: string | null;
  searchSequence?: number | null;
  keyboardShortCutKey?: string;
  keyWiseSequece?: number;
  keyWiseSequence?: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}


/**
 * Props for Rate Master page component
 */
export interface RateMasterPageProps {
  zones: ISelectOption[];
  useGroups: ISelectOption[];
  assessmentYears: ISelectOption[];
  rateMasterData: IRateMaster[];
}

/**
 * Props for Rate form component (add/edit)
 */
export interface RateFormProps {
  id?: string | null;
  zoneOptions: ISelectOption[];
  useGroupOptions: ISelectOption[];
  assessmentYears: ISelectOption[];
  zoneDescriptions: IZoneDescription[];
  allZones: IZoneDescription[]; // All zones (non-paginated) for building complete matrix
  rateCategories: RateCategory[];
  editData?: IRateMaster | null;
  bulkEditData?: IRateMaster[] | null;
  backendRates?: IBackendRateMaster[] | null;
  filterValues?: {
    zone?: string;
    year?: string;
    useGroup?: string;
  };
  showCopyRateSection?: boolean;
  showMultipliersSection?: boolean;
  hideMatrixSection?: boolean;
  sourceUseGroup?: string;
  fetchedRates?: IBackendRateMaster[] | null;
  year?: string;
  onClose?: (isSuccessfulSave?: boolean) => void;
  mode?: "edit" | "delete" | "add";
  // Server-side paginated zone data
  paginatedZonesData?: {
    items: IZoneDescription[];
    totalPages: number;
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
  // Server-side check for existing rates (add mode validation)
  initialExistingRatesCheck?: boolean;
  // Policy-configured rate frequency (from PolicyConfiguration table)
  rateFrequencyPolicy?: {
    value: 'Monthly' | 'Yearly';
    isConfigured: boolean;
  };
  // Policy-configured rate unit (from PolicyConfiguration table)
  rateUnitPolicy?: {
    value: 'SqMeter' | 'SqFeet';
    isConfigured: boolean;
  };
  isOpenPlot?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface RateMasterClientProps {
  rateMasterData: IRateMaster[];
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  totalCount?: number;
  zones: ISelectOption[];
  useGroups: ISelectOption[];
  assessmentYears: ISelectOption[];
  rateCategories: (string | RateCategory)[];
  zoneDescriptions?: { taxZoneId: number; zoneNo: string; description: string }[];
  initialZone?: string;
  initialUseGroup?: string;
  initialYear?: string;
  rateUnitPolicy?: { value: 'SqMeter' | 'SqFeet'; isConfigured: boolean };
  rateFrequencyPolicy?: { value: 'Monthly' | 'Yearly'; isConfigured: boolean };
  globalFrequencyMismatch?: { configuredFrequency: string, existingFrequency: string } | null;
  isOpenPlot?: boolean;
}
/**
 * Props for Add Rate drawer component
 */
export interface AddRateDrawerProps {
  zones: ISelectOption[];
  useGroups: ISelectOption[];
  assessmentYears: ISelectOption[];
  assessmentYearRanges?: { label: string; value: string; fromYear: string; toYear: string }[];
  zoneDescriptions: IZoneDescription[]; // Paginated zones for matrix display
  allZones?: IZoneDescription[]; // All zones (unpaginated) for copy rates functionality
  rateCategories: { constructionId: string; description?: string }[];
  filterValues?: {
    zone?: string;
    useGroup?: string;
    year?: string;
    fromYear?: string;
    toYear?: string;
  };
  showCopyRateSection?: boolean;
  // Server-side paginated zone data
  paginatedZonesData?: {
    items: IZoneDescription[];
    totalPages: number;
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
  // Server-side check for existing rates (add mode validation)
  initialExistingRatesCheck?: boolean;
  // Policy-configured rate frequency (from PolicyConfiguration table)
  rateFrequencyPolicy?: {
    value: 'Monthly' | 'Yearly';
    isConfigured: boolean;
  };
  // Policy-configured rate unit (from PolicyConfiguration table)
  rateUnitPolicy?: {
    value: 'SqMeter' | 'SqFeet';
    isConfigured: boolean;
  };
  isOpenPlot?: boolean;
}

/**
 * Props for Edit Rate drawer component
 */
export interface EditRateDrawerProps {
  id: string;
  zones: ISelectOption[];
  useGroups: ISelectOption[];
  assessmentYears: ISelectOption[];
  assessmentYearRanges?: { label: string; value: string; fromYear: string; toYear: string }[];
  zoneDescriptions: IZoneDescription[];
  allZones: IZoneDescription[]; // All zones (non-paginated) for building complete matrix
  rateCategories: { constructionId: string; description?: string }[];
  editData?: IRateMaster | null;
  bulkEditData?: IRateMaster[] | null;
  backendRates?: IBackendRateMaster[] | null;
  filterValues?: {
    zone?: string;
    year?: string;
    useGroup?: string;
  };
  mode?: "edit" | "delete";
  // Server-side paginated zone data
  paginatedZonesData?: {
    items: IZoneDescription[];
    totalPages: number;
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
  // Policy-configured rate frequency (from PolicyConfiguration table)
  rateFrequencyPolicy?: {
    value: 'Monthly' | 'Yearly';
    isConfigured: boolean;
  };
  // Policy-configured rate unit (from PolicyConfiguration table)
  rateUnitPolicy?: {
    value: 'SqMeter' | 'SqFeet';
    isConfigured: boolean;
  };
  isOpenPlot?: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Single rate entry for bulk create payload
 */
export interface IRateCreate {
  isActive: boolean;
  createdBy: number;
  taxZoneId: number;
  floorId: number;
  constructionTypeId: number;
  typeOfUseGroupId: number;
  yearRangeRVId: number;
  rateSquareMeter: number;
  rateSquareFeet: number;
  rateSectionId: number;
  rateRemark?: string;
}

/**
 * Bulk create rates payload for POST /Rate/bulk
 */
export interface IBulkRateCreate {
  items: IRateCreate[];
}

/**
 * Single rate entry for bulk update payload
 */
export interface IRateUpdate {
  // Removed rateId, use Id
  isActive: boolean;
  updatedBy: number;
  taxZoneId: number;
  floorId: number;
  constructionTypeId: number;
  typeOfUseGroupId: number;
  yearRangeRVId: number;
  rateSquareMeter: number;
  rateSquareFeet: number;
  rateSectionId: number;
  rateRemark?: string;
}

/**
 * Bulk update rates payload for PUT /Rate/bulk
 */
export interface IBulkRateUpdate {
  rates: IRateUpdate[];
}

/**
 * Bulk delete rates payload for DELETE /Rate/bulk
 */
export interface IBulkRateDelete {
  Ids: number[];
}

export type RatePayload = {
  Id?: number;
  taxZoneId: number;
  floorId: number;
  constructionTypeId: number;
  typeOfUseGroupId: number;
  YearRangeRVId: number; // PascalCase for backend API (C#/.NET convention)
  rateSectionId: number;
  rateSquareMeter: number;
  rateSquareFeet: number;
  rateRemark: string;
  createdBy: number;
  isActive: boolean;
};
