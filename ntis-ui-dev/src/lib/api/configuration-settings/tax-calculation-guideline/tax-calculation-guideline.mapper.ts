/**
 * Tax Calculation Guideline – Data Mapper
 * Converts between API DTOs and the UI form data model.
 */
import type {
  TaxCalculationGuidelineDto,
  TaxCalculationGuidelineFormData,
  DatePriorityOption,
  DurationUnit,
  ElectricBillDateRule,
  NoDateRule,
  ProrationType,
  TaxPersistenceMode,
} from '@/types/tax-calculation-guideline.types';

// ─── Bidirectional Enum Mappers ───────────────────────────────────────────

const DTO_TO_PRIORITY: Record<string, DatePriorityOption> = {
  OC: 'OC Date',
  CC: 'CC Date',
  ELECTRIC_BILL: 'Electric Bill Date',
  RETROSPECTIVE: 'Retrospective (No Date)',
};

const PRIORITY_TO_DTO: Record<DatePriorityOption, string | null> = {
  'OC Date': 'OC',
  'CC Date': 'CC',
  'Electric Bill Date': 'ELECTRIC_BILL',
  'Retrospective (No Date)': 'RETROSPECTIVE',
  Select: null,
};

const DTO_TO_EB_RULE: Record<string, ElectricBillDateRule> = {
  FROM_FY_START: 'From Financial Year Start Date',
  FROM_CC: 'From CC Date',
  FROM_OC: 'From OC Date',
  FROM_ELECTRIC_BILL: 'From Electric Bill Date',
  EXACT_DATE: 'Exact Date',
};

const EB_RULE_TO_DTO: Record<ElectricBillDateRule, string | null> = {
  'From Financial Year Start Date': 'FROM_FY_START',
  'From CC Date': 'FROM_CC',
  'From OC Date': 'FROM_OC',
  'From Electric Bill Date': 'FROM_ELECTRIC_BILL',
  'Exact Date': 'EXACT_DATE',
  Select: null,
};

const DTO_TO_NO_DATE_RULE: Record<string, NoDateRule> = {
  DEFAULT_RETROSPECTIVE: 'Apply Default Retrospective',
  NO_TAX: 'Skip Tax Calculation',
  USE_LAST_KNOWN: 'Use Last Known Date',
};

const NO_DATE_RULE_TO_DTO: Record<NoDateRule, string | null> = {
  'Apply Default Retrospective': 'DEFAULT_RETROSPECTIVE',
  'Skip Tax Calculation': 'NO_TAX',
  'Use Last Known Date': 'USE_LAST_KNOWN',
  Select: null,
};

const DTO_TO_UNIT: Record<string, DurationUnit> = {
  DAYS: 'Days',
  MONTHS: 'Months',
  YEARS: 'Years',
};

const UNIT_TO_DTO: Record<DurationUnit, string | null> = {
  Days: 'DAYS',
  Months: 'MONTHS',
  Years: 'YEARS',
  Select: null,
};

const DTO_TO_PRORATION: Record<string, ProrationType> = {
  MONTHLY: 'Monthly',
  DAILY: 'Daily',
  NONE: 'Select',
  FULL_YEAR: 'Full Year',
};

const PRORATION_TO_DTO: Record<ProrationType, string | null> = {
  Monthly: 'MONTHLY',
  Daily: 'DAILY',
  'Full Year': 'FULL_YEAR',
  Select: null,
};

const DTO_TO_PERSISTENCE: Record<string, TaxPersistenceMode> = {
  PROPERTY_AGGREGATED: 'Property Aggregated',
  FLOOR_LEVEL: 'Floor Level',
  ASSESSMENT_YEAR: 'Assessment Year',
  FLOOR_LEDGER: 'Floor Ledger',
};

const PERSISTENCE_TO_DTO: Record<TaxPersistenceMode, string | null> = {
  'Property Aggregated': 'PROPERTY_AGGREGATED',
  'Floor Level': 'FLOOR_LEVEL',
  'Assessment Year': 'ASSESSMENT_YEAR',
  'Floor Ledger': 'FLOOR_LEDGER',
  Select: null,
};

export const DEFAULT_TAX_GUIDELINE_FORM: TaxCalculationGuidelineFormData = {
  generalSettings: {
    enableCertificateBasedTax: false,
    applyTaxOnlyForTaxableCertificateTypes: false,
    financialYearStart: { month: 'Select', day: 'Select' },
    certificateTaxScopeMode: 'Select',
    minimumBackdateFinancialYear: undefined,
  },
  certificateDatePriority: {
    priority1: 'Select',
    priority2: 'Select',
    priority3: 'Select',
    priority4: 'Select',
  },
  ccOcRules: {
    applyCcToOcSplit: false,
    ccOcDifferenceThreshold: undefined,
    ccOcDifferenceUnit: 'Select',
    ccPeriodMultiplier: undefined,
    ocPeriodMultiplier: undefined,
    enableCurrentFyPartialPolicy: false,
    ccPartialPolicyCode: 'Select',
    ocPartialPolicyCode: 'Select',
  },
  electricBillRules: {
    electricBillDateRule: 'Select',
    addMonthsToElectricBillDate: undefined,
    addMonthsUnit: 'Select',
    electricBillMultiplier: undefined,
    electricBillMinimumFinancialYear: undefined,
    electricBillPartialPolicyCode: 'Select',
  },
  retrospectiveRules: {
    enableRetrospectiveTax: false,
    whenNoDateIsAvailable: 'Select',
    lookbackYears: undefined,
    defaultRetrospectiveMultiplier: undefined,
  },
  otherSettings: {
    enableCurrentYearProration: false,
    prorationType: 'Select',
    taxPersistenceMode: 'Select',
    doNotUpdateNettax: false,
    guidelineChangeApplyMode: 'Select',
    recalculateOnCertificateSave: false,
    recalculateOnCertificateDelete: false,
    allowFloorWiseCertificateMetadata: false,
    floorPolicyDisplayRule: 'Select',
  },
  dynamicGuidelines: [],
};

// ─── Mapping Functions ─────────────────────────────────────────────────────

