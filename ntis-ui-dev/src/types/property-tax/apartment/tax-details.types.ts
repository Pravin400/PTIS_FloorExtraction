/**
 * Types for Apartment Tax Details API (/api/Apartment/Taxdetails)
 */

export interface TaxHeadItem {
  taxId: number;
  taxName: string;
  taxAmount: number;
  policyCode?: string | null;
  financeYearId?: number | null;
}

export interface ApartmentPropertyTaxDetailItem {
  taxName?: string;
  taxHeadName?: string;
  taxHeadCode?: string;
  taxAmount?: number;
  amount?: number;
  taxId?: number;
  policyCode?: string | null;
}

export interface CurrentTaxGroup {
  taxType: string;
  taxHeads: TaxHeadItem[];
}

export interface ApartmentTaxDetailsItem {
  wardId: number | null;
  propertyNo: string | null;
  wingMasterId: number | null;
  wingName: string | null;
  wingNo: string | null;
  societyName: string | null;
  propertyCount: number | null;
  currentTaxes: CurrentTaxGroup[];
  arrears: TaxHeadItem[];
}

export interface ApartmentTaxDetailsResponse {
  success: boolean;
  message: string | null;
  items: ApartmentTaxDetailsItem | null;
  totalCount: number | null;
  errors: string[] | null;
  correlationId: string | null;
}

export interface DemandTaxHeadItem {
  taxId: number;
  taxName: string;
  policyCode?: string | null;
  taxAmount: number;
  financeYearId?: number | null;
}

export interface DemandTaxGroup {
  taxType: string;
  taxHeads: DemandTaxHeadItem[];
}

export interface ApartmentDemandDetailsItem {
  wardId: number | null;
  propertyNo: string | null;
  wingMasterId?: number | null;
  wingName?: string | null;
  wingNo?: string | null;
  societyName?: string | null;
  propertyCount?: number | null;
  financeYearId?: number | null;
  financeYear?: string | null;
  demandTaxes?: DemandTaxGroup[];
  yearWiseTaxes?: DemandTaxGroup[];
}

export interface ApartmentDemandDetailsResponse {
  success: boolean;
  message: string | null;
  items: ApartmentDemandDetailsItem | null;
  totalCount: number | null;
  errors: string[] | null;
  correlationId: string | null;
}
