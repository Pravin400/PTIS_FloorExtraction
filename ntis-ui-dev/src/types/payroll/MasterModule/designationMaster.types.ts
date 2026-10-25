/**
 * Designation Master TypeScript definitions
 * Maps to backend /api/payroll/designation-master
 */

export const DESIGNATION_STATUS_FILTERS = ['all', 'active', 'inactive'] as const;
export type DesignationStatusFilter = (typeof DESIGNATION_STATUS_FILTERS)[number];

export interface DesignationMasterFormData {
  designationCode: string;
  designationName: string;
  designationNameMarathi: string;
  departmentId?: number | null;
  description?: string;
  isActive: boolean;
}

export type CreateDesignationMasterDto = Omit<DesignationMasterItem, 'designationId' | 'id'>;
export type UpdateDesignationMasterDto = Partial<DesignationMasterItem>;

export interface DesignationMasterItem {
  [key: string]: unknown;
  /** Database ID from backend API (number or string identifier) */
  id?: number | string;
  designationId: string;
  designationCode: string;
  designationName: string;
  designationNameMarathi: string;
  departmentId?: number | null;
  description?: string;
  bandId?: number | null;
  gradePrefix?: string | null;
  level?: number | null;
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}

/**
 * Raw DTO returned from GET /api/payroll/designation-master
 */
export interface DesignationMasterApiItem {
  id: number;
  designationCode: string;
  designationName: string;
  designationNameMarathi?: string | null;
  departmentId?: number | null;
  description?: string | null;
  bandId?: number | null;
  gradePrefix?: string | null;
  level?: number | null;
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}

/**
 * Query parameters supported by GET /api/payroll/designation-master
 */
export interface DesignationMasterQueryParams {
  designationCode?: string;
  designationName?: string;
  designationNameMarathi?: string;
  departmentId?: number;
  bandId?: number;
  level?: number;
  isActive?: boolean;
  markedForDeletion?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
}
