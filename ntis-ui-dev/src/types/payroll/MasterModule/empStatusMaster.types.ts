/**
 * Employee Status Master TypeScript definitions (PTIS Standard)
 * Maps to database table: Payroll.EmployeeStatusMaster
 * Fields: id, employeeStatusId, employeeStatusCode, employeeStatus, employeeStatusMarathi, description, isActive, markedForDeletion
 */

import type { StatusFilter } from './empTypeMaster.types';

export type { StatusFilter };

/** Raw Backend DTO representation (both PascalCase and camelCase) */
export interface EmpStatusMasterDto {
  id?: number | string;
  Id?: number | string;
  employeeStatusId?: string;
  EmployeeStatusId?: string;
  employeeStatusCode?: string;
  EmployeeStatusCode?: string;
  employeeStatus?: string;
  EmployeeStatus?: string;
  employeeStatusMarathi?: string;
  EmployeeStatusMarathi?: string;
  description?: string;
  Description?: string;
  isActive?: boolean;
  IsActive?: boolean;
  markedForDeletion?: boolean;
  MarkedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  MarkedForDeletionDate?: string | null;
  createdDate?: string;
  updatedDate?: string | null;
  [key: string]: unknown;
}

/** Normalized Frontend Domain Item */
export interface EmpStatusMasterItem {
  [key: string]: unknown;
  /** Primary identifier (e.g. 1 or STAT-001) */
  id?: number | string;
  /** Primary identifier string (e.g. "1" or "STAT-001") */
  employeeStatusId: string;
  /** Unique status code (e.g. ACTIVE, SUSPENDED, RETIRED) */
  employeeStatusCode: string;
  /** Employment status name (e.g. Active in Service) */
  employeeStatus: string;
  /** Employment status name in Marathi (उदा. सेवेत कार्यरत) */
  employeeStatusMarathi?: string;
  /** Scope & employment terms description */
  description?: string;
  /** Active status indicator for the master record */
  isActive: boolean;
  /** Soft delete indicator */
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  /** Audit timestamps */
  createdDate?: string;
  updatedDate?: string | null;
}

/** Form data representation used inside the form drawer */
export interface EmpStatusFormData {
  employeeStatusCode: string;
  employeeStatus: string;
  employeeStatusMarathi: string;
  description: string;
  isActive: boolean;
}

/** Clean payload sent to create / update server actions and API */
export interface EmpStatusMasterPayload {
  [key: string]: unknown;
  employeeStatusCode: string;
  employeeStatus: string;
  employeeStatusMarathi?: string;
  description?: string;
  isActive: boolean;
}

/** Filter state managed by search and filter hooks */
export interface EmpStatusFilterState {
  search: string;
  statusFilter: StatusFilter;
  page: number;
}
