import { RawSearchParams } from "@/lib/utils/sanitize-params";
import type { LucideIcon } from "lucide-react";
import { PropertyMediaCategoryEnum, PropertyMediaCategoryKey } from "@/lib/constants/propertyMedia.constants";
import { SearchSelectOption } from "@/components/common";

export interface PropertyStatistics {
  total: number;
  structures: number;
  units: number;
}

export interface MissingStatistics {
  applicable: number;
  available: number;
  missing: number;
}

export interface DashboardStatistics {
  totalProperties: PropertyStatistics;
  buildingPhotoAvailable: PropertyStatistics;
  buildingPlanAvailable: PropertyStatistics;
  surveyFormAvailable?: PropertyStatistics;
  surveyFormMissing?: MissingStatistics;
  buildingPhotoMissing: MissingStatistics;
  buildingPlanMissing: MissingStatistics;
}

export interface PropertyMediaApiResponse<T> {
  success?: boolean;
  message?: string;
  items: T;
  totalCount?: number | null;
  errors?: unknown;
  correlationId?: string | null;
}

export interface CategoryOption {
  id: number;
  name: string;
}

export interface UploadFormData {
  category: string;
  subCategory: string;
}

export interface DownloadFormData {
  category: string;
  subCategory: string;
  zone?: string;
  ward?: string[];
  propertyFrom?: string;
  propertyTo?: string;
}

export interface UploadDownloadFormModel {
  activeTab: 'upload' | 'download';
  upload: UploadFormData;
  download: DownloadFormData;
}

export interface PropertyNumbersQueryParams {
  divisionId?: number | string;
  wardIds?: string[] | string;
  fromPropertyNo?: string;
}

export type PropertyNumbersResponse = PropertyMediaApiResponse<string[]>;

