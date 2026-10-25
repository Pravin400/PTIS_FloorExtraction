import { LucideIcon } from 'lucide-react';

/* ================================================================
   Scope & Action Identifiers
================================================================ */
export type Scope = 'all' | 'zone' | 'ward' | 'building' | 'property' | 'range' | 'masterDataChange';
export type Action = 'addTax' | 'quarterlyAdd' | 'removeTax' | 'quarterlyRemove';

/* ================================================================
   Dashboard / Stats
================================================================ */
export interface AddTaxesStats {
  financeYearId: string;
  totalProperties: number;
  transmastProperties: number;
  eligibleRecords: number;
  skippedLocked: number;
  runningJobs: number;
}

export interface FinanceYearOption {
  value: number;
  label: string;
  isActive?: boolean;
}

export interface OperationsPermissions {
  addTax?: boolean;
  quarterlyAdd?: boolean;
  removeTax?: boolean;
  quarterlyRemove?: boolean;
  [key: string]: boolean | undefined;
}

export interface OperationsSummary {
  totalProperties: number;
  transmastProperties: number;
  eligibleRecords: number;
  skippedRecords: number;
  runningJobs: number;
}

export interface InitOperationsResponse {
  financeYears: FinanceYearOption[];
  permissions: OperationsPermissions;
  summary: OperationsSummary;
}

/* ================================================================
   Scope Options (from /Property/search/scope-options)
================================================================ */
export interface ScopeOptionItem {
  id: number;
  name: string;
  scopeType: string;
  displayName: string;
  description: string;
  options: string[];
}

export interface ScopeOptionsResponse {
  success: boolean;
  message: string;
  items: ScopeOptionItem[];
  errors: string[] | null;
  correlationId: string | null;
}

/* ================================================================
   Scope UI Item (used by ScopeTabs / AddTaxesConsole)
================================================================ */
export interface ScopeItem {
  id: string;
  num: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

/* ================================================================
   Search Properties (from /Property/search)
================================================================ */
export interface SearchPropertyItem {
  propertyId: number;
  upicId: string;
  zoneName: string;
  wardName: string;
  propertyNo: string;
  partitionNo: string;
  oldPropertyNo: string | null;
  citySurveyNo: string;
  plotNo: string;
  wingFlatNo: string;
  categoryName: string;
  propertyDescription: string;
  mobile: string;
  propertyHolderName: string;
  occupierName: string;
  shopBuildingName: string;
  societyName: string | null;
  address: string;
  rv: number | null;
  cv: number | null;
  totalTax: number;
}

export interface SearchPropertiesResponse {
  success: boolean;
  message: string;
  items: {
    items: SearchPropertyItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

/* ================================================================
   Eligible Count (POST /property-tax/operations/eligible-count)
================================================================ */
export interface OperationScope {
  zoneIds?: number[];
  wardIds?: number[];
  propertyTypeId?: number;
  propertyTypeIds?: number[];
  assessmentStatusIds?: number[];
  building?: string | string[];
  partitionNos?: string[];
  fromPropertyNo?: string;
  toPropertyNo?: string;
  propertyIds?: number[];
  searchText?: string;
  upicIds?: string[];
  mobileNumbers?: string[];
  fromPropertyId?: number;
  toPropertyId?: number;
  wardNames?: string[];
  zoneNames?: string[];
  overrideAlreadyTaxed?: boolean;
  forceRecalculate?: boolean;
}

export interface EligibleCountPayload {
  financeYearId: string | number;
  scopeType: string;
  scope: OperationScope;
  operation: string;
}

export interface SkipReasonSummary {
  code: string;
  count: number;
}

export interface EligibleCountResponse {
  eligible: number;
  total: number;
  skipped: number;
  alreadyTaxed: number;
  skipReasons?: SkipReasonSummary[];
}

/* ================================================================
   Execute & Jobs API
================================================================ */
export interface ExecuteOptions {
  previewBeforeExecute: boolean;
  isScheduled: boolean;
  scheduledDateTime?: string;
}

export interface ExecuteOperationPayload {
  financeYearId: number;
  operation: string;
  scopeType: string;
  scope: OperationScope;
  options: ExecuteOptions;
}

export interface JobSummary {
  total: number;
  processed: number;
  success: number;
  failed: number;
  skipped: number;
}

export interface ExecuteOperationResult {
  jobId: string;
  status: string;
  summary: JobSummary;
}

export interface ExecuteOperationResponse {
  success: boolean;
  message: string;
  items: ExecuteOperationResult;
  errors: string[] | null;
  correlationId: string | null;
}

export interface JobPropertyItem {
  zone: string;
  ward: string;
  wardNo?: string;
  upicid?: string;
  propertyNo: string;
  partitionNo: string;
  owner: string;
  taxHead: string;
  amount: number;
  status: string;
  message: string;
}

export interface JobPropertyPaginatedResponse {
  items: JobPropertyItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface OperationPreviewRecord {
  propertyId: number;
  zone: string;
  ward: string;
  propertyNo: string;
  partitionNo: string;
  owner: string;
  propertyTypeId: number;
  isEligible: boolean;
  skipReason: string | null;
  skipReasonCode?: string | null;
  missingFieldKeys?: string[];
}

export interface SkippedReasonBreakdown {
  reason: string;
  count: number;
}

export interface EligibleBreakdownItem {
  propertyTypeId: number;
  count: number;
}

export interface OperationPreviewResponse {
  totalSelected: number;
  eligible: number;
  skipped: number;
  alreadyTaxed: number;
  requiresApproval: number;
  records: OperationPreviewRecord[];
  skippedReasons: SkippedReasonBreakdown[];
  eligibleBreakdown: EligibleBreakdownItem[];
}

export interface OperationPreviewPayload {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
  financeYearId: number;
  scopeType: string;
  scope: OperationScope;
  operation: string;
}

/* ================================================================
   Excel Template API
================================================================ */
export interface ImportTemplateColumn {
  key: string;
  header: string;
  dataType: string;
  required: boolean;
}

export interface ScopeCategory {
  id: number;
  name: string;
  description: string;
  scopeType: string;
  requiredColumns: string[];
}

export interface ImportTemplateResponse {
  columns: ImportTemplateColumn[];
  scopeCategories: ScopeCategory[];
}

/* ================================================================
   Master Data Change Audit / Banner API
================================================================ */
export interface MasterDataChangeSummary {
  affectedCount: number;
  remarkSummary?: string | null;
  latestChangedAtUtc?: string | null;
  activeJobId?: number | null;
  activeJobCode?: string | null;
  activeJobStatus?: string | null;
}

export interface MasterDataChangeAffectedProperty {
  propertyId: number;
  zone: string;
  ward: string;
  propertyNo: string;
  partitionNo: string;
  upicId?: string | null;
  owner: string;
  remark?: string | null;
  flaggedAtUtc: string;
}


