export type RuleStatus = 'Active' | 'Review' | 'Draft' | 'Inactive';

export type EvidenceCategory = 
  | 'Authorized: OC or CC available'
  | 'Unauthorized: OC & CC unavailable'
  | 'Partial Evidence';

export type EvidenceItemCode =
  | 'OC'
  | 'CC'
  | 'Electricity'
  | 'Change Detection'
  | 'Construction Year'
  | 'ELECTRICITY'
  | 'CHANGE_DETECTION'
  | 'CONSTRUCTION_YEAR'
  | string;

export interface RetrospectiveRule {
  id: string;
  ruleCode: string;
  ruleTitle: string;
  conditionDescription: string;
  evidenceCategory: EvidenceCategory;
  startLogicTitle: string;
  startLogicBoundary: string;
  commonTaxationBadge: string;
  commonTaxationDescription: string;
  unauthorizedPenalty: string;
  status: RuleStatus;
  priorityNo?: number;
  matchType?: string;
  isFallbackRule?: boolean;
  authorizationStatus?: string;
  legalCapEnabled?: boolean;
  legalCapYears?: number;
  noticeDays?: number;
  versionNo?: string;
  resolutionRef?: string | null;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  remarks?: string | null;
  isActive?: boolean;
  availableEvidence?: EvidenceItemCode[];
  unavailableEvidence?: EvidenceItemCode[];
  compareEvidenceDates?: string;
  useDate?: string;
  earliestAllowedDate?: string;
  splitHigherRateStartsFrom?: string;
  splitHigherRateContinuesUpTo?: string;
  duringPeriodMultiplier?: number | '';
  afterPeriodMultiplier?: number | '';
  offsetMonths?: number | '';
  taxStartsFrom?: string;
  retrospectiveLimit?: string;
  maximumYears?: number | '';
  taxCalculation?: string;
  taxMultiplier?: number | '';
  corporationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RetrospectiveRuleStats {
  importedRulesCount: number;
  readyActiveCount: number;
  needReviewCount: number;
  lookbackGuardrailYears: number;
}

export interface RetrospectiveRuleFilterState {
  searchQuery: string;
  statusFilter: string;
  evidenceFilter: string;
  corporationFilter: string;
}

export interface CreateRetrospectiveRuleInput {
  ruleCode: string;
  ruleTitle: string;
  conditionDescription: string;
  evidenceCategory: EvidenceCategory;
  startLogicTitle: string;
  startLogicBoundary: string;
  commonTaxationBadge: string;
  commonTaxationDescription: string;
  unauthorizedPenalty: string;
  status: RuleStatus;
  availableEvidence?: EvidenceItemCode[];
  unavailableEvidence?: EvidenceItemCode[];
  compareEvidenceDates?: string;
  useDate?: string;
  earliestAllowedDate?: string;
  splitHigherRateStartsFrom?: string;
  splitHigherRateContinuesUpTo?: string;
  duringPeriodMultiplier?: number | '';
  afterPeriodMultiplier?: number | '';
  offsetMonths?: number | '';
  taxStartsFrom?: string;
  retrospectiveLimit?: string;
  maximumYears?: number | '';
  taxCalculation?: string;
  taxMultiplier?: number | '';
  corporationId?: string;
}

export interface PolicyModeItem {
  code: string;
  label: string;
}

export interface PolicyModesApiResponse {
  success: boolean;
  message?: string;
  items: PolicyModeItem[];
  errors?: unknown;
  correlationId?: string | null;
}

export interface RuleEvidenceStateItem {
  evidenceTypeId: number;
  evidenceCode: string;
  evidenceName: string;
  displayOrder: number;
  selectedState: string | null;
}

export interface RuleEvidenceStateApiResponse {
  success: boolean;
  message?: string;
  items: RuleEvidenceStateItem[];
  errors?: unknown;
  correlationId?: string | null;
}

export interface RuleActionModeItem {
  code: string;
  label: string;
  requiredInput?: string;
}

export interface RuleActionModesApiResponse {
  success: boolean;
  message?: string;
  items: RuleActionModeItem[];
  errors?: unknown;
  correlationId?: string | null;
}

export interface RuleComparatorCodeItem {
  code: string;
  label: string;
  requiredInput?: string;
}

export interface RuleComparatorCodesApiResponse {
  success: boolean;
  message?: string;
  items: RuleComparatorCodeItem[];
  errors?: unknown;
  correlationId?: string | null;
}

export interface RuleLibraryApiItem {
  id: number | string;
  ruleCode: string;
  ruleName: string;
  ruleStatus: RuleStatus;
  authorizationStatus: 'AUTHORIZED' | 'UNAUTHORIZED' | string;
  conditionDescription: string;
  conditionTag: string;
  startLogicSummary: string;
  startLogicBoundary: string;
  taxMultiplierNote: string | null;
  penaltySummary: string;
}

export interface RuleLibraryCommonTaxation {
  rateModeCode: string;
  rateModeLabel: string;
  percentageModeCode: string;
  percentageModeLabel: string;
}

export interface RetrospectiveRuleMasterItem {
  id: number;
  ruleCode: string;
  ruleName: string;
  ruleDescription: string;
  priorityNo: number;
  matchType: string;
  isFallbackRule: boolean;
  ruleStatus: string;
  authorizationStatus: string | null;
  legalCapEnabled: boolean;
  legalCapYears: number;
  noticeDays: number;
  versionNo: string;
  resolutionRef: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  remarks: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface RetrospectiveRuleMasterListResponse {
  items: RetrospectiveRuleMasterItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}


export interface RuleDetailEvidenceCondition {
  evidenceTypeId: number;
  evidenceCode: string;
  evidenceName: string;
  displayOrder: number;
  selectedState: string | null;
}

export interface RuleDetailDateCondition {
  ruleId: number;
  comparatorCode: string;
  leftEvidenceTypeId: number | null;
  rightEvidenceTypeId: number | null;
  compareOperator: string | null;
  compareDate: string | null;
  compareDateTo: string | null;
  compareYears: number | null;
  id: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface RuleDetailAction {
  ruleId: number;
  taxStartMode: string;
  startEvidenceTypeId: number | null;
  offsetMonths: number | null;
  retrospectiveLimitType: string;
  maximumYears: number | null;
  cutoffDate: string | null;
  taxCalculationMode: string;
  taxMultiplier: number | null;
  splitStartEvidenceTypeId: number | null;
  splitEndEvidenceTypeId: number | null;
  splitMultiplier: number | null;
  afterSplitMultiplier: number | null;
  id: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface RuleDetailPenaltyRule {
  ruleId: number;
  isPenaltyApplicable: boolean;
  penaltyMode: string;
  penaltyPercent: number | null;
  penaltyDateSourceType: string | null;
  penaltyDateEvidenceTypeId: number | null;
  penaltyDateCondition: string | null;
  compareDate: string | null;
  compareDateTo: string | null;
  elseAction: string | null;
  requiresManualReview: boolean;
  remarks: string | null;
  id: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface RuleDetailSummary {
  ruleId: number;
  ruleCode: string;
  whenSummary: string;
  taxSummary: string;
  penaltySummary: string;
  summaryGeneratedDate: string;
}

export interface RetrospectiveRuleMasterDetail {
  rule: {
    id: number;
    ruleCode: string;
    ruleName: string;
    ruleDescription: string;
    priorityNo: number;
    matchType: string;
    isFallbackRule: boolean;
    ruleStatus: RuleStatus;
    authorizationStatus: string;
    legalCapEnabled: boolean;
    legalCapYears: number;
    noticeDays: number;
    versionNo: string;
    resolutionRef: string | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    remarks: string | null;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
  };
  evidenceConditions: RuleDetailEvidenceCondition[];
  dateCondition: RuleDetailDateCondition;
  action: RuleDetailAction;
  penaltyRule: RuleDetailPenaltyRule;
  summary: RuleDetailSummary;
}

export interface RetrospectiveRuleDetailApiResponse {
  success: boolean;
  message?: string;
  items: RetrospectiveRuleMasterDetail;
  errors?: unknown;
  correlationId?: string | null;
}

export interface InitialTaxationData {
  rateModes?: PolicyModeItem[];
  percentageModes?: PolicyModeItem[];
  activePolicy?: {
    rateMode: string;
    percentageMode: string;
    [key: string]: unknown;
  } | null;
}

export interface InitialActionData {
  taxStartModes?: RuleActionModeItem[];
  useDateOptions?: RuleActionModeItem[];
  limitTypes?: RuleActionModeItem[];
  taxCalculationModes?: RuleActionModeItem[];
}

export interface RetrospectiveRuleLibraryProps {
  initialRules?: RetrospectiveRule[];
  initialStats?: RetrospectiveRuleStats;
  fetchError?: string;
  statusCode?: number;
  initialTaxationData?: InitialTaxationData;
  initialActionData?: InitialActionData;
  initialComparatorCodes?: RuleComparatorCodeItem[];
}