export interface WorkflowStage {
  stageName: string;
  description: string;
  userId: number | null;
  officerName: string | null;
  displayOrder: number;
  id: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface WorkflowStageResponse {
  items: WorkflowStage[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ZoneItem {
  id: number;
  zoneNo: string;
  description: string;
  sequenceNo: number | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface ZoneResponse {
  items: ZoneItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface WardItem {
  id: number;
  wardNo: string;
  zoneId: number;
  description: string;
  sequenceNo: number | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface WardResponse {
  items: WardItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PropertyTypeItem {
  id: number;
  propertyDescription: string;
  type: string;
  searchSequence: number;
  propertyTypeCategoryId: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface PropertyTypeResponse {
  items: PropertyTypeItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

import { PagedResponse } from "@/types/common.types";

export type GapCategory = 'photo' | 'plan' | 'document';

export type GapRequirement = 'Mandatory' | 'Additional' | 'Conditional';

export interface DetailedCoverageItem extends Record<string, unknown> {
  id?: number | string;
  category: string;
  photoTypeId?: number;
  photoTypeCode?: string;
  photoTypeName?: string;
  applicable: number;
  available: number;
  missing: number;
  coveragePercentage?: string;
  requirement?: GapRequirement | string | null;
}

export type DetailedCoverageResponse = PagedResponse<DetailedCoverageItem>;

export interface MissingPropertyApiItem {
  propertyId: number;
  propertyNo: string;
  zoneNo: string;
  wardNo: string;
  ownerName: string;
  propertyType: string;
  stageName: string | null;
  missingType: string;
  updatedDate?: string | null;
}

export interface MissingPropertiesApiData {
  photoTypeId: number;
  photoTypeName: string;
  gapRecords: number;
  items: MissingPropertyApiItem[];
}

export interface MissingPropertiesQueryParams {
  photoTypeId?: number | string;
  id?: number | string;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  zoneId?: number | string;
  wardId?: number | string;
  workflowStageId?: number | string;
  propertyTypeId?: number | string;
}

export interface MissingPropertyRow extends Record<string, unknown> {
  propertyId?: number;
  propertyNumber: string;
  division: string;
  ward: string;
  ownerName: string;
  propertyType: string;
  missingType: string;
  workflowStatus: string;
  lastUpdatedDate: string;
}

export interface MissingPropertiesResult {
  items: MissingPropertyRow[];
  photoTypeId?: number;
  photoTypeName?: string;
  gapRecords?: number;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ExecuteLocalImportPayload {
  photoTypeId: number;
  remarks?: string;
  maxFilesToProcess?: number;
}

export const MEDIA_JOB_STATUS = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
} as const;

export const MEDIA_JOB_STATUSES = [
  MEDIA_JOB_STATUS.PENDING,
  MEDIA_JOB_STATUS.RUNNING,
  MEDIA_JOB_STATUS.COMPLETED,
  MEDIA_JOB_STATUS.FAILED,
  MEDIA_JOB_STATUS.CANCELLED,
] as const;

export type MediaJobStatus = (typeof MEDIA_JOB_STATUS)[keyof typeof MEDIA_JOB_STATUS];

export interface ExecuteLocalImportItem {
  jobId: number;
  jobCode: string;
  recordsSelected: number;
  status: MediaJobStatus;
}

export type ExecuteLocalImportResponse = PropertyMediaApiResponse<ExecuteLocalImportItem>;

export interface JobStatusItem {
  jobId: number;
  jobCode: string;
  recordsSelected: number;
  status: MediaJobStatus;
}

export type JobStatusApiResponse = PropertyMediaApiResponse<JobStatusItem>;

export interface LocalBulkUploadPayload {
  previewId: string;
}

export interface LocalBulkUploadItem {
  jobId?: number;
  previewId?: string;
  jobCode?: string;
  recordsSelected?: number;
  status?: MediaJobStatus;
}

export type LocalBulkUploadResponse = PropertyMediaApiResponse<LocalBulkUploadItem>;

export interface BrowseMatchItem {
  fileName: string;
  status?: string;
  isMatched: boolean;
  propertyDisplay?: string | null;
  skipReason?: string | null;
}

export interface BrowseMatchData {
  previewId: string;
  page: number;
  pageSize: number;
  totalCount: number;
  totalMatched: number;
  totalUnmatched: number;
  items: BrowseMatchItem[];
}

export type BrowseMatchApiResponse = PropertyMediaApiResponse<BrowseMatchData>;

export type BrowseMatchPreviewItem = BrowseMatchItem;

export interface BrowseMatchPreviewData {
  previewId: string;
  page: number;
  pageSize: number;
  totalCount: number;
  totalMatched: number;
  totalUnmatched: number;
  items: BrowseMatchPreviewItem[];
}

export type BrowseMatchPreviewApiResponse = PropertyMediaApiResponse<BrowseMatchPreviewData>;

export interface BrowseMatchPreviewResult {
  previewId?: string;
  items: BrowseMatchPreviewItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  totalMatched: number;
  totalUnmatched: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export interface PropertyMediaSearchParams extends RawSearchParams {
  category?: string;
  subCategory?: string;
  previewId?: string;
}

export interface ImportMatchPreviewItem {
  fileName: string;
  status?: string;
  isMatched: boolean;
  propertyDisplay?: string | null;
  skipReason?: string | null;
}

export interface ImportMatchPreviewData {
  page: number;
  pageSize: number;
  totalCount: number;
  totalMatched: number;
  totalUnmatched: number;
  items: ImportMatchPreviewItem[];
}

export interface ImportMatchPreviewResult {
  items: ImportMatchPreviewItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  totalMatched: number;
  totalUnmatched: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export type ExportFormat = 0 | 1;

export interface ToastHandlers {
  success?: (message: string) => void;
  error?: (message: string) => void;
}

export interface DetailedCoverageExportParams {
  format: ExportFormat;
  category?: string;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
  toastHandlers?: ToastHandlers;
  t?: (key: string) => string;
}

export interface MissingPropertiesExportParams {
  format: ExportFormat;
  searchTerm?: string;
  photoTypeId?: string | number;
  category?: string | number;
  zoneId?: string | number;
  wardId?: string | number;
  workflowStageId?: string | number;
  propertyTypeId?: string | number;
  pageNumber?: number;
  pageSize?: number;
  toastHandlers?: ToastHandlers;
  t?: (key: string) => string;
}

export interface GapSummaryCardConfig {
  id: PropertyMediaCategoryEnum;
  key: PropertyMediaCategoryKey;
  titleKey: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  getStats: (stats?: DashboardStatistics | null) => MissingStatistics | undefined;
}

export interface AuditTrailApiItem {
  "Date & Time": string;
  User: string;
  Action: string;
  Category: string;
  Result: number | string;
}

export interface ActivityLog extends Record<string, unknown> {
  dateTime: string;
  user: string;
  action: string;
  category: string;
  result: number | string;
}

export interface AuditTrailQueryParams {
  pageNumber?: number;
  pageSize?: number;
  format?: number;
}

export interface AuditTrailResult {
  items: ActivityLog[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface AuditTrailExportParams {
  format: ExportFormat;
  pageNumber?: number;
  pageSize?: number;
  toastHandlers?: ToastHandlers;
  t?: (key: string) => string;
}

/**
 * Query parameters for downloading images ZIP file.
 * PhotoTypeId and Category are required.
 * ToPropertyNo, FromPropertyNo, WardIds (array or comma-separated string), and DivisionId are optional.
 */
export interface DownloadImagesQueryParams {
  photoTypeId: number | string;
  category: number | string;
  toPropertyNo?: string;
  fromPropertyNo?: string;
  wardIds?: string[] | string;
  divisionId?: number | string;
}

/**
 * 400 Bad Request error response body shape for image download.
 */
export interface DownloadImagesApiError {
  success: boolean;
  message?: string;
  statusCode?: number;
  errors?: unknown;
}

/**
 * Download state model for managing image archive downloads.
 */
export interface DownloadImagesState {
  isDownloading: boolean;
  error: string | null;
}


export interface GapAnalysisProps {
  dashboardStats?: DashboardStatistics | null;
  tableData: TableData;
  headerResult?: HeaderResult;
}

export interface HeaderResult {
  totalProperties: TotalProperties;
  documentCoverage: DocumentCoverageItem[];
}

export type TableData = PagedResponse<DetailedCoverageItem>;


export interface TotalProperties {
  total: number;
  structures: number;
  units: number;
}

export interface DocumentCoverageItem {
  type: string;
  applicable: number;
  available: number;
  missing: number;
  missingPercentage: number;
  structures: number;
  units: number;
}

export interface HeaderResult {
  totalProperties: TotalProperties;
  documentCoverage: DocumentCoverageItem[];
}



export interface DocumentCoverageItem {
  type: string;
  applicable: number;
  available: number;
  missing: number;
  missingPercentage: number;
  structures: number;
  units: number;
}

export interface HeaderResult {
  totalProperties: TotalProperties;
  documentCoverage: DocumentCoverageItem[];
}

export interface CoverageItem extends DetailedCoverageItem {
  type?: string;
  isPrimary?: boolean;
  coverage?: number;
}



export type MissingPropertyItem = MissingPropertyRow;

export interface MissingPropertyTableData {
  items: MissingPropertyRow[];
  photoTypeId?: number;
  photoTypeName?: string;
  gapRecords?: number;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}


export interface SummaryCardsProps {
  dashboardStats?: DashboardStatistics | null;
}

export interface GapAnalysisProps {
  dashboardStats?: DashboardStatistics | null;
  tableData: TableData;
  headerResult?: HeaderResult;
}

export interface GapAnalysisSummaryCardsProps {
  dashboardStats?: DashboardStatistics | null;
  headerResult?: HeaderResult;
  activeCategory?: string;
  onCategoryClick?: (category: string) => void;
  t: (key: string) => string;
}

export interface DetailedCoverageTableProps {
  tableData: TableData;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export interface GapAnalysisViewProps {
  missingPropertyTableData?: MissingPropertyTableData;
  workflowStageOptions?: SearchSelectOption[];
  divisionOptions?: SearchSelectOption[];
  propertyTypeOptions?: SearchSelectOption[];
  wardOptions?: SearchSelectOption[];
}

export interface GapAnalysisViewFormProps {
  workflowStageOptions?: SearchSelectOption[];
  divisionOptions?: SearchSelectOption[];
  propertyTypeOptions?: SearchSelectOption[];
  wardOptions?: SearchSelectOption[];
  selectedWorkflowStage?: string;
  selectedDivision?: string;
  selectedWard?: string;
  selectedPropertyType?: string;
  searchTerm?: string;
  onFilterChange: (name: string, value: string) => void;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  isWardDisabled?: boolean;
  divisionLabel?: string;
  wardLabel?: string;
  isLoading?: boolean;
}

export interface UploadFileItem extends Record<string, unknown> {
  id?: string | number;
  fileName: string;
  propertyDisplay?: string | null;
  propertyDetails?: string;
  status?: string;
  isMatched: boolean;
  skipReason?: string | null;
}

export interface UploadTableData {
  items: (ImportMatchPreviewItem | UploadFileItem)[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface UploadTableProps {
  data?: (ImportMatchPreviewItem | UploadFileItem)[];
  loading?: boolean;
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  sourceTab?: 'server' | 'device';
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onUploadClick?: () => void;
  t?: (key: string) => string;
}