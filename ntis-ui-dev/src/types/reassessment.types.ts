/**
 * Reassessment Types
 * Types for property reassessment API responses and data structures
 */

/**
 * Photo document in reassessment data
 */
export interface ReassessmentPhoto {
  documentGuid: string;
  type: 'OLD_PLAN_PHOTO' | 'OLD_PROPERTY_PHOTO' | 'NEW_PLAN_PHOTO' | 'NEW_PROPERTY_PHOTO';
}

/**
 * Floor detail structure for both old and new floor details
 */
export interface ReassessmentFloorDetail {
  type?: 'NEW' | 'OLD';
  changeStatus?: string | null;
  floorCode: string;
  constructionCode: string;
  description: string;
  constructionYear: string;
  assessmentYear: string;
  carpetAreaSqMeter: number;
  carpetAreaSqFeet: number;
  builtupAreaSqMeter: number;
  builtupAreaSqFeet: number;
  isRenter?: boolean;
  renterName?: string | null;
  taxLiability: string | null;
  rentMonthly?: number | null;
  finalYearlyRent?: number | null;
  financialYear: string | null;
  rateableValue: number | null;
  annualRentalValue: number | null;
  depreciation: number | null;
  maintenance?: number | null;
  monthlyRate: number | null;
  yearlyRate: number | null;
  yearlyRent: number | null;
  ocCertificateNo: string | null;
  ocCertificateIssueDate: string | null;
  ccCertificateNo: string | null;
  ccCertificateIssueDate: string | null;
}

/**
 * Tax summary item with dynamic tax heads
 */
export interface ReassessmentTaxSummary {
  taxId: number;
  taxName: string;
  displayOrder: number;
  oldAmount: number;
  newAmount: number;
}

/**
 * Main reassessment data structure
 */
export interface ReassessmentData {
  propertyId: number;
  propertyOldId: number;
  photos: ReassessmentPhoto[];
  newFloorDetails: ReassessmentFloorDetail[];
  oldFloorDetails: ReassessmentFloorDetail[];
  taxSummary: ReassessmentTaxSummary[];
}

/**
 * API response wrapper for reassessment endpoint
 */
export interface ReassessmentApiResponse {
  success: boolean;
  message: string;
  items: ReassessmentData;
  errors: string | null;
  correlationId: string | null;
}

/**
 * Mapped floor detail for UI display
 */
export interface MappedFloorDetail extends Record<string, unknown> {
  type?: 'NEW' | 'OLD';
  changeStatus?: string | null;
  floor: string;
  conYear: string;
  asstYear: string;
  constType: string;
  use: string;
  carpetAreaSqFt: number;
  carpetAreaSqM: number;
  builtUpAreaSqFt: number;
  builtUpAreaSqM: number;
  isRenter?: boolean;
  renterName?: string | null;
  rate: number;
  yearlyRate: number;
  financialYear: string;
  renter: string;
  taxLiability: string;
  rentMy: number;
  rentMonthly?: number | null;
  finalYearlyRent?: number | null;
  rentalValue: number;
  depreciation: number;
  alv: number;
  mr: number;
  rv: number;
  ocCertificateNo: string;
  ocCertificateIssueDate: string;
  ccCertificateNo: string;
  ccCertificateIssueDate: string;
  maintenance?: number | null;
  yearlyRent?: number | null;
  status?: 'Unchanged' | 'Added' | 'Removed';
  bgClass?: string;
}

/**
 * Tax detail row for the dynamic taxes table
 */
export interface ReassessmentTaxRow {
  rowType: 'old' | 'additional' | 'total';
  label: string;
  taxes: { [taxName: string]: number };
  totalTax: number;
}

/**
 * Params required for fetching reassessment data
 */
export interface ReassessmentParams {
  wardId: number;
  propertyNo: string;
  partitionNo?: string;
}

/**
 * Retrospective tax year entry from API
 */
export interface RetrospectiveTaxYear {
  pendingYearId: number;
  year: number;
  financeYear: string;
  days: number;
  amounts: number[];
  total: number;
}

/**
 * Retrospective tax API data payload
 */
export interface RetrospectiveTaxData {
  propertyId: number;
  taxHeadNames: string[];
  years: RetrospectiveTaxYear[];
}

/**
 * API response wrapper for retrospective tax endpoint
 */
export interface RetrospectiveTaxApiResponse {
  success: boolean;
  message: string;
  items: RetrospectiveTaxData;
  errors: string | null;
  correlationId: string | null;
}

/**
 * Dynamic column for retrospective modal
 */
export interface MappedRetrospectiveColumn {
  key: string;
  label: string;
  displayOrder: number;
}

/**
 * Dynamic row for retrospective modal
 */
export interface MappedRetrospectiveRow extends Record<string, unknown> {
  pendingYearId: number;
  financeYear: string;
  days: number;
  total: number;
  [taxKey: string]: unknown;
}
