/**
 * Employee Class Master Types
 * Maps to backend /payroll/employee-class-master
 */

export const EMP_CLASS_STATUS_FILTERS = ['all', 'active', 'inactive'] as const;
export type EmpClassStatusFilter = (typeof EMP_CLASS_STATUS_FILTERS)[number];

export interface EmpClassFormData {
  classCode: string;
  className: string;
  classNameMarathi: string;
  description?: string;
  isActive: boolean;
}

export type EmpClassMasterItem = {
  /** Database ID from backend API */
  id?: number | string;
  /** Unique identifier for UI */
  employeeClassId: string;
  /** Unique code (e.g. CLASS-I) */
  classCode: string;
  /** Full English name */
  className: string;
  /** Marathi name */
  classNameMarathi?: string;
  /** Optional description */
  description?: string;
  /** Soft delete flag */
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  /** Active status */
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
};

export type EmpClassMasterPayload = {
  classCode: string;
  className: string;
  classNameMarathi?: string;
  description?: string;
  isActive: boolean;
};

export interface EmpClassMasterFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmpClassMasterPayload) => Promise<boolean>;
  initialItem?: EmpClassMasterItem | null;
  existingItems?: EmpClassMasterItem[];
  existingCodes?: string[];
}

export interface EmpClassMasterTableProps {
  data: EmpClassMasterItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onEdit: (item: EmpClassMasterItem) => void;
  onDelete: (item: EmpClassMasterItem) => void;
}

export interface EmpClassMasterViewProps {
  initialItems: EmpClassMasterItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UseEmpClassMasterFormOptions {
  isOpen: boolean;
  initialItem?: EmpClassMasterItem | null;
  existingCodes?: Set<string>;
  existingItems?: EmpClassMasterItem[];
  onSave: (data: EmpClassMasterPayload) => Promise<boolean | void>;
  onClose: () => void;
}
