/**
 * Interface representing the basic old property details returned from the API.
 */
export interface PropertyOldDetailsApiItem {
  /** Unique identifier for the property */
  propertyId: number;
  /** Historical ward number */
  oldWardNo: string | null;
  /** Historical property number */
  oldPropertyNo: string | null;
  /** Historical partition number */
  oldPartitionNo: string | null;
  /** Historical e-governance ID */
  oldEgovNo: string | null;
  /** Historical plot area in square feet */
  oldPlotArea: number | null;
  /** Historical plot number */
  oldPlotNo: string | null;
  /** Historical Rateable Value (RV) */
  oldRV: number | null;
  /** Historical Annual Letting Value (ALV) */
  oldALV: number | null;
  /** Total historical tax amount */
  oldTotalTax: number | null;
  /** Historical zone number or name */
  oldZoneNo: string | null;
  /** The historical general tax amount */
  oldGeneralTax: number | null;
  /** Historical CSN (Customer Service Number) */
  oldCSN: string | null;
  /** Historical construction area */
  oldConstructionArea: number | null;
  /** Year of construction (as string from API) */
  oldConstructionYear: string | null;
  /** Carpet area in square feet */
  oldCarpetAreaSqFeet: number | null;
  /** Carpet area in square meters */
  oldCarpetAreaSqMeter: number | null;
  /** ID for construction type master */
  oldConstructionTypeId: number | null;
  /** ID for type of use master */
  oldTypeOfUseId: number | null;
}

/**
 * Standard API response wrapper for property old details.
 */
export interface PropertyOldDetailsResponse {
  /** Indicates if the request was successful */
  success: boolean;
  /** User-friendly message from the server */
  message: string;
  /** The actual property data */
  items: PropertyOldDetailsApiItem | null;
  /** Any validation or server errors */
  errors: unknown | null;
}

/* ---------------- TYPES ---------------- */
export interface TypeOfUse {
  id: number;
  typeOfUseCode: string;
  description: string;
  type: string;
  typeOfUseGroupId: number;
  isActive: boolean;
}

export interface SubTypeOfUse {
  id: number;
  description: string;
  typeOfUseId: number;
  isActive: boolean;
}

export interface ConstructionType {
  [key: string]: unknown;
  id: number; // Standardized to match API and select option usage
  constructionCode: string;
  description: string;
  searchSequence: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/* =====================================================
   SUBFLOOR - ENTITY MODEL
===================================================== */
export interface SubFloor {
  [key: string]: unknown;

  id: number;
  subFloorCode: string;
  description: string;

  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/* =====================================================
   FLOOR - ENTITY MODEL (DB RESPONSE)
===================================================== */
export interface Floor {
  [key: string]: unknown;

  id: number;
  floorCode: string;
  description: string;
  sequenceNo: number;

  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/* =====================================================
   OLD FLOOR DETAILS - API RESPONSE MODELS
===================================================== */
/**
 * Detailed information about a historical floor record.
 */
export interface OldFloorDetail {
  /** Record unique identifier */
  id: number;
  /** Property identifier */
  propertyId: number;
  /** Identifier for the floor master */
  oldFloorId: number;
  /** Display name of the floor */
  floorDescription: string;
  /** Identifier for the sub-floor master (optional) */
  oldSubFloorId: number | null;
  /** Display name of the sub-floor */
  subFloorDescription: string | null;
  /** Construction year as a string (YYYY) */
  oldConstructionYear: string;
  /** Numeric construction year */
  constructionYearValue: number;
  /** Assessment year as a string (optional) */
  oldAssessmentYear: string | null;
  /** Numeric assessment year */
  assessmentYearValue: number | null;
  /** Identifier for construction type master */
  oldConstructionTypeId: number;
  /** Display name of construction type */
  constructionTypeDescription: string;
  /** Identifier for type of use master */
  oldTypeOfUseId: number;
  /** Display name of type of use */
  typeOfUseDescription: string;
  /** Identifier for sub-type of use master (optional) */
  oldSubTypeOfUseId: number | null;
  /** Display name of sub-type of use */
  subTypeOfUseDescription: string | null;
  /** Carpet area in square meters */
  oldCarpetAreaSqMeter: number;
  /** Carpet area in square feet */
  oldCarpetAreaSqFeet: number;
  /** Built-up area in square meters */
  oldBuiltupAreaSqMeter: number;
  /** Built-up area in square feet */
  oldBuiltupAreaSqFeet: number;
  /** Whether the record is flagged for removal */
  markedForDeletion: boolean;
  /** Date when record was marked for deletion */
  markedForDeletionDate: string | null;
}

/**
 * Paginated response for old floor details
 */
export interface OldFloorDetails {
  /** Array of floor detail items */
  items: OldFloorDetail[];
  /** Total count of records */
  totalCount: number;
  /** Current page number */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a previous page */
  hasPrevious: boolean;
  /** Whether there is a next page */
  hasNext: boolean;
}

/**
 * API response wrapper for old floor details
 */
export interface OldFloorDetailsResponse {
  success: boolean;
  message: string;
  items: OldFloorDetails | null;
  errors: unknown | null;
  correlationId?: string | null;
}


export interface FloorInformationFormProps {
  floorOptions?: Floor[];
  subFloorOptions?: SubFloor[];
  constructionTypeOptions?: ConstructionType[];
  useOptions?: TypeOfUse[];
  initialSubUseTypeOptions?: SubTypeOfUse[];
  existingFloorDetails?: OldFloorDetail[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  searchTerm?: string;
}

/**
 * Data structure for the Floor Information Form state.
 * Uses strings for numeric fields to handle controlled input state smoothly.
 */
export interface FloorInformationFormData {
  /** Optional ID for existing records being edited */
  id?: number;
  /** ID of the selected floor from master data */
  oldFloorId: string | number;
  /** Optional ID of the selected sub-floor from master data */
  oldSubFloorId: string | number;
  /** Year of construction (YYYY) */
  oldConstructionYear: string;
  /** Assessment Year (YYYY) */
  oldAssessmentYear?: string;
  /** ID of the selected construction type */
  oldConstructionTypeId: string | number;
  /** ID of the selected type of use */
  oldTypeOfUseId: string | number;
  /** Optional ID of the selected sub-type of use */
  oldSubTypeOfUseId: string | number;
  floorDescription?: string;
  subFloorDescription?: string | null;
  constructionTypeDescription?: string;
  typeOfUseDescription?: string;
  subTypeOfUseDescription?: string | null;
  /** Carpet area in square feet */
  oldCarpetAreaSqFeet: string;
  /** Area in square feet */
  oldAreaSqFeet?: string;
  /** Area in square meters */
  oldAreaSqMeter?: string;
  /** Built-up area in square feet */
  oldBuiltupAreaSqFeet?: string;
  /** Built-up area in square meters */
  oldBuiltupAreaSqMeter?: string;
}

export interface FloorTableRow {
  [key: string]: unknown;
  id: number;
  originalRow: OldFloorDetail;
  floor: string;
  subFloor: string | null;
  conYr: string;
  assessmentYr?: string;
  conTyp: string;
  use: string;
  subUse: string | null;
  carpetAreaSqFt: number | string;
  carpetAreaSqM: number | string;
  builtupAreaSqFt?: number | string;
  builtupAreaSqM?: number | string;
  carpetAreaCombined?: string;
  builtupAreaCombined?: string;
}

/**
 * Payload for creating or updating an old floor detail record.
 */
export interface SaveOldFloorDetailPayload {
  /** Property identifier */
  propertyId: number;
  /** Identifier for the floor master */
  oldFloorId: number;
  /** Identifier for the sub-floor master (optional) */
  oldSubFloorId: number | null;
  /** Construction year as a string (YYYY) */
  oldConstructionYear: string;
  /** Assessment year as a string (YYYY) (optional) */
  oldAssessmentYear?: string;
  /** Identifier for construction type master */
  oldConstructionTypeId: number;
  /** Identifier for type of use master */
  oldTypeOfUseId: number;
  /** Identifier for sub-type of use master (optional) */
  oldSubTypeOfUseId: number | null;
  /** Carpet area in square meters */
  oldCarpetAreaSqMeter: number;
  /** Carpet area in square feet */
  oldCarpetAreaSqFeet: number;
  /** Built-up area in square meters */
  oldBuiltupAreaSqMeter: number;
  /** Built-up area in square feet */
  oldBuiltupAreaSqFeet: number;
}
/* =====================================================
   OLD TAXES DETAILS - API RESPONSE MODELS
===================================================== */
export interface OldTaxItem {
  taxId: number;
  taxName: string;
  taxAmount: number;
}

export interface OldTaxYear {
  financeYearId: number;
  year: number;
  yearCode: string | null;
  taxes: OldTaxItem[];
}

export interface OldTaxesDetails {
  propertyId: number;
  taxYears: OldTaxYear[];
}

export interface OldTaxesDetailsResponse {
  success: boolean;
  message: string;
  items: OldTaxesDetails | null;
  errors: unknown | null;
}

export interface TaxationBreakdownFormProps {
  initialData?: OldTaxesDetails | null;
  yearOptions?: YearMaster[];
}


export interface UseFloorInformationFormProps {
  propertyId: number;
  locale: string;
  initialSubUseTypeOptions: SubTypeOfUse[];
}

export interface YearMaster {
  id: number;
  year: number;
  yearCode: string;
  isActive: boolean;
  status: string;
  startDate: string;
  endDate: string;
  description: string | null;
}

export interface YearMasterResponse {
  items: YearMaster[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}