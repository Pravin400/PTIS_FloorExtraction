/**
 * Employee Type Master TypeScript definitions (PTIS Standard)
 * Maps to database table: Payroll.EmployeeTypeMaster
 * Business contract fields: EmployeeTypeID, EmployeeTypeCode, EmployeeTypeName, EmployeeTypeNameMarathi, SequenceNo, IsActive
 */

/** Raw Backend DTO representation (both PascalCase and camelCase) */
export interface EmpTypeMasterDto {
  id?: number | string;
  employeeTypeId?: string;
  EmployeeTypeId?: string;
  employeeTypeCode?: string;
  EmployeeTypeCode?: string;
  employeeTypeName?: string;
  EmployeeTypeName?: string;
  employeeTypeNameMarathi?: string;
  EmployeeTypeNameMarathi?: string;
  sequenceNo?: number;
  SequenceNo?: number;
  isActive?: boolean;
  IsActive?: boolean;
  markedForDeletion?: boolean;
  MarkedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  MarkedForDeletionDate?: string | null;
  [key: string]: unknown;
}

/** Normalized Frontend Domain Item */
export interface EmpTypeMasterItem {
  [key: string]: unknown;
  /** Primary identifier (e.g. ET-001 or TYPE-001) */
  employeeTypeId: string;
  /** Unique classification code (e.g. PERM, CONT, TEMP) */
  employeeTypeCode: string;
  /** English display name (e.g. Permanent / Regular) */
  employeeTypeName: string;
  /** Marathi Devanagari display name (e.g. कायम / नियमित) */
  employeeTypeNameMarathi: string;
  /** Display / sorting sequence number (e.g. 1, 2, 3) */
  sequenceNo: number;
  /** Active status indicator for the master record */
  isActive: boolean;
  /** Soft delete indicator */
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
}

/** Form data representation used inside the form drawer */
export interface EmpTypeFormData {
  employeeTypeCode: string;
  employeeTypeName: string;
  employeeTypeNameMarathi: string;
  sequenceNo?: number;
  isActive: boolean;
}

/** Clean payload sent to create / update server actions and API */
export interface EmpTypeMasterPayload {
  [key: string]: unknown;
  employeeTypeCode: string;
  employeeTypeName: string;
  employeeTypeNameMarathi: string;
  sequenceNo?: number;
  isActive: boolean;
}

/** Status filter options */
export type StatusFilter = 'all' | 'active' | 'inactive';

/** Filter state managed by search and filter hooks */
export interface EmpTypeFilterState {
  search: string;
  statusFilter: StatusFilter;
  page: number;
}