/** Convert an API DTO → UI form data */
export function mapDtoToFormData(dto: TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[]): TaxCalculationGuidelineFormData {
  const form = JSON.parse(JSON.stringify(DEFAULT_TAX_GUIDELINE_FORM)) as TaxCalculationGuidelineFormData;

  if (Array.isArray(dto)) {
    // Merge API items with fallback defaults for any guideline codes not yet seeded in DB
    const fallbacks = generateDefaultDynamicGuidelines(form);
    const apiCodes = new Set(dto.map((g) => g.guidelineCode));
    const merged = [
      ...dto,
      ...fallbacks.filter((f) => f.guidelineCode && !apiCodes.has(f.guidelineCode)),
    ];
    form.dynamicGuidelines = merged;
    
    // Map array elements to form fields
    for (const item of dto) {
      const code = item.guidelineCode;
      const valStr = item.guidelineValue;
      if (!code || valStr === undefined || valStr === null) continue;

      if (code === 'ENABLE_CERTIFICATE_BASED_TAX') {
        form.generalSettings.enableCertificateBasedTax = valStr === 'true' || valStr === '1';
      } else if (code === 'APPLY_ONLY_TAXABLE_CERT_TYPES') {
        form.generalSettings.applyTaxOnlyForTaxableCertificateTypes = valStr === 'true' || valStr === '1';
      } else if (code === 'FINANCIAL_YEAR_START_MONTH') {
        form.generalSettings.financialYearStart.month = valStr === 'Select' || valStr === '' ? 'Select' : Number(valStr);
      } else if (code === 'FINANCIAL_YEAR_START_DAY') {
        form.generalSettings.financialYearStart.day = valStr === 'Select' || valStr === '' ? 'Select' : Number(valStr);
      } else if (code === 'MINIMUM_BACKDATE_FINANCIAL_YEAR') {
        form.generalSettings.minimumBackdateFinancialYear = valStr === '' ? undefined : Number(valStr);
      } else if (code === 'CERTIFICATE_TAX_SCOPE_MODE') {
        form.generalSettings.certificateTaxScopeMode = valStr;
      }

      // CC & OC Rules
      else if (code === 'ENABLE_CC_TO_OC_SPLIT') {
        form.ccOcRules.applyCcToOcSplit = valStr === 'true' || valStr === '1';
      } else if (code === 'IGNORE_CC_TO_OC_IF_WITHIN_VALUE') {
        form.ccOcRules.ccOcDifferenceThreshold = valStr === '' ? undefined : Number(valStr);
      } else if (code === 'IGNORE_CC_TO_OC_IF_WITHIN_TYPE') {
        form.ccOcRules.ccOcDifferenceUnit = valStr ? (DTO_TO_UNIT[valStr] ?? 'Select') : 'Select';
      } else if (code === 'CC_PERIOD_MULTIPLIER') {
        form.ccOcRules.ccPeriodMultiplier = valStr === '' ? undefined : Number(valStr);
      } else if (code === 'OC_PERIOD_MULTIPLIER') {
        form.ccOcRules.ocPeriodMultiplier = valStr === '' ? undefined : Number(valStr);
      } else if (code === 'ENABLE_CURRENT_FY_PARTIAL_POLICY') {
        form.ccOcRules.enableCurrentFyPartialPolicy = valStr === 'true' || valStr === '1';
      } else if (code === 'CC_PARTIAL_POLICY_CODE') {
        form.ccOcRules.ccPartialPolicyCode = valStr;
      } else if (code === 'OC_PARTIAL_POLICY_CODE') {
        form.ccOcRules.ocPartialPolicyCode = valStr;
      }

      // Electric Bill Rules
      else if (code === 'ELECTRIC_BILL_DATE_RULE') {
        form.electricBillRules.electricBillDateRule = valStr ? (DTO_TO_EB_RULE[valStr] ?? 'Select') : 'Select';
      } else if (code === 'ELECTRIC_BILL_ADD_MONTHS') {
        form.electricBillRules.addMonthsToElectricBillDate = valStr === '' ? undefined : Number(valStr);
      } else if (code === 'ELECTRIC_BILL_MULTIPLIER') {
        form.electricBillRules.electricBillMultiplier = valStr === '' ? undefined : Number(valStr);
      } else if (code === 'ELECTRIC_BILL_MINIMUM_FINANCIAL_YEAR') {
        form.electricBillRules.electricBillMinimumFinancialYear = valStr === '' ? undefined : Number(valStr);
      } else if (code === 'ELECTRIC_BILL_PARTIAL_POLICY_CODE') {
        form.electricBillRules.electricBillPartialPolicyCode = valStr;
      }

      // Retrospective Rules
      else if (code === 'ENABLE_RETROSPECTIVE_TAX') {
        form.retrospectiveRules.enableRetrospectiveTax = valStr === 'true' || valStr === '1';
      } else if (code === 'NO_DATE_RULE') {
        form.retrospectiveRules.whenNoDateIsAvailable = valStr ? (DTO_TO_NO_DATE_RULE[valStr] ?? 'Select') : 'Select';
      } else if (code === 'LOOKBACK_YEARS') {
        form.retrospectiveRules.lookbackYears = valStr === '' ? undefined : Number(valStr);
      } else if (code === 'DEFAULT_RETROSPECTIVE_MULTIPLIER') {
        form.retrospectiveRules.defaultRetrospectiveMultiplier = valStr === '' ? undefined : Number(valStr);
      }

      // Other Settings
      else if (code === 'ENABLE_CURRENT_YEAR_PRORATION') {
        form.otherSettings.enableCurrentYearProration = valStr === 'true' || valStr === '1';
      } else if (code === 'PRORATION_METHOD') {
        form.otherSettings.prorationType = valStr ? (DTO_TO_PRORATION[valStr] ?? 'Select') : 'Select';
      } else if (code === 'TAX_PERSISTENCE_MODE') {
        form.otherSettings.taxPersistenceMode = valStr ? (DTO_TO_PERSISTENCE[valStr] ?? 'Select') : 'Select';
      } else if (code === 'DO_NOT_UPDATE_NETTAX') {
        form.otherSettings.doNotUpdateNettax = valStr === 'true' || valStr === '1';
      } else if (code === 'GUIDELINE_CHANGE_APPLY_MODE') {
        form.otherSettings.guidelineChangeApplyMode = valStr;
      } else if (code === 'RECALCULATE_ON_CERTIFICATE_SAVE') {
        form.otherSettings.recalculateOnCertificateSave = valStr === 'true' || valStr === '1';
      } else if (code === 'RECALCULATE_ON_CERTIFICATE_DELETE') {
        form.otherSettings.recalculateOnCertificateDelete = valStr === 'true' || valStr === '1';
      } else if (code === 'ALLOW_FLOOR_WISE_CERTIFICATE_METADATA') {
        form.otherSettings.allowFloorWiseCertificateMetadata = valStr === 'true' || valStr === '1';
      } else if (code === 'FLOOR_POLICY_DISPLAY_RULE') {
        form.otherSettings.floorPolicyDisplayRule = valStr;
      }
    }
    
    // Also extract priority if stored as fields or guidelines
    const p1 = dto.find(item => item.guidelineCode === 'DATE_PRIORITY_1')?.guidelineValue;
    const p2 = dto.find(item => item.guidelineCode === 'DATE_PRIORITY_2')?.guidelineValue;
    const p3 = dto.find(item => item.guidelineCode === 'DATE_PRIORITY_3')?.guidelineValue;
    const p4 = dto.find(item => item.guidelineCode === 'DATE_PRIORITY_4')?.guidelineValue;
    if (p1) form.certificateDatePriority.priority1 = DTO_TO_PRIORITY[p1] ?? 'Select';
    if (p2) form.certificateDatePriority.priority2 = DTO_TO_PRIORITY[p2] ?? 'Select';
    if (p3) form.certificateDatePriority.priority3 = DTO_TO_PRIORITY[p3] ?? 'Select';
    if (p4) form.certificateDatePriority.priority4 = DTO_TO_PRIORITY[p4] ?? 'Select';
    
    return form;
  }

  // Fallback to flat DTO mapping
  form.generalSettings.enableCertificateBasedTax = dto.enableCertificateBasedTax ?? form.generalSettings.enableCertificateBasedTax;
  form.generalSettings.applyTaxOnlyForTaxableCertificateTypes = dto.applyOnlyTaxableCertificateTypes ?? dto.applyOnlyProtectedCertificateTypes ?? form.generalSettings.applyTaxOnlyForTaxableCertificateTypes;
  form.generalSettings.financialYearStart.month = dto.financialYearStartMonth !== undefined && dto.financialYearStartMonth !== null ? dto.financialYearStartMonth : form.generalSettings.financialYearStart.month;
  form.generalSettings.financialYearStart.day = dto.financialYearStartDay !== undefined && dto.financialYearStartDay !== null ? dto.financialYearStartDay : form.generalSettings.financialYearStart.day;
  form.generalSettings.certificateTaxScopeMode = dto.certificateTaxScopeMode ?? form.generalSettings.certificateTaxScopeMode;
  form.generalSettings.minimumBackdateFinancialYear = dto.minimumBackdateFinancialYear !== undefined ? dto.minimumBackdateFinancialYear : form.generalSettings.minimumBackdateFinancialYear;

  form.certificateDatePriority.priority1 = dto.datePriority1 ? (DTO_TO_PRIORITY[dto.datePriority1] ?? 'Select') : form.certificateDatePriority.priority1;
  form.certificateDatePriority.priority2 = dto.datePriority2 ? (DTO_TO_PRIORITY[dto.datePriority2] ?? 'Select') : form.certificateDatePriority.priority2;
  form.certificateDatePriority.priority3 = dto.datePriority3 ? (DTO_TO_PRIORITY[dto.datePriority3] ?? 'Select') : form.certificateDatePriority.priority3;
  form.certificateDatePriority.priority4 = dto.datePriority4 ? (DTO_TO_PRIORITY[dto.datePriority4] ?? 'Select') : form.certificateDatePriority.priority4;

  form.ccOcRules.applyCcToOcSplit = dto.enableCCToOCSplit ?? form.ccOcRules.applyCcToOcSplit;
  form.ccOcRules.ccOcDifferenceThreshold = dto.ignoreCCToOCIfWithinValue !== undefined ? dto.ignoreCCToOCIfWithinValue : form.ccOcRules.ccOcDifferenceThreshold;
  form.ccOcRules.ccOcDifferenceUnit = dto.ignoreCCToOCIfWithinType ? (DTO_TO_UNIT[dto.ignoreCCToOCIfWithinType] ?? 'Select') : form.ccOcRules.ccOcDifferenceUnit;
  form.ccOcRules.ccPeriodMultiplier = dto.ccPeriodMultiplier !== undefined ? dto.ccPeriodMultiplier : form.ccOcRules.ccPeriodMultiplier;
  form.ccOcRules.ocPeriodMultiplier = dto.ocPeriodMultiplier !== undefined ? dto.ocPeriodMultiplier : form.ccOcRules.ocPeriodMultiplier;
  form.ccOcRules.enableCurrentFyPartialPolicy = dto.enableCurrentFyPartialPolicy ?? form.ccOcRules.enableCurrentFyPartialPolicy;
  form.ccOcRules.ccPartialPolicyCode = dto.ccPartialPolicyCode ?? form.ccOcRules.ccPartialPolicyCode;
  form.ccOcRules.ocPartialPolicyCode = dto.ocPartialPolicyCode ?? form.ccOcRules.ocPartialPolicyCode;

  form.electricBillRules.electricBillDateRule = dto.electricBillDateRule ? (DTO_TO_EB_RULE[dto.electricBillDateRule] ?? 'Select') : form.electricBillRules.electricBillDateRule;
  form.electricBillRules.addMonthsToElectricBillDate = dto.electricBillAddMonths !== undefined ? dto.electricBillAddMonths : form.electricBillRules.addMonthsToElectricBillDate;
  form.electricBillRules.electricBillMultiplier = dto.electricBillMultiplier !== undefined ? dto.electricBillMultiplier : form.electricBillRules.electricBillMultiplier;
  form.electricBillRules.electricBillMinimumFinancialYear = dto.electricBillMinimumFinancialYear !== undefined ? dto.electricBillMinimumFinancialYear : form.electricBillRules.electricBillMinimumFinancialYear;
  form.electricBillRules.electricBillPartialPolicyCode = dto.electricBillPartialPolicyCode ?? form.electricBillRules.electricBillPartialPolicyCode;

  form.retrospectiveRules.enableRetrospectiveTax = dto.enableRetrospectiveTax ?? form.retrospectiveRules.enableRetrospectiveTax;
  form.retrospectiveRules.whenNoDateIsAvailable = dto.noDateRule ? (DTO_TO_NO_DATE_RULE[dto.noDateRule] ?? 'Select') : form.retrospectiveRules.whenNoDateIsAvailable;
  form.retrospectiveRules.lookbackYears = dto.lookbackYears !== undefined ? dto.lookbackYears : form.retrospectiveRules.lookbackYears;
  form.retrospectiveRules.defaultRetrospectiveMultiplier = dto.defaultRetrospectiveMultiplier !== undefined ? dto.defaultRetrospectiveMultiplier : form.retrospectiveRules.defaultRetrospectiveMultiplier;

  form.otherSettings.enableCurrentYearProration = dto.enableCurrentYearProration ?? form.otherSettings.enableCurrentYearProration;
  form.otherSettings.prorationType = dto.prorationMethod ? (DTO_TO_PRORATION[dto.prorationMethod] ?? 'Select') : form.otherSettings.prorationType;
  form.otherSettings.taxPersistenceMode = dto.taxPersistenceMode ? (DTO_TO_PERSISTENCE[dto.taxPersistenceMode] ?? 'Select') : form.otherSettings.taxPersistenceMode;
  form.otherSettings.doNotUpdateNettax = dto.doNotUpdateNettax ?? form.otherSettings.doNotUpdateNettax;
  form.otherSettings.guidelineChangeApplyMode = dto.guidelineChangeApplyMode ?? form.otherSettings.guidelineChangeApplyMode;
  form.otherSettings.recalculateOnCertificateSave = dto.recalculateOnCertificateSave ?? form.otherSettings.recalculateOnCertificateSave;
  form.otherSettings.recalculateOnCertificateDelete = dto.recalculateOnCertificateDelete ?? form.otherSettings.recalculateOnCertificateDelete;
  form.otherSettings.allowFloorWiseCertificateMetadata = dto.allowFloorWiseCertificateMetadata ?? form.otherSettings.allowFloorWiseCertificateMetadata;
  form.otherSettings.floorPolicyDisplayRule = dto.floorPolicyDisplayRule ?? form.otherSettings.floorPolicyDisplayRule;

  form.dynamicGuidelines = generateDefaultDynamicGuidelines(form);

  return form;
}

/** Convert UI form data → API DTO payload, preserving unchanged keys from baseDto */
export function mapFormDataToDto(
  formData: TaxCalculationGuidelineFormData,
  baseDto?: TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[] | null
): TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[] {
  // If baseDto is an array or if we are in dynamic guideline list mode
  if (Array.isArray(baseDto) || (formData.dynamicGuidelines && formData.dynamicGuidelines.length > 0)) {
    const list = Array.isArray(baseDto) ? [...baseDto] : [...(formData.dynamicGuidelines || [])];
    
    const updateOrAddGuideline = (code: string, valueStr: string | null) => {
      const idx = list.findIndex(item => item.guidelineCode === code);
      if (idx > -1) {
        list[idx] = { ...list[idx], guidelineValue: valueStr };
      } else {
        list.push({
          guidelineCode: code,
          guidelineName: code.replace(/_/g, ' '),
          guidelineValue: valueStr,
          isActive: true
        });
      }
    };

    updateOrAddGuideline('ENABLE_CERTIFICATE_BASED_TAX', String(formData.generalSettings.enableCertificateBasedTax));
    updateOrAddGuideline('APPLY_ONLY_TAXABLE_CERT_TYPES', String(formData.generalSettings.applyTaxOnlyForTaxableCertificateTypes));
    updateOrAddGuideline('FINANCIAL_YEAR_START_MONTH', formData.generalSettings.financialYearStart.month === 'Select' ? null : String(formData.generalSettings.financialYearStart.month));
    updateOrAddGuideline('FINANCIAL_YEAR_START_DAY', formData.generalSettings.financialYearStart.day === 'Select' ? null : String(formData.generalSettings.financialYearStart.day));
    updateOrAddGuideline('MINIMUM_BACKDATE_FINANCIAL_YEAR', formData.generalSettings.minimumBackdateFinancialYear !== undefined ? String(formData.generalSettings.minimumBackdateFinancialYear) : null);
    updateOrAddGuideline('CERTIFICATE_TAX_SCOPE_MODE', formData.generalSettings.certificateTaxScopeMode === 'Select' ? null : (formData.generalSettings.certificateTaxScopeMode || null));

    updateOrAddGuideline('ENABLE_CC_TO_OC_SPLIT', String(formData.ccOcRules.applyCcToOcSplit));
    updateOrAddGuideline('IGNORE_CC_TO_OC_IF_WITHIN_VALUE', formData.ccOcRules.ccOcDifferenceThreshold !== undefined ? String(formData.ccOcRules.ccOcDifferenceThreshold) : null);
    updateOrAddGuideline('IGNORE_CC_TO_OC_IF_WITHIN_TYPE', formData.ccOcRules.ccOcDifferenceUnit === 'Select' ? null : (UNIT_TO_DTO[formData.ccOcRules.ccOcDifferenceUnit] ?? formData.ccOcRules.ccOcDifferenceUnit ?? 'MONTHS'));
    updateOrAddGuideline('CC_PERIOD_MULTIPLIER', formData.ccOcRules.ccPeriodMultiplier !== undefined ? String(formData.ccOcRules.ccPeriodMultiplier) : null);
    updateOrAddGuideline('OC_PERIOD_MULTIPLIER', formData.ccOcRules.ocPeriodMultiplier !== undefined ? String(formData.ccOcRules.ocPeriodMultiplier) : null);
    updateOrAddGuideline('ENABLE_CURRENT_FY_PARTIAL_POLICY', String(formData.ccOcRules.enableCurrentFyPartialPolicy || false));
    updateOrAddGuideline('CC_PARTIAL_POLICY_CODE', formData.ccOcRules.ccPartialPolicyCode === 'Select' ? null : (formData.ccOcRules.ccPartialPolicyCode || null));
    updateOrAddGuideline('OC_PARTIAL_POLICY_CODE', formData.ccOcRules.ocPartialPolicyCode === 'Select' ? null : (formData.ccOcRules.ocPartialPolicyCode || null));

    updateOrAddGuideline('ELECTRIC_BILL_DATE_RULE', EB_RULE_TO_DTO[formData.electricBillRules.electricBillDateRule] ?? formData.electricBillRules.electricBillDateRule ?? 'FROM_FY_START');
    updateOrAddGuideline('ELECTRIC_BILL_ADD_MONTHS', formData.electricBillRules.addMonthsToElectricBillDate !== undefined ? String(formData.electricBillRules.addMonthsToElectricBillDate) : null);
    updateOrAddGuideline('ELECTRIC_BILL_MULTIPLIER', formData.electricBillRules.electricBillMultiplier !== undefined ? String(formData.electricBillRules.electricBillMultiplier) : null);
    updateOrAddGuideline('ELECTRIC_BILL_MINIMUM_FINANCIAL_YEAR', formData.electricBillRules.electricBillMinimumFinancialYear !== undefined ? String(formData.electricBillRules.electricBillMinimumFinancialYear) : null);
    updateOrAddGuideline('ELECTRIC_BILL_PARTIAL_POLICY_CODE', formData.electricBillRules.electricBillPartialPolicyCode === 'Select' ? null : (formData.electricBillRules.electricBillPartialPolicyCode || null));

    updateOrAddGuideline('ENABLE_RETROSPECTIVE_TAX', String(formData.retrospectiveRules.enableRetrospectiveTax || false));
    updateOrAddGuideline('NO_DATE_RULE', NO_DATE_RULE_TO_DTO[formData.retrospectiveRules.whenNoDateIsAvailable] ?? formData.retrospectiveRules.whenNoDateIsAvailable ?? 'DEFAULT_RETROSPECTIVE');
    updateOrAddGuideline('LOOKBACK_YEARS', formData.retrospectiveRules.lookbackYears !== undefined ? String(formData.retrospectiveRules.lookbackYears) : null);
    updateOrAddGuideline('DEFAULT_RETROSPECTIVE_MULTIPLIER', formData.retrospectiveRules.defaultRetrospectiveMultiplier !== undefined ? String(formData.retrospectiveRules.defaultRetrospectiveMultiplier) : null);

    updateOrAddGuideline('ENABLE_CURRENT_YEAR_PRORATION', String(formData.otherSettings.enableCurrentYearProration));
    updateOrAddGuideline('PRORATION_METHOD', PRORATION_TO_DTO[formData.otherSettings.prorationType] ?? formData.otherSettings.prorationType ?? 'MONTHLY');
    updateOrAddGuideline('TAX_PERSISTENCE_MODE', PERSISTENCE_TO_DTO[formData.otherSettings.taxPersistenceMode] ?? formData.otherSettings.taxPersistenceMode ?? 'PROPERTY_AGGREGATED');
    updateOrAddGuideline('DO_NOT_UPDATE_NETTAX', String(formData.otherSettings.doNotUpdateNettax || false));
    updateOrAddGuideline('GUIDELINE_CHANGE_APPLY_MODE', formData.otherSettings.guidelineChangeApplyMode === 'Select' ? null : (formData.otherSettings.guidelineChangeApplyMode || null));
    updateOrAddGuideline('RECALCULATE_ON_CERTIFICATE_SAVE', String(formData.otherSettings.recalculateOnCertificateSave || false));
    updateOrAddGuideline('RECALCULATE_ON_CERTIFICATE_DELETE', String(formData.otherSettings.recalculateOnCertificateDelete || false));
    updateOrAddGuideline('ALLOW_FLOOR_WISE_CERTIFICATE_METADATA', String(formData.otherSettings.allowFloorWiseCertificateMetadata || false));
    updateOrAddGuideline('FLOOR_POLICY_DISPLAY_RULE', formData.otherSettings.floorPolicyDisplayRule === 'Select' ? null : (formData.otherSettings.floorPolicyDisplayRule || null));

    updateOrAddGuideline('DATE_PRIORITY_1', PRIORITY_TO_DTO[formData.certificateDatePriority.priority1]);
    updateOrAddGuideline('DATE_PRIORITY_2', PRIORITY_TO_DTO[formData.certificateDatePriority.priority2]);
    updateOrAddGuideline('DATE_PRIORITY_3', PRIORITY_TO_DTO[formData.certificateDatePriority.priority3]);
    updateOrAddGuideline('DATE_PRIORITY_4', PRIORITY_TO_DTO[formData.certificateDatePriority.priority4]);

    // ── Pass-through: flush any remaining dynamic guideline values that are not
    //    explicitly mapped above (e.g. CC_OC_GAP_WITHIN_ACTION, INVALID_CC_OC_DATE_ORDER_ACTION,
    //    retrospective extra fields, etc.) so their current values are preserved on save.
    const explicitlyCovered = new Set([
      'ENABLE_CERTIFICATE_BASED_TAX', 'APPLY_ONLY_TAXABLE_CERT_TYPES',
      'FINANCIAL_YEAR_START_MONTH', 'FINANCIAL_YEAR_START_DAY',
      'MINIMUM_BACKDATE_FINANCIAL_YEAR', 'CERTIFICATE_TAX_SCOPE_MODE',
      'ENABLE_CC_TO_OC_SPLIT', 'IGNORE_CC_TO_OC_IF_WITHIN_VALUE', 'IGNORE_CC_TO_OC_IF_WITHIN_TYPE',
      'CC_PERIOD_MULTIPLIER', 'OC_PERIOD_MULTIPLIER',
      'ENABLE_CURRENT_FY_PARTIAL_POLICY', 'CC_PARTIAL_POLICY_CODE', 'OC_PARTIAL_POLICY_CODE',
      'ELECTRIC_BILL_DATE_RULE', 'ELECTRIC_BILL_ADD_MONTHS', 'ELECTRIC_BILL_MULTIPLIER',
      'ELECTRIC_BILL_MINIMUM_FINANCIAL_YEAR', 'ELECTRIC_BILL_PARTIAL_POLICY_CODE',
      'ENABLE_RETROSPECTIVE_TAX', 'NO_DATE_RULE', 'LOOKBACK_YEARS', 'DEFAULT_RETROSPECTIVE_MULTIPLIER',
      'ENABLE_CURRENT_YEAR_PRORATION', 'PRORATION_METHOD', 'TAX_PERSISTENCE_MODE',
      'DO_NOT_UPDATE_NETTAX', 'GUIDELINE_CHANGE_APPLY_MODE',
      'RECALCULATE_ON_CERTIFICATE_SAVE', 'RECALCULATE_ON_CERTIFICATE_DELETE',
      'ALLOW_FLOOR_WISE_CERTIFICATE_METADATA', 'FLOOR_POLICY_DISPLAY_RULE',
      'DATE_PRIORITY_1', 'DATE_PRIORITY_2', 'DATE_PRIORITY_3', 'DATE_PRIORITY_4',
    ]);

    for (const dg of (formData.dynamicGuidelines || [])) {
      if (dg.guidelineCode && !explicitlyCovered.has(dg.guidelineCode)) {
        updateOrAddGuideline(dg.guidelineCode, dg.guidelineValue ?? null);
      }
    }

    return list;
  }

  // Fallback to flat DTO mapping
  const baseObj = (baseDto && !Array.isArray(baseDto)) ? baseDto : {} as TaxCalculationGuidelineDto;
  return {
    ...baseObj,
    guidelineCode: baseObj.guidelineCode || 'DEFAULT',
    guidelineName: baseObj.guidelineName || 'Default CC OC Electric Bill Tax Guideline',
    description: baseObj.description || 'Default guideline for CC, OC, Electric Bill and retrospective tax calculation.',
    floorCertificatePriority: baseObj.floorCertificatePriority || 'FLOOR_OVERRIDES_PROPERTY',
    remark: baseObj.remark || 'Initial configuration settings.',
    isActive: baseObj.isActive !== false,
    enableCertificateBasedTax: formData.generalSettings.enableCertificateBasedTax,
    applyOnlyProtectedCertificateTypes: formData.generalSettings.applyTaxOnlyForTaxableCertificateTypes,
    applyOnlyTaxableCertificateTypes: formData.generalSettings.applyTaxOnlyForTaxableCertificateTypes,
    financialYearStartMonth: formData.generalSettings.financialYearStart.month === 'Select' ? null : Number(formData.generalSettings.financialYearStart.month),
    financialYearStartDay: formData.generalSettings.financialYearStart.day === 'Select' ? null : Number(formData.generalSettings.financialYearStart.day),
    minimumBackdateFinancialYear: formData.generalSettings.minimumBackdateFinancialYear,
    certificateTaxScopeMode: formData.generalSettings.certificateTaxScopeMode === 'Select' ? null : (formData.generalSettings.certificateTaxScopeMode || null),
    datePriority1: PRIORITY_TO_DTO[formData.certificateDatePriority.priority1],
    datePriority2: PRIORITY_TO_DTO[formData.certificateDatePriority.priority2],
    datePriority3: PRIORITY_TO_DTO[formData.certificateDatePriority.priority3],
    datePriority4: PRIORITY_TO_DTO[formData.certificateDatePriority.priority4],
    enableCCToOCSplit: formData.ccOcRules.applyCcToOcSplit,
    ignoreCCToOCIfWithinValue: formData.ccOcRules.ccOcDifferenceThreshold,
    ignoreCCToOCIfWithinType: UNIT_TO_DTO[formData.ccOcRules.ccOcDifferenceUnit] ?? formData.ccOcRules.ccOcDifferenceUnit ?? 'MONTHS',
    ccPeriodMultiplier: formData.ccOcRules.ccPeriodMultiplier,
    ocPeriodMultiplier: formData.ccOcRules.ocPeriodMultiplier,
    enableCurrentFyPartialPolicy: formData.ccOcRules.enableCurrentFyPartialPolicy,
    ccPartialPolicyCode: formData.ccOcRules.ccPartialPolicyCode === 'Select' ? null : (formData.ccOcRules.ccPartialPolicyCode || null),
    ocPartialPolicyCode: formData.ccOcRules.ocPartialPolicyCode === 'Select' ? null : (formData.ccOcRules.ocPartialPolicyCode || null),
    electricBillDateRule: EB_RULE_TO_DTO[formData.electricBillRules.electricBillDateRule] ?? formData.electricBillRules.electricBillDateRule ?? 'FROM_FY_START',
    electricBillAddMonths: formData.electricBillRules.addMonthsToElectricBillDate,
    electricBillMultiplier: formData.electricBillRules.electricBillMultiplier,
    electricBillMinimumFinancialYear: formData.electricBillRules.electricBillMinimumFinancialYear,
    electricBillPartialPolicyCode: formData.electricBillRules.electricBillPartialPolicyCode === 'Select' ? null : (formData.electricBillRules.electricBillPartialPolicyCode || null),
    enableRetrospectiveTax: formData.retrospectiveRules.enableRetrospectiveTax,
    noDateRule: NO_DATE_RULE_TO_DTO[formData.retrospectiveRules.whenNoDateIsAvailable] ?? formData.retrospectiveRules.whenNoDateIsAvailable ?? 'DEFAULT_RETROSPECTIVE',
    lookbackYears: formData.retrospectiveRules.lookbackYears,
    defaultRetrospectiveMultiplier: formData.retrospectiveRules.defaultRetrospectiveMultiplier,
    enableCurrentYearProration: formData.otherSettings.enableCurrentYearProration,
    prorationMethod: PRORATION_TO_DTO[formData.otherSettings.prorationType] ?? formData.otherSettings.prorationType ?? 'MONTHLY',
    taxPersistenceMode: PERSISTENCE_TO_DTO[formData.otherSettings.taxPersistenceMode] ?? formData.otherSettings.taxPersistenceMode ?? 'PROPERTY_AGGREGATED',
    doNotUpdateNettax: formData.otherSettings.doNotUpdateNettax,
    guidelineChangeApplyMode: formData.otherSettings.guidelineChangeApplyMode === 'Select' ? null : (formData.otherSettings.guidelineChangeApplyMode || null),
    recalculateOnCertificateSave: formData.otherSettings.recalculateOnCertificateSave,
    recalculateOnCertificateDelete: formData.otherSettings.recalculateOnCertificateDelete,
    allowFloorWiseCertificateMetadata: formData.otherSettings.allowFloorWiseCertificateMetadata,
    floorPolicyDisplayRule: formData.otherSettings.floorPolicyDisplayRule === 'Select' ? null : (formData.otherSettings.floorPolicyDisplayRule || null),
  };
}

export const FIELD_MAPPINGS: Record<string, {
  section: string;
  field: string;
  type: string;
}> = {
  // General Settings
  'ENABLE_CERTIFICATE_BASED_TAX': { section: 'generalSettings', field: 'enableCertificateBasedTax', type: 'boolean' },
  'APPLY_ONLY_TAXABLE_CERT_TYPES': { section: 'generalSettings', field: 'applyTaxOnlyForTaxableCertificateTypes', type: 'boolean' },
  'FINANCIAL_YEAR_START_MONTH': { section: 'generalSettings', field: 'financialYearStart.month', type: 'month' },
  'FINANCIAL_YEAR_START_DAY': { section: 'generalSettings', field: 'financialYearStart.day', type: 'day' },
  'MINIMUM_BACKDATE_FINANCIAL_YEAR': { section: 'generalSettings', field: 'minimumBackdateFinancialYear', type: 'number' },
  'CERTIFICATE_TAX_SCOPE_MODE': { section: 'generalSettings', field: 'certificateTaxScopeMode', type: 'string' },

  // Date Priority Rules
  'DATE_PRIORITY_1': { section: 'certificateDatePriority', field: 'priority1', type: 'priority' },
  'DATE_PRIORITY_2': { section: 'certificateDatePriority', field: 'priority2', type: 'priority' },
  'DATE_PRIORITY_3': { section: 'certificateDatePriority', field: 'priority3', type: 'priority' },
  'DATE_PRIORITY_4': { section: 'certificateDatePriority', field: 'priority4', type: 'priority' },

  // CC & OC Rules
  'ENABLE_CC_TO_OC_SPLIT': { section: 'ccOcRules', field: 'applyCcToOcSplit', type: 'boolean' },
  'IGNORE_CC_TO_OC_IF_WITHIN_VALUE': { section: 'ccOcRules', field: 'ccOcDifferenceThreshold', type: 'number' },
  'IGNORE_CC_TO_OC_IF_WITHIN_TYPE': { section: 'ccOcRules', field: 'ccOcDifferenceUnit', type: 'unit' },
  'CC_PERIOD_MULTIPLIER': { section: 'ccOcRules', field: 'ccPeriodMultiplier', type: 'number' },
  'OC_PERIOD_MULTIPLIER': { section: 'ccOcRules', field: 'ocPeriodMultiplier', type: 'number' },
  'ENABLE_CURRENT_FY_PARTIAL_POLICY': { section: 'ccOcRules', field: 'enableCurrentFyPartialPolicy', type: 'boolean' },
  'CC_PARTIAL_POLICY_CODE': { section: 'ccOcRules', field: 'ccPartialPolicyCode', type: 'string' },
  'OC_PARTIAL_POLICY_CODE': { section: 'ccOcRules', field: 'ocPartialPolicyCode', type: 'string' },

  // Electric Bill Rules
  'ELECTRIC_BILL_DATE_RULE': { section: 'electricBillRules', field: 'electricBillDateRule', type: 'ebRule' },
  'ELECTRIC_BILL_ADD_MONTHS': { section: 'electricBillRules', field: 'addMonthsToElectricBillDate', type: 'number' },
  'ELECTRIC_BILL_MULTIPLIER': { section: 'electricBillRules', field: 'electricBillMultiplier', type: 'number' },
  'ELECTRIC_BILL_MINIMUM_FINANCIAL_YEAR': { section: 'electricBillRules', field: 'electricBillMinimumFinancialYear', type: 'number' },
  'ELECTRIC_BILL_PARTIAL_POLICY_CODE': { section: 'electricBillRules', field: 'electricBillPartialPolicyCode', type: 'string' },

  // Retrospective Rules
  'ENABLE_RETROSPECTIVE_TAX': { section: 'retrospectiveRules', field: 'enableRetrospectiveTax', type: 'boolean' },
  'NO_DATE_RULE': { section: 'retrospectiveRules', field: 'whenNoDateIsAvailable', type: 'noDateRule' },
  'LOOKBACK_YEARS': { section: 'retrospectiveRules', field: 'lookbackYears', type: 'number' },
  'DEFAULT_RETROSPECTIVE_MULTIPLIER': { section: 'retrospectiveRules', field: 'defaultRetrospectiveMultiplier', type: 'number' },

  // Other Settings
  'ENABLE_CURRENT_YEAR_PRORATION': { section: 'otherSettings', field: 'enableCurrentYearProration', type: 'boolean' },
  'PRORATION_METHOD': { section: 'otherSettings', field: 'prorationType', type: 'proration' },
  'TAX_PERSISTENCE_MODE': { section: 'otherSettings', field: 'taxPersistenceMode', type: 'persistence' },
  'DO_NOT_UPDATE_NETTAX': { section: 'otherSettings', field: 'doNotUpdateNettax', type: 'boolean' },
  'GUIDELINE_CHANGE_APPLY_MODE': { section: 'otherSettings', field: 'guidelineChangeApplyMode', type: 'string' },
  'RECALCULATE_ON_CERTIFICATE_SAVE': { section: 'otherSettings', field: 'recalculateOnCertificateSave', type: 'boolean' },
  'RECALCULATE_ON_CERTIFICATE_DELETE': { section: 'otherSettings', field: 'recalculateOnCertificateDelete', type: 'boolean' },
  'ALLOW_FLOOR_WISE_CERTIFICATE_METADATA': { section: 'otherSettings', field: 'allowFloorWiseCertificateMetadata', type: 'boolean' },
  'FLOOR_POLICY_DISPLAY_RULE': { section: 'otherSettings', field: 'floorPolicyDisplayRule', type: 'string' }
};

