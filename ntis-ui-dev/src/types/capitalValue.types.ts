/**
 * Type definitions for Capital Value API
 * Endpoint: GET /CapitalValue/{propertyId}
 */

import { PtisTaxDetail } from './ptis-core.types';

export type CapitalValueTax = PtisTaxDetail;

/**
 * Capital value information for a single floor/property detail
 */
export interface CapitalValueItem {
  /** Optional unique identifier */
  id?: number;
  /** Unique identifier for the property detail/floor */
  propertyDetailsId: number;
  /** Unique property identifier */
  propertyId: number;
  /** Floor identifier */
  floorId?: number | null;
  /** Sub-floor identifier */
  subFloorId?: number | null;
  /** Year when construction was completed */
  constructionYear: string;
  /** Assessment year for tax calculation */
  assessmentYear: string;
  /** Construction type identifier */
  constructionTypeId?: number | null;
  /** Type of use identifier */
  typeOfUseId?: number | null;
  /** Sub-type of use identifier */
  subTypeOfUseId?: number | null;
  /** Carpet area in square feet */
  carpetAreaSqFeet: number | null;
  /** Carpet area in square meters */
  carpetAreaSqMeter: number | null;
  /** Number of rooms in the property */
  noOfRooms: number;
  /** Whether property is rented */
  renterYesNo?: boolean | null;
  /** Name of the renter (if rented) */
  renterName?: string | null;
  /** Monthly rent amount */
  rentMonthly?: number | null;
  /** Built-up area in square meters */
  builtupAreaSqMeter: number | null;
  /** Built-up area in square feet */
  builtupAreaSqFeet: number | null;
  /** Standard Depreciation Rate for Rent */
  sdrr: number;
  /** Base value for calculation */
  baseValue: number;
  /** Floor factor multiplier */
  floorFactor: number;
  /** Age factor multiplier */
  ageFactor: number;
  /** Use factor multiplier */
  useFactor: number;
  /** Final calculated capital value */
  capitalValue: number;
  /** Tax breakdown by type */
  taxes?: CapitalValueTax[] | null;
  /** Floor description */
  floorDescription?: string;
  /** Sub-floor description */
  subFloorDescription?: string;
  /** Construction type description */
  constructionTypeDescription?: string;
  /** Type of use description */
  typeOfUseDescription?: string;
  /** Sub-type of use description */
  subTypeOfUseDescription?: string;
  /** Nature of Building Type factor */
  ntbFactor?: number;
  /** Total tax for this floor/detail */
  taxTotal?: number | null;
  /** Year range capital value identifier */
  yearRangeCVId?: number | null;
}

/**
 * Collection response for capital value with pagination support
 */
export interface CapitalValueCollection {
  /** Array of capital value items */
  items?: CapitalValueItem[];
  /** Alternative array of capital value items */
  details?: CapitalValueItem[];
  /** Total tax calculated */
  totalTax?: number;
  /** Sum of capital values */
  totalCapitalValue?: number;
  /** Total number of items */
  totalCount?: number;
  /** Current page number */
  pageNumber?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Total number of pages */
  totalPages?: number;
  /** Whether previous page exists */
  hasPrevious?: boolean;
  /** Whether next page exists */
  hasNext?: boolean;
}

/**
 * Capital value response - can be either an array or a collection object
 */
export type CapitalValueResponse = CapitalValueItem[] | CapitalValueCollection;

/**
 * Row representation for capital value table display
 * Contains formatted string values for UI rendering
 */
export interface CapitalRow {
  /** Property detail identifier */
  id: number;
  /** Floor number/description */
  floor: string;
  /** Sub-floor description */
  subFloor: string;
  /** Construction year */
  constructionYear: string;
  /** Assessment year */
  assessmentYear: string;
  /** Construction type */
  constructionType: string;
  /** Nature/type of building use */
  natureTypeBuilding: string;
  /** Sub-type of use */
  subType: string;
  /** Number of rooms */
  noOfRooms: string;
  /** Formatted carpet area (sq ft & sq m) */
  carpetArea: string;
  /** Formatted built-up area (sq ft & sq m) */
  builtUpArea: string;
  /** Formatted SDRR rate */
  sdrrRate: string;
  /** Formatted base value */
  baseValue: string;
  /** Formatted floor factor */
  floorFactor: string;
  /** Formatted age factor */
  ageFactor: string;
  /** Formatted NTB factor */
  ntbFactor: string;
  /** Formatted use factor */
  useFactor: string;
  /** Formatted final capital value */
  finalCapitalValue: string;
  /** Tax breakdown for this row */
  taxes: CapitalValueTax[];
}

