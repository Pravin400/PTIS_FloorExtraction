export interface DepartmentMaster {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  departmentNameLocal?: string;
  departmentDescription?: string;
  isActive: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedBy?: number;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface DepartmentMasterFormModel {
  departmentId?: number;
  departmentCode: string;
  departmentName: string;
  departmentNameLocal: string;
  departmentDescription: string;
  isActive: boolean;
}

export interface DepartmentMasterFormData {
  departmentCode: string;
  departmentName: string;
  departmentNameLocal: string;
  departmentDescription: string;
  isActive: boolean;
}

export interface DashboardCardProps {
  label: string;
  value: string;
  iconBg: string;
  valueColor: string;
  icon: React.ElementType;
}

export interface DepartmentMasterFormProps {
  open: boolean;
  onClose: () => void;
  editingDepartment: DepartmentMaster | null;
  onSuccess?: () => void;
}

export interface DepartmentMasterProps {
  initialData: DepartmentMaster[];
  allData?: DepartmentMaster[];
  initialPageNumber: number;
  initialPageSize: number;
  initialTotalCount: number;
  initialTotalPages: number;
  initialSearchTerm?: string;
  fetchError?: string;
  statusCode?: number;
}

export type { PagedResponse } from './common.types';
