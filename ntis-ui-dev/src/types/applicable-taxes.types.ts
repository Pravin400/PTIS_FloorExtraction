
export interface TaxApplicabilityPropertyData {
  propertyId: number;
  propertyDetailId: number;
  financeYearId: number;
  financeYear?: string;
  floorId: number;
  subFloorId: number | null;
  typeOfUseId: number;
  typeOfUseCode: string;
  typeOfUseDescription: string;
}

export interface AssessmentYearRangeItem {
  id: number;
  fromYear: number;
  toYear: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}

export interface TypeOfUseItem {
  id: number;
  typeOfUseCode: string;
  description: string;
  type: string;
  typeOfUseGroupId: number | null;
  searchSequence: number | null;
  typeOfUseCategoryId: number | null;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export interface ApplicableTaxesPageProps {
  asseYearsResponse: PagedResponse<AssessmentYearRangeItem> | null;
  useGroupsResponse: PagedResponse<TypeOfUseItem> | null;
  valuationTab: string;
}

export type TaxApplicabilityItem = {
  taxId: number;
  taxHead: string;
  taxCode: string;
  calculationType: string | null;
  taxPercentage: number;
  taxAmount: number;
  isApplicable: boolean;
  isActive: boolean;
} & Record<string, unknown>;


export interface TaxApplicabilityData {
  propertyId: number;
  financialYearId: number;
  typeOfUseId: number;
  applicableCount: number;
  exemptedCount: number;
  applicableTaxes: TaxApplicabilityItem[];
  exemptedTaxes: TaxApplicabilityItem[];
}

export interface TaxApplicabilityWrapper {
  success: boolean;
  message: string;
  items: TaxApplicabilityData;
  errors: unknown;
  correlationId: string | null;
}

export interface ApplicableTaxesProps {
  asseYearsResponse: PagedResponse<AssessmentYearRangeItem> | null;
  useGroupsResponse: PagedResponse<TypeOfUseItem> | null;
  valuationTab: string;
  taxApplicabilityPagedResponse: TaxCalculationResponse | null;
  taxApplicabilityPropertyData?: TaxApplicabilityPropertyData[] | null;
  initialAsseYear?: string;
  initialTypeOfUse?: string;
}

export interface TaxCalculationSummary {
  totalTax: number;
  residentialRV: number;
  commercialRV: number;
  area: number;
  toilets: number;
}

export interface TypeOfUseTaxPercentage {
  typeOfUseId: number;
  description: string;
  type: string;
  taxPercentage: number;
  baseType: string;
}

export interface SlabDetail {
  minAmount: number;
  maxAmount: number;
  rate: number;
  type: string;
  baseType: string;
}

export type TaxCalculationItem = {
  taxId: number;
  taxName: string;
  calculationModeId: number;
  calculationMode: string;
  ruleDefinitionId: number;
  typeOfUseIds: string | null;
  descriptions: string | null;
  types: string | null;
  baseTypes: string | null;
  averageTaxPercentage: number | null;
  typeOfUseTaxPercentages?: TypeOfUseTaxPercentage[];
  slabDetails?: SlabDetail[] | null;
  resultModes: string | null;
  resultBases: string | null;
  resultValues: string | null;
  mappingData: string | null;
  taxAmount: number;
  isApplicable: boolean;
  isActive: boolean;
  assessmentStatus: boolean;
} & Record<string, unknown>;

export interface TaxCalculationResponse {
  propertyId: number;
  assessmentYearRangeId: number;
  typeOfUseId: number;
  applicableCount: number;
  exemptedCount: number;
  summary: TaxCalculationSummary;
  taxCalculations: TaxCalculationItem[];
}