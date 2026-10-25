export type ReportJobType = 'Single' | 'Bulk';

export interface ReportDefinition {
  id: number;
  reportCode: string;
  reportName: string;
  category: string;
  description: string;
  templateFile: string;
  dataProviderCode: string;
  isActive: boolean;
  sortOrder: number;
  defaultHtmlTemplateVersionId?: number | null;
  /** ID of the module/category this report belongs to (from backend) */
  moduleId?: number | null;
}

export interface ReportModule {
  id: number;
  name: string;
  logoContentType: string | null;
  logoBase64: string | null;
}

export type Step = 1 | 2 | 3 | 4;

export interface Category {
  id?: number;
  key: string;
  name?: string;
  icon?: React.ElementType;
  logoContentType?: string | null;
  logoBase64?: string | null;
  color: string;
  bgColor: string;
  borderColor: string;
  glowClass: string;
  iconBg: string;
}

export type ReportParameterType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface ReportParameterDefinition {
  id: number;
  reportDefinitionId: number;
  parameterKey: string;
  label: string;
  parameterType: ReportParameterType;
  /** For a 'select' parameter: the lookup key fetched from GET /ReportLookup/{key}. */
  optionsSource: string | null;
  /** For 'select': the parent param whose value filters options. For 'date': a min-bound (range "to"). */
  cascadeFromKey: string | null;
  isRequired: boolean;
  sortOrder: number;
}

/** One option for a 'select' parameter, returned by the generic lookup endpoint. */
export interface LookupOption {
  value: string;
  label: string;
}

export interface ZoneSummary {
  id: number;
  zoneNo: string;
  description: string;
}

export interface WardSummary {
  id: number;
  wardNo: string;
  description: string;
  zoneId: number;
}

export interface PropertySummary {
  propertyId: number;
  propertyNo: string;
  partitionNo: string;
  ownerName: string;
  propertyTypeId?: number;
}

export type ReportParamValues = Record<string, string>;

export type ReportFormErrors = Partial<Record<string, string>>;

export type ReportJobStatus =
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | 'Retrying';

export interface ReportJob extends Record<string, unknown> {
  reportRequestId: string;
  reportCode: string;
  status: ReportJobStatus;
  createdDate: string;
  completedDate: string | null;
  errorMessage: string | null;
  downloadAvailable: boolean;
  totalRecords?: number;
  processedRecords?: number;
  totalChunks?: number;
  completedChunks?: number;
  currentChunk?: number;
  progressPercentage?: number;
  stage?: string;
}

export interface CreateReportRequestResult {
  success: boolean;
  data?: {
    reportRequestId: string;
    status: string;
  };
  error?: string;
}

export type CreateReportRequest = (
  reportCode: string,
  parameters: Record<string, string>,
  jobType?: ReportJobType,
) => Promise<CreateReportRequestResult>;

export interface ReportJobsCopy {
  title: string;
  refresh: string;
  empty: string;
  download: string;
  preview: string;
  previewTitle: string;
  columns: {
    report: string;
    status: string;
    requested: string;
    completed: string;
    actions: string;
  };
  statuses: Record<ReportJobStatus, string>;
}

export interface ReportWorkspaceCopy {
  steps: {
    selectCategory: string;
    selectReport: string;
    setParameters: string;
    generateReport: string;
  };
  tabs: {
    generateReport: string;
    myReports: string;
  };
  toast: {
    generatedSuccess: string;
    generationFailed: string;
    generatingPreview: string;
    preparingDocument: string;
  };
  reportsCount: string;
  emptyState: {
    title: string;
    subtitle: string;
  };
  noReportsFound: string;
  reportsHeader: string;
  configureParameters: string;
  generating: {
    title: string;
    subtitle: string;
    cancel: string;
  };
  preview: {
    title: string;
    downloadPdf: string;
    idLabel: string;
  };
  confirm: {
    title: string;
    description: string;
    btnGo: string;
    btnClose: string;
  };
}

export interface ReportParamsPanelCopy {
  emptyState: string;
  financialYear: string;
  zoneNo: string;
  wardNo: string;
  propertySelection: string;
  propertyNo: string;
  fromPropertyToProperty: string;
  fromProperty: string;
  toProperty: string;
  selectYear: string;
  selectZone: string;
  selectWard: string;
  selectProperty: string;
  selectStartProperty: string;
  selectEndProperty: string;
  loading: string;
  selectZoneFirst: string;
  selectWardFirst: string;
  validation: {
    financialYearRequired: string;
    zoneRequired: string;
    wardRequired: string;
    fillAllRequired: string;
    networkError: string;
    failedToQueue: string;
  };

  reportQueued: string;
  buttons: {
    reset: string;
    generate: string;
    queuing: string;
  };
}

export interface ReportFormCopy {
  pageTitle: string;
  pageSubtitle: string;
  fields: {
    reportType: string;
  };
  buttons: {
    generate: string;
    reset: string;
  };
  placeholders: {
    selectReport: string;
    selectZone: string;
    selectWard: string;
    selectProperty: string;
    selectPartition: string;
    pendingZone: string;
    pendingWard: string;
    pendingProperty: string;
  };
  validation: {
    reportRequired: string;
    dateRangeInvalid: string;
  };
  success: {
    downloaded: string;
  };
  errors: {
    generationFailed: string;
    loadFailed: string;
  };
  proTip: {
    title: string;
    body: string;
  };
  generationForm: {
    loadingParameters: string;
    failedToLoadParameters: string;
    /** Expects a `{report}` placeholder */
    noParametersDefined: string;
    back: string;
  };
  paramField: {
    selectPreviousFirst: string;
    loading: string;
    select: string;
  };
}

export interface ReportGenerationFormProps {
  copy: ReportFormCopy;
  reportDefinitions: ReportDefinition[];
  zones: ZoneSummary[];
  /** Pre-selected report code from the category grid. */
  selectedReportCode?: string;
  /** Called after a request is successfully queued, so the jobs list can refresh. */
  onQueued?: () => void;
  /** Called when the user wants to go back to the report selection grid. */
  onBack?: () => void;
  fetchReportParameters?: (reportDefinitionId: number) => Promise<{ data: ReportParameterDefinition[]; error: string | null }>;
  createReportRequest?: CreateReportRequest;
}

import type { FinancialYear } from '@/types/financialYear.types';

export interface ReportsWorkspaceProps {
  locale?: string;
  initialReportCode?: string;
  copy?: ReportFormCopy;
  jobsCopy: ReportJobsCopy;
  workspaceCopy?: ReportWorkspaceCopy;
  paramsCopy?: ReportParamsPanelCopy;
  reportDefinitions: ReportDefinition[];
  reportModules?: ReportModule[];
  zones?: ZoneSummary[];
  financialYears?: FinancialYear[];
  /** Server action injected from page.tsx — fetches wards for a given zone */
  fetchWards?: (zoneId: number) => Promise<WardSummary[]>;
  /** Server action injected from page.tsx — fetches properties for a given ward */
  fetchProperties?: (wardId: number) => Promise<PropertySummary[]>;
  initialJobs?: ReportJob[];
  fetchJobs?: (take?: number) => Promise<ReportJob[]>;
  fetchReportParameters?: (reportDefinitionId: number) => Promise<{ data: ReportParameterDefinition[]; error: string | null }>;
  createReportRequest?: CreateReportRequest;
}

export interface ReportJobsListProps {
  jobs: ReportJob[];
  loading: boolean;
  copy: ReportJobsCopy;
  reportDefinitions: ReportDefinition[];
  /** Called when user clicks the Preview button — passes requestId */
  onPreview?: (requestId: string) => void;
}

export interface PropertySelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertySummary[];
  propLoading: boolean;
  selectionMode: string;
  fromProperty: string;
  toProperty: string;
  selectedProperties: string[];
  setSelectedProperties: React.Dispatch<React.SetStateAction<string[]>>;
  zoneLabel: string;
  wardLabel: string;
  propertyTypeMap: Map<number, string>;
  isPending: boolean;
  onGenerate: () => void;
  propSearchQuery: string;
  setPropSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}
