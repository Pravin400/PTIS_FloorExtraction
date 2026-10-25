/**
 * Department Master Types
 * Standalone Department Master — isolated from OrganizationSetup's DepartmentItem.
 * Contains exactly the 6 required business fields.
 */

export const DEPT_STATUS_FILTERS = ['all', 'active', 'inactive'] as const;
export type DeptStatusFilter = (typeof DEPT_STATUS_FILTERS)[number];

export interface DeptMasterFormData {
  departmentCode: string;
  departmentName: string;
  departmentNameMarathi: string;
  description?: string;
  isActive: boolean;
}

export type CreateDeptMasterDto = Omit<DeptMasterItem, 'departmentId' | 'id'>;
export type UpdateDeptMasterDto = Partial<DeptMasterItem>;

export interface DeptMasterItem {
  [key: string]: unknown;
  /** Database ID from backend API (number or string identifier) */
  id?: number | string;
  /** Auto-generated unique identifier / string ID for UI compatibility */
  departmentId: string;
  /** Unique short code for the department (e.g. GEN_ADMIN). Required. */
  departmentCode: string;
  /** Full English name of the department. Required. */
  departmentName: string;
  /** Full Marathi name of the department. Required. */
  departmentNameMarathi: string;
  /** Optional description of the department's scope and responsibilities. */
  description?: string;
  /** Department level if applicable */
  deptLevel?: number | null;
  /** Soft delete flag */
  markedForDeletion?: boolean;
  /** Marked for deletion timestamp */
  markedForDeletionDate?: string | null;
  /** Whether the department is active in the system. Defaults to true. */
  isActive: boolean;
  /** Audit timestamps */
  createdDate?: string;
  updatedDate?: string | null;
}

/**
 * Raw DTO returned from GET /api/payroll/department-master
 */
export interface DeptMasterApiItem {
  id: number;
  departmentCode: string;
  departmentName: string;
  departmentNameMarathi: string;
  description?: string | null;
  deptLevel?: number | null;
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}

/**
 * Paged API response format from GET /api/payroll/department-master
 */
export interface DeptMasterApiResponse {
  items: DeptMasterItem[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

/**
 * Query parameters supported by GET /api/payroll/department-master
 */
export interface DeptMasterQueryParams {
  departmentCode?: string;
  departmentName?: string;
  departmentNameMarathi?: string;
  deptLevel?: number;
  isActive?: boolean;
  markedForDeletion?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
}

