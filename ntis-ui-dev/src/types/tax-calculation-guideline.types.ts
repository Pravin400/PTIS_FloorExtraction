/**
 * Tax Calculation Guideline Types
 * CC / OC / Electric Bill – Tax Calculation Guideline configuration
 */

// ─── Enums / literal unions ────────────────────────────────────────────────

export type DatePriorityOption =
  | 'OC Date'
  | 'CC Date'
  | 'Electric Bill Date'
  | 'Retrospective (No Date)'
  | 'Select';

export type ElectricBillDateRule =
  | 'From Financial Year Start Date'
  | 'From CC Date'
  | 'From OC Date'
  | 'From Electric Bill Date'
  | 'Exact Date'
  | 'Select';

export type NoDateRule =
  | 'Apply Default Retrospective'
  | 'Skip Tax Calculation'
  | 'Use Last Known Date'
  | 'Select';

export type ProrationType = 'Monthly' | 'Daily' | 'Full Year' | 'Select';

export type TaxPersistenceMode =
  | 'Property Aggregated'
  | 'Floor Level'
  | 'Assessment Year'
  | 'Floor Ledger'
  | 'Select';

// ─── Financial Year ────────────────────────────────────────────────────────

export interface FinancialYearStart {
  month: number | 'Select';
  day: number | 'Select';
}

// ─── Section 1: General Settings ──────────────────────────────────────────

export interface GeneralSettings {
  enableCertificateBasedTax: boolean;
  applyTaxOnlyForTaxableCertificateTypes: boolean;
  financialYearStart: FinancialYearStart;
  certificateTaxScopeMode?: string;
  minimumBackdateFinancialYear: number | undefined;
}

// ─── Section 2: Certificate Date Priority ─────────────────────────────────

export interface CertificateDatePriority {
  priority1: DatePriorityOption;
  priority2: DatePriorityOption;
  priority3: DatePriorityOption;
  priority4: DatePriorityOption;
}

// ─── Section 3: CC & OC Rules ─────────────────────────────────────────────

export type DurationUnit = 'Days' | 'Months' | 'Years' | 'Select';

export interface CcOcRules {
  applyCcToOcSplit: boolean;
  /** Numeric threshold value */
  ccOcDifferenceThreshold: number | undefined;
  ccOcDifferenceUnit: DurationUnit;
  ccPeriodMultiplier: number | undefined;
  ocPeriodMultiplier: number | undefined;
  enableCurrentFyPartialPolicy?: boolean;
  ccPartialPolicyCode?: string;
  ocPartialPolicyCode?: string;
}

// ─── Section 4: Electric Bill Rules ───────────────────────────────────────

export interface ElectricBillRules {
  electricBillDateRule: ElectricBillDateRule;
  addMonthsToElectricBillDate: number | undefined;
  addMonthsUnit: DurationUnit;
  electricBillMultiplier: number | undefined;
  electricBillMinimumFinancialYear?: number | undefined;
  electricBillPartialPolicyCode?: string;
}

// ─── Section 5: Retrospective (No Date) Rules ─────────────────────────────

export interface RetrospectiveRules {
  whenNoDateIsAvailable: NoDateRule;
  lookbackYears: number | undefined;
  defaultRetrospectiveMultiplier: number | undefined;
  enableRetrospectiveTax?: boolean;
}

// ─── Section 7: Other Settings ────────────────────────────────────────────

export interface OtherSettings {
  enableCurrentYearProration: boolean;
  prorationType: ProrationType;
  taxPersistenceMode: TaxPersistenceMode;
  doNotUpdateNettax?: boolean;
  guidelineChangeApplyMode?: string;
  recalculateOnCertificateSave?: boolean;
  recalculateOnCertificateDelete?: boolean;
  allowFloorWiseCertificateMetadata?: boolean;
  floorPolicyDisplayRule?: string;
}

// ─── Combined Form Data ────────────────────────────────────────────────────

export interface TaxCalculationGuidelineFormData {
  generalSettings: GeneralSettings;
  certificateDatePriority: CertificateDatePriority;
  ccOcRules: CcOcRules;
  electricBillRules: ElectricBillRules;
  retrospectiveRules: RetrospectiveRules;
  otherSettings: OtherSettings;
  dynamicGuidelines?: TaxCalculationGuidelineDto[];
}

// ─── API DTOs ──────────────────────────────────────────────────────────────

/** Shape returned by the backend GET endpoint */
export interface TaxCalculationGuidelineDto {
  id?: number;
  guidelineCode?: string;
  guidelineName?: string;
  description?: string;
  enableCertificateBasedTax?: boolean;
  applyOnlyProtectedCertificateTypes?: boolean;
  applyOnlyTaxableCertificateTypes?: boolean;
  financialYearStartMonth?: number | null;
  financialYearStartDay?: number | null;
  datePriority1?: string | null;
  datePriority2?: string | null;
  datePriority3?: string | null;
  datePriority4?: string | null;
  enableCCToOCSplit?: boolean;
  ignoreCCToOCIfWithinValue?: number;
  ignoreCCToOCIfWithinType?: string;
  ccPeriodMultiplier?: number;
  ocPeriodMultiplier?: number;
  electricBillDateRule?: string;
  electricBillAddMonths?: number;
  electricBillMultiplier?: number;
  noDateRule?: string;
  lookbackYears?: number;
  defaultRetrospectiveMultiplier?: number;
  floorCertificatePriority?: string;
  enableCurrentYearProration?: boolean;
  prorationMethod?: string;
  taxPersistenceMode?: string;
  policyReferenceNo?: string | null;
  policyReferenceDate?: string | null;
  policyApprovedBy?: string | null;
  remark?: string;
  isActive?: boolean;

  // New fields
  minimumBackdateFinancialYear?: number;
  certificateTaxScopeMode?: string | null;
  enableCurrentFyPartialPolicy?: boolean;
  ccPartialPolicyCode?: string | null;
  ocPartialPolicyCode?: string | null;
  electricBillMinimumFinancialYear?: number;
  electricBillPartialPolicyCode?: string | null;
  enableRetrospectiveTax?: boolean;
  doNotUpdateNettax?: boolean;
  guidelineChangeApplyMode?: string | null;
  recalculateOnCertificateSave?: boolean;
  recalculateOnCertificateDelete?: boolean;
  allowFloorWiseCertificateMetadata?: boolean;
  floorPolicyDisplayRule?: string | null;

  // Metadata/dynamic fields support
  guidelineGroup?: string;
  displayOrder?: number;
  dataType?: 'BIT' | 'INT' | 'DECIMAL' | 'VARCHAR';
  guidelineValue?: string | null;
  allowedValues?: string | null;
  parentGuidelineCode?: string | null;
  parentGuidelineValue?: string | null;
}

// ─── Component Props ───────────────────────────────────────────────────────

import type { PolicyConfiguration } from './policy-configuration.types';

export interface TaxCalculationGuidelineModuleProps {
  initialDto: TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[] | null;
  fetchError?: string;
  statusCode?: number;
  policyConfigs?: PolicyConfiguration[];
}

export interface TaxCalculationGuidelineSectionProps {
  formData: TaxCalculationGuidelineFormData;
  onChange: <S extends keyof TaxCalculationGuidelineFormData, K extends keyof TaxCalculationGuidelineFormData[S]>(
    section: S,
    field: K,
    value: TaxCalculationGuidelineFormData[S][K]
  ) => void;
  onChangeGuideline?: (code: string, value: string | null) => void;
  policyConfigs?: PolicyConfiguration[];
}