/** Build initial form data from an API DTO (or defaults when dto is null). */
export function buildInitialFormData(dto: TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[] | null): TaxCalculationGuidelineFormData {
  if (!dto) {
    const form = JSON.parse(JSON.stringify(DEFAULT_TAX_GUIDELINE_FORM)) as TaxCalculationGuidelineFormData;
    form.dynamicGuidelines = generateDefaultDynamicGuidelines(form);
    return form;
  }
  const form = mapDtoToFormData(dto);
  if (!form.dynamicGuidelines || form.dynamicGuidelines.length === 0) {
    form.dynamicGuidelines = generateDefaultDynamicGuidelines(form);
  }
  return form;
}

export function generateDefaultDynamicGuidelines(form: TaxCalculationGuidelineFormData): TaxCalculationGuidelineDto[] {
  const list: TaxCalculationGuidelineDto[] = [];
  
  const meta: Record<string, { group: string; displayOrder: number; dataType: 'BIT' | 'INT' | 'DECIMAL' | 'VARCHAR'; allowedValues?: string; name: string }> = {
    // GENERAL SETTINGS
    'ENABLE_CERTIFICATE_BASED_TAX': { group: 'GENERAL', displayOrder: 1, dataType: 'BIT', name: 'Enable Certificate Based Tax' },
    'APPLY_ONLY_TAXABLE_CERT_TYPES': { group: 'GENERAL', displayOrder: 2, dataType: 'BIT', name: 'Apply Tax Only For Taxable Certificate Types' },
    'FINANCIAL_YEAR_START_MONTH': { group: 'GENERAL', displayOrder: 3, dataType: 'INT', name: 'Financial Year Start Month', allowedValues: '1-12' },
    'FINANCIAL_YEAR_START_DAY': { group: 'GENERAL', displayOrder: 4, dataType: 'INT', name: 'Financial Year Start Day', allowedValues: '1-31' },
    'MINIMUM_BACKDATE_FINANCIAL_YEAR': { group: 'GENERAL', displayOrder: 5, dataType: 'INT', name: 'Minimum Backdate Financial Year' },
    'CERTIFICATE_TAX_SCOPE_MODE': { group: 'SCOPE', displayOrder: 1, dataType: 'VARCHAR', name: 'Certificate Tax Scope Mode', allowedValues: 'PROPERTY_WISE,FLOOR_WISE' },
    'ALLOW_FLOOR_WISE_CERTIFICATE_METADATA': { group: 'SCOPE', displayOrder: 2, dataType: 'BIT', name: 'Allow Floor Wise Certificate Metadata' },
    'FLOOR_POLICY_DISPLAY_RULE': { group: 'SCOPE', displayOrder: 3, dataType: 'VARCHAR', name: 'Floor Policy Display Rule', allowedValues: 'BIGGEST_AREA_FLOOR_POLICY,PROPERTY_POLICY_ONLY' },

    // DATE PRIORITY
    'DATE_PRIORITY_1': { group: 'DATE_PRIORITY', displayOrder: 1, dataType: 'VARCHAR', name: '1st Priority', allowedValues: 'CC,OC,ELECTRIC_BILL,RETROSPECTIVE' },
    'DATE_PRIORITY_2': { group: 'DATE_PRIORITY', displayOrder: 2, dataType: 'VARCHAR', name: '2nd Priority', allowedValues: 'CC,OC,ELECTRIC_BILL,RETROSPECTIVE' },
    'DATE_PRIORITY_3': { group: 'DATE_PRIORITY', displayOrder: 3, dataType: 'VARCHAR', name: '3rd Priority', allowedValues: 'CC,OC,ELECTRIC_BILL,RETROSPECTIVE' },
    'DATE_PRIORITY_4': { group: 'DATE_PRIORITY', displayOrder: 4, dataType: 'VARCHAR', name: '4th Priority', allowedValues: 'CC,OC,ELECTRIC_BILL,RETROSPECTIVE' },

    // CERTIFICATE VALIDATION
    'CERTIFICATE_REQUIRE_NO_AND_DATE': { group: 'VALIDATION', displayOrder: 1, dataType: 'BIT', name: 'Certificate Requires Number And Date' },
    'MISSING_CERTIFICATE_NO_ACTION': { group: 'VALIDATION', displayOrder: 2, dataType: 'VARCHAR', name: 'Missing Certificate Number Action', allowedValues: 'IGNORE_FOR_TAX,REJECT' },
    'MISSING_CERTIFICATE_DATE_ACTION': { group: 'VALIDATION', displayOrder: 3, dataType: 'VARCHAR', name: 'Missing Certificate Date Action', allowedValues: 'IGNORE_FOR_TAX,REJECT' },

    // CC & OC RULES
    'ENABLE_CC_TO_OC_SPLIT': { group: 'CC_OC', displayOrder: 1, dataType: 'BIT', name: 'Apply CC To OC Split' },
    'IGNORE_CC_TO_OC_IF_WITHIN_VALUE': { group: 'CC_OC', displayOrder: 2, dataType: 'INT', name: 'CC - OC Difference Value' },
    'IGNORE_CC_TO_OC_IF_WITHIN_TYPE': { group: 'CC_OC', displayOrder: 3, dataType: 'VARCHAR', name: 'CC - OC Difference Unit', allowedValues: 'DAYS,MONTHS,YEARS' },
    'CC_OC_GAP_COMPARISON': { group: 'CC_OC', displayOrder: 4, dataType: 'VARCHAR', name: 'CC/OC Gap Comparison', allowedValues: 'LESS_THAN,LESS_THAN_OR_EQUAL' },
    'CC_OC_GAP_WITHIN_ACTION': { group: 'CC_OC', displayOrder: 5, dataType: 'VARCHAR', name: 'Gap Within Action', allowedValues: 'APPLY_OC_ONLY,APPLY_CC_AND_OC,APPLY_CC_THEN_OC' },
    'CC_OC_GAP_EXCEEDED_ACTION': { group: 'CC_OC', displayOrder: 6, dataType: 'VARCHAR', name: 'Gap Exceeded Action', allowedValues: 'APPLY_OC_ONLY,APPLY_CC_AND_OC,APPLY_CC_THEN_OC' },
    'INVALID_CC_OC_DATE_ORDER_ACTION': { group: 'CC_OC', displayOrder: 7, dataType: 'VARCHAR', name: 'Invalid CC/OC Date Order Action', allowedValues: 'REJECT,USE_PRIORITY_AND_LOG,IGNORE_INVALID_DATE' },
    
    // CC RULES
    'CC_ONLY_ACTION': { group: 'CC', displayOrder: 1, dataType: 'VARCHAR', name: 'CC Only Action', allowedValues: 'APPLY_FROM_CC_DATE,NO_TAX' },
    'CC_DATE_RULE': { group: 'CC', displayOrder: 2, dataType: 'VARCHAR', name: 'CC Date Rule', allowedValues: 'EXACT_DATE,FROM_FY_START,NO_TAX' },
    'CC_PERIOD_MULTIPLIER': { group: 'CC', displayOrder: 3, dataType: 'DECIMAL', name: 'CC Period Multiplier' },

    // OC RULES
    'OC_ONLY_ACTION': { group: 'OC', displayOrder: 1, dataType: 'VARCHAR', name: 'OC Only Action', allowedValues: 'APPLY_FROM_OC_DATE,NO_TAX' },
    'OC_DATE_RULE': { group: 'OC', displayOrder: 2, dataType: 'VARCHAR', name: 'OC Date Rule', allowedValues: 'EXACT_DATE,FROM_FY_START,NO_TAX' },
    'OC_PERIOD_MULTIPLIER': { group: 'OC', displayOrder: 3, dataType: 'DECIMAL', name: 'OC Period Multiplier' },

    // PARTIAL POLICY CODES
    'ENABLE_CURRENT_FY_PARTIAL_POLICY': { group: 'PARTIAL_POLICY', displayOrder: 1, dataType: 'BIT', name: 'Enable Current FY Partial Policy' },
    'CC_PARTIAL_POLICY_CODE': { group: 'PARTIAL_POLICY', displayOrder: 2, dataType: 'VARCHAR', name: 'CC Partial Policy Code' },
    'CC_FULL_POLICY_CODE': { group: 'PARTIAL_POLICY', displayOrder: 3, dataType: 'VARCHAR', name: 'CC Full Policy Code' },
    'OC_PARTIAL_POLICY_CODE': { group: 'PARTIAL_POLICY', displayOrder: 4, dataType: 'VARCHAR', name: 'OC Partial Policy Code' },
    'OC_FULL_POLICY_CODE': { group: 'PARTIAL_POLICY', displayOrder: 5, dataType: 'VARCHAR', name: 'OC Full Policy Code' },
    'ELECTRIC_BILL_PARTIAL_POLICY_CODE': { group: 'PARTIAL_POLICY', displayOrder: 6, dataType: 'VARCHAR', name: 'Electric Bill Partial Policy Code' },
    'ELECTRIC_BILL_FULL_POLICY_CODE': { group: 'PARTIAL_POLICY', displayOrder: 7, dataType: 'VARCHAR', name: 'Electric Bill Full Policy Code' },

    // ELECTRIC BILL RULES
    'ELECTRIC_BILL_CERTIFICATE_CODES': { group: 'ELECTRIC_BILL', displayOrder: 1, dataType: 'VARCHAR', name: 'Electric Bill Certificate Codes' },
    'ELECTRIC_BILL_DATE_RULE': { group: 'ELECTRIC_BILL', displayOrder: 2, dataType: 'VARCHAR', name: 'Electric Bill Date Rule', allowedValues: 'NO_TAX,ADD_MONTHS,FROM_FY_START,EXACT_DATE' },
    'ELECTRIC_BILL_ADD_MONTHS': { group: 'ELECTRIC_BILL', displayOrder: 3, dataType: 'INT', name: 'Add Months To Electric Bill Date' },
    'ELECTRIC_BILL_MULTIPLIER': { group: 'ELECTRIC_BILL', displayOrder: 4, dataType: 'DECIMAL', name: 'Electric Bill Multiplier' },
    'ELECTRIC_BILL_MINIMUM_FINANCIAL_YEAR': { group: 'ELECTRIC_BILL', displayOrder: 5, dataType: 'INT', name: 'Electric Bill Minimum Financial Year' },

    // RETROSPECTIVE / NO DATE RULES
    'ENABLE_RETROSPECTIVE_TAX': { group: 'RETROSPECTIVE', displayOrder: 1, dataType: 'BIT', name: 'Enable Retrospective Tax' },
    'NO_DATE_RULE': { group: 'RETROSPECTIVE', displayOrder: 2, dataType: 'VARCHAR', name: 'When No Date Is Available', allowedValues: 'NO_TAX,DEFAULT_RETROSPECTIVE,ASSESSMENT_YEAR,CONSTRUCTION_YEAR' },
    'NO_DATE_LOOKBACK_YEARS': { group: 'RETROSPECTIVE', displayOrder: 3, dataType: 'INT', name: 'Lookback Years' },
    'RETROSPECTIVE_CURRENT_YEAR_COUNT': { group: 'RETROSPECTIVE', displayOrder: 4, dataType: 'INT', name: 'Retrospective Current Year Count' },
    'RETROSPECTIVE_PENDING_YEAR_COUNT_MODE': { group: 'RETROSPECTIVE', displayOrder: 5, dataType: 'VARCHAR', name: 'Retrospective Pending Year Count Mode', allowedValues: 'TOTAL_MINUS_CURRENT' },
    'NO_DATE_RETROSPECTIVE_MULTIPLIER': { group: 'RETROSPECTIVE', displayOrder: 6, dataType: 'DECIMAL', name: 'Default Retrospective Multiplier' },

    // PRORATION RULES
    'ENABLE_CURRENT_YEAR_PRORATION': { group: 'PRORATION', displayOrder: 1, dataType: 'BIT', name: 'Enable Current Year Proration' },
    'PRORATION_METHOD': { group: 'PRORATION', displayOrder: 2, dataType: 'VARCHAR', name: 'Proration Method', allowedValues: 'DAILY,MONTHLY,FULL_YEAR' },
    'CURRENT_YEAR_PRORATION_START_RULE': { group: 'PRORATION', displayOrder: 3, dataType: 'VARCHAR', name: 'Current Year Proration Start Rule', allowedValues: 'EXACT_DATE,MONTH_START,FULL_YEAR' },

    // PERSISTENCE SETTINGS
    'TAX_PERSISTENCE_MODE': { group: 'PERSISTENCE', displayOrder: 1, dataType: 'VARCHAR', name: 'Tax Persistence Mode', allowedValues: 'PROPERTY_AGGREGATED' },
    'SAVE_CERTIFICATE_TAX_IN_POLICY_TAX_DETAILS': { group: 'PERSISTENCE', displayOrder: 2, dataType: 'BIT', name: 'Save Certificate Tax In PolicyTaxDetails' },
    'SAVE_CERTIFICATE_TAX_IN_TRANSMAST': { group: 'PERSISTENCE', displayOrder: 3, dataType: 'BIT', name: 'Save Certificate Tax In TransMast' },
    'DO_NOT_UPDATE_NETTAX': { group: 'PERSISTENCE', displayOrder: 4, dataType: 'BIT', name: 'Do Not Update NETTAX' },

    // RECALCULATION SETTINGS
    'RECALCULATE_ON_CERTIFICATE_SAVE': { group: 'RECALCULATION', displayOrder: 1, dataType: 'BIT', name: 'Recalculate On Certificate Save' },
    'RECALCULATE_ON_CERTIFICATE_DELETE': { group: 'RECALCULATION', displayOrder: 2, dataType: 'BIT', name: 'Recalculate On Certificate Delete' },
    'GUIDELINE_CHANGE_APPLY_MODE': { group: 'RECALCULATION', displayOrder: 3, dataType: 'VARCHAR', name: 'Guideline Change Apply Mode', allowedValues: 'NEXT_CALCULATION,MANUAL_RECALCULATION,AUTO_RECALCULATION' }
  };

  for (const [code, info] of Object.entries(meta)) {
    let rawVal: unknown = null;
    
    const mapping = FIELD_MAPPINGS[code];
    if (mapping) {
      if (mapping.field.includes('.')) {
        const [f1, f2] = mapping.field.split('.');
        const secVal = (form[mapping.section as keyof TaxCalculationGuidelineFormData] as unknown) as Record<string, Record<string, unknown>>;
        rawVal = secVal[f1]?.[f2];
      } else {
        const secVal = (form[mapping.section as keyof TaxCalculationGuidelineFormData] as unknown) as Record<string, unknown>;
        rawVal = secVal[mapping.field];
      }
    }

    let valueStr: string | null = null;
    if (rawVal !== undefined && rawVal !== null && rawVal !== 'Select' && rawVal !== '') {
      if (mapping && mapping.type === 'priority') {
        valueStr = PRIORITY_TO_DTO[rawVal as DatePriorityOption];
      } else if (mapping && mapping.type === 'ebRule') {
        valueStr = EB_RULE_TO_DTO[rawVal as ElectricBillDateRule];
      } else if (mapping && mapping.type === 'noDateRule') {
        valueStr = NO_DATE_RULE_TO_DTO[rawVal as NoDateRule];
      } else if (mapping && mapping.type === 'unit') {
        valueStr = UNIT_TO_DTO[rawVal as DurationUnit];
      } else if (mapping && mapping.type === 'proration') {
        valueStr = PRORATION_TO_DTO[rawVal as ProrationType];
      } else if (mapping && mapping.type === 'persistence') {
        valueStr = PERSISTENCE_TO_DTO[rawVal as TaxPersistenceMode];
      } else {
        valueStr = String(rawVal);
      }
    }

    list.push({
      guidelineCode: code,
      guidelineName: info.name,
      guidelineGroup: info.group,
      displayOrder: info.displayOrder,
      dataType: info.dataType,
      allowedValues: info.allowedValues || null,
      guidelineValue: valueStr
    });
  }

  return list;
}
