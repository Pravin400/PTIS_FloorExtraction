/**
 * Qualification Master Types
 * Defines data structures for Municipal Qualification Master.
 */

export const QUALIFICATION_STATUS_FILTERS = ['all', 'active', 'inactive'] as const;
export type QualificationStatusFilter = (typeof QUALIFICATION_STATUS_FILTERS)[number];

export interface QualificationMasterFormData {
  qualificationCode: string;
  qualificationName: string;
  qualificationNameRegional: string;
  sequenceNo?: number | null;
  isActive: boolean;
}

export type CreateQualificationMasterDto = Omit<QualificationMasterItem, 'qualificationId' | 'id'>;
export type UpdateQualificationMasterDto = Partial<QualificationMasterItem>;

export interface QualificationMasterItem {
  [key: string]: unknown;
  /** Database ID from backend API */
  id?: number | string;
  /** String identifier for UI compatibility */
  qualificationId: string;
  /** Unique qualification code (e.g. BCOM, BE, SSC) - max 30 chars */
  qualificationCode: string;
  /** Qualification name in English - max 100 chars */
  qualificationName: string;
  /** Qualification name in regional language - max 150 chars */
  qualificationNameRegional: string;
  /** Optional sequence number for sorting */
  sequenceNo?: number | null;
  /** Soft delete flag */
  markedForDeletion?: boolean;
  /** Marked for deletion timestamp */
  markedForDeletionDate?: string | null;
  /** Whether the qualification is active */
  isActive: boolean;
  /** Audit timestamps */
  createdDate?: string;
  updatedDate?: string | null;
}

/**
 * Raw DTO returned from GET /api/payroll/qualification-master
 */
export interface QualificationMasterApiItem {
  id: number;
  qualificationCode: string;
  qualificationName: string;
  qualificationNameRegional?: string;
  sequenceNo?: number | null;
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}

/**
 * Paged API response format from GET /api/payroll/qualification-master
 */
export interface QualificationMasterApiResponse {
  items: QualificationMasterItem[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

/**
 * Query parameters supported by GET /api/payroll/qualification-master
 */
export interface QualificationMasterQueryParams {
  qualificationCode?: string;
  qualificationName?: string;
  qualificationNameRegional?: string;
  isActive?: boolean;
  markedForDeletion?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
}
