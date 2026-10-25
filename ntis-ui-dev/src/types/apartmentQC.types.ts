/**
 * Type definitions for Apartment QC Details API
 * Endpoint: GET /api/Property/apartmentQC-details
 */

/**
 * Individual apartment QC detail item
 */
export interface ApartmentQCDetail {
  /** Unique identifier */
  id: number;
  /** Property details identifier */
  pdnId: number | null;
  /** Tax zone identifier */
  taxZoneId: number | null;
  /** Zone number */
  zoneNo: string | null;
  /** Property number */
  propertyNo: string;
  /** Old property number */
  oldPropertyNo: string | null;
  /** Ward identifier */
  wardId: number;
  /** Ward number/code */
  wardNo?: string | null;
  /** Mobile number */
  mobileNo: string | null;
  /** Email address */
  emailId: string | null;
  /** Occupancy certificate date */
  ocDate: string | null;
  /** Flat or shop number */
  flatOrShopNo: string | null;
  /** Flat or shop name */
  flatOrShopName: string | null;
  /** Flat or shop number in English */
  flatOrShopNoEnglish: string | null;
  /** Flat or shop name in English */
  flatOrShopNameEnglish: string | null;
  /** Owner name */
  ownerName: string | null;
  /** Owner name in English */
  ownerNameEnglish: string | null;
  /** Occupier name */
  occupierName: string | null;
  /** Occupier name in English */
  occupierNameEnglish: string | null;
  /** Property type id (new field) */
  propertyType?: number | null;
  /** Yearly rent amount */
  rentYearly: number | null;
  /** Monthly rent amount */
  rentMonthly: number | null;
  /** Renter name */
  renterName: string | null;
  /** Renter name in English */
  renterNameEnglish: string | null;
  /** Type of use */
  typeOfUse: string | null;
  /** Property type */
  type: string | null;
  /** Part type */
  partType: string | null;
  /** Wing name from the API (new field) */
  wing?: string | null;
  /** Number of rooms */
  noOfRooms?: number | null;
  /** Floor */
  floor: string | null;
  /** Sub floor */
  subFloor: string | null;
  /** Sub type of use (new field) */
  subTypeOfUse?: string | null;
  /** Construction year */
  constructionYear: string | null;
  /** Assessment year */
  assessmentYear: string | null;
  /** Construction type */
  constructionType: string | null;
  /** Old construction area */
  oldConstructionArea: number | null;
  /** Old construction year */
  oldConstructionYear: string | null;
  /** Old use type */
  oldUseType: string | null;
  /** Old construction type */
  oldConstructionType: string | null;
  /** Old construction carpet area in sq ft */
  oldConstructionCarpetAreaSqFt?: number | null;
  /** Old construction carpet area in sq mtr */
  oldConstructionCarpetAreaSqMtr?: number | null;
  /** Old construction built up area in sq ft */
  oldConstructionBuiltUpSqFt?: number | null;
  /** Old construction built up area in sq mtr */
  oldConstructionBuiltUpSqMtr?: number | null;
  /** Old CSN */
  oldCSN: string | null;
  /** Old rateable value */
  oldRV: number | null;
  /** Old total tax */
  oldTotalTax: number | null;
  /** RV or CV value */
  rVorCVValue: number | null;
  /** Capital value */
  capitalValue: number | null;
  /** Rateable value */
  rateableValue: number | null;
  /** New tax total */
  newTaxTotal: number | null;
  /** New tax total CV */
  newTaxTotalCV: number | null;
  /** New tax total RV */
  newTaxTotalRV: number | null;
  /** Yearly rent from API (new field) */
  yearlyRent?: number | null;
  /** Monthly rate (new field) */
  monthlyRate?: number | null;
  /** Yearly rate (new field) */
  yearlyRate?: number | null;
  /** Depreciation (new field) */
  depreciation?: number | null;
  /** Annual rental value (new field) */
  annualRentalValue?: number | null;
  /** Maintenance (new field) */
  maintenance?: number | null;
  /** SDRR (new field) */
  sdrr?: number | null;
  /** Base value (new field) */
  baseValue?: number | null;
  /** Floor factor (new field) */
  floorFactor?: string | number | null;
  /** Age factor (new field) */
  ageFactor?: string | number | null;
  /** Nature factor (new field) */
  natureFactor?: string | number | null;
  /** Use factor (new field) */
  useFactor?: string | number | null;
  /** Floor factor identifier (new field) */
  floorFactorId?: number | null;
  /** Age factor identifier (new field) */
  ageFactorId?: number | null;
  /** Nature factor identifier (new field) */
  natureFactorId?: number | null;
  /** Use factor identifier (new field) */
  useFactorId?: number | null;
  /** Carpet area in square meters */
  carpetASqMtr: number | null;
  /** Carpet area in square feet */
  carpetASqFt: number | null;
  /** Built-up area in square meters */
  builtupASqMtr: number | null;
  /** Built-up area in square feet */
  builtupASqFt: number | null;
  /** Building number */
  buildingNo?: string | null;
  /** Society name */
  society?: string | null;
  /** BHK */
  bhk?: string | number | null;
  /** Toilet count */
  toiletCount?: string | number | null;
  /** Remark */
  remark?: string | null;
  /** Wing name */
  wingName?: string | null;
}

/**
 * Complete apartment QC details response
 * The API returns a nested structure: { success, message, items: { items: [], totalCount, ... } }
 */
export interface ApartmentQCResponse {
  /** Success status */
  success: boolean;
  /** Response message */
  message: string;
  /** Nested paginated items object */
  items: PagedResponse<ApartmentQCDetail>;
  /** List of errors if any */
  errors: string[] | null;
}

/**
 * Search parameters for apartment QC
 */
export interface ApartmentQCSearchParams {
  wardId?: number | string;
  propertyNo?: string;
  partitionNo?: string;
  propertyDetailsId?: number | string;
  propertyId?: number | string;
  partType?: string;
  type?: string;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
  // Column filter parameters
  wing?: string;
  flatOrShopNo?: string;
  apartmentType?: string;
  propertyType?: string;
}

/**
 * Generic paged response
 */
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
 * Tab type for apartment QC view
 */
export type ApartmentQCTab = 'rateable' | 'capital' | 'dual';

/**
 * Individual tax amount item for apartment tax details
 */
export interface ApartmentTaxAmountItem {
  taxName: string;
  taxAmount: number;
  displayOrder: number;
}

/**
 * Apartment tax details response items
 */
export interface ApartmentTaxDetailsItems {
  propertyId: number;
  taxAmounts: ApartmentTaxAmountItem[];
  propertyCount: number;
}

/**
 * Apartment property tax details API response
 * Endpoint: GET /api/Property/apartment-property-tax-details-rv
 */
export interface ApartmentPropertyTaxDetailsResponse {
  success: boolean;
  message: string;
  items: ApartmentTaxDetailsItems;
  errors: string[] | null;
  correlationId: string | null;
}

/**
 * Part type values for apartment property tax details
 * Amenity = Amenities tab, C = Commercial tab, R = Residential tab
 */
export type ApartmentPartType = 'Amenity' | 'C' | 'R';

/**
 * Parameters for fetching apartment property tax details (using WardId and PropertyNo)
 */
export interface ApartmentPropertyTaxDetailsParams {
  wardId: string | number;
  propertyNo: string;
  partType: ApartmentPartType; // Amenity=Amenities, C=Commercial, R=Residential
  partitionNo?: string;
}

/**
 * Parameters for fetching apartment property tax details by property ID
 * Used by PropertyDetailsEditScreen drawer
 */
export interface ApartmentPropertyTaxDetailsByIdParams {
  propertyId: string | number;
  partType: ApartmentPartType; // Aminity=Amenities, C=Commercial, R=Residential
}

/**
 * Dual method tax details containing both Rateable Value and Capital Value data
 */
export interface DualMethodTaxDetails {
  rateable: ApartmentTaxDetailsItems | null;
  capital: ApartmentTaxDetailsItems | null;
}
export type FloorSubmissionRow = {
  propertyId?: number | string;
  id: string;
  pdnId: number | null;
  floorId: string;
  conYear: string;
  asstYear: string;
  constructionTypeId: string;
  typeOfUseId: string;
  subTypeOfUseId: string;
  noOfRooms: string;
  area: string;
  taxable?: string;
  subFloorId?: string;
  renter?: string;
  areaSqFt?: string;
  areaSqMtr?: string;
  buildupAreaSqFt?: string;
  buildupAreaSqMtr?: string;
  rentMY: string;
  rateMY: string;
  monthlyRate?: number;
  yearlyRate?: number;
  rentalValue: string;
  depreciation: string;
  alv: string;
  mr: string;
  rv: string;
  sdrr: string;
  baseValue: string;
  floorFactor: string;
  ageFactor: string;
  ntbFactor: string;
  useFactor: string;
  capitalValue: string;
}
