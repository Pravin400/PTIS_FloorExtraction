/**
 * Represents a single tax amount entry
 */
export interface TaxAmountItem {
  taxName: string;
  taxAmount: number;
}

export interface PendingYearItem {
  pendingYearId: number;
  yearCode: string;
  taxAmounts: TaxAmountItem[];
  taxTotal: number;
}

/**
 * Represents a policy with tax amounts array and total
 */
export interface TaxPolicy {
  policyCode: string;
  policyName?: string;
  yearCode?: string;
  pendingYearId?: number;
  taxAmounts: TaxAmountItem[];
  taxTotal?: number;
  pendingYears?: PendingYearItem[];
}

/**
 * Represents the tax details data for a property (actual API response structure)
 */
export interface TaxDetailsData {
  propertyId: number;
  policies: TaxPolicy[];
}

/**
 * Dual tax details for both capital and rateable values
 */
export interface DualTaxDetailsData {
  capital?: {
    success: boolean;
    data?: TaxDetailsData;
    error?: string;
  };
  rateable?: {
    success: boolean;
    data?: TaxDetailsData;
    error?: string;
  };
}

/**
 * Tax details API response wrapper
 * Complete response structure from /tax-details and /tax-details-cv endpoints
 */
export interface PtisMainTaxDetailsApiResponse {
  success: boolean;
  message: string;
  items?: TaxDetailsData;
  errors: string[] | null;
  correlationId: string | null;
  statusCode?: number;
  data?: {
    success: boolean;
    message: string;
    items: TaxDetailsData;
    errors: string[] | null;
    correlationId: string | null;
  };
}

export interface TaxRow {
  id: number;
  taxes: string;
  labelKey?: string;
  yearCode?: string;
  pendingYearId?: number;
  totalTax: string;
  taxBreakdown?: Array<{ taxName: string; amount: number; percentage: number; taxId: number }>;
  pendingYears?: PendingYearItem[];
  [key: string]: unknown;
}

export interface PendingTaxRow {
  id: string;
  policyCode: string;
  yearCode: string;
  taxTotal: number;
  taxAmounts: TaxAmountItem[];
  isNetTax?: boolean;
}

export type PendingYearTaxDetail = PendingYearItem;