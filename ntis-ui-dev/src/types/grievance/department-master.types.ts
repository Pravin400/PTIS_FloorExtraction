/**
 * Grievance Department Master Domain Contracts & DTOs
 * Path: src/types/grievance/department-master.types.ts
 */

export interface GrievanceDepartment {
  id: string;
  srNo?: number;
  code?: string;
  nameEn: string;
  nameMr: string;
  category?: string;
  subOffices?: string[];
  description?: string;
  descriptionMr?: string;
  grievanceTypes: string[];
  isActive: boolean;
  totalGrievances?: number;
  resolvedGrievances?: number;
  pendingGrievances?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentDto {
  code?: string;
  nameEn: string;
  nameMr: string;
  description?: string;
  grievanceTypes?: string[];
  isActive?: boolean;
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {
  id: string;
}

export interface DepartmentFilterParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  pageSize?: number;
  sortBy?: 'nameEn' | 'code' | 'totalGrievances' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DepartmentStats {
  total: number;
  active: number;
  inactive: number;
  totalGrievances: number;
}

export interface GrievanceTypeItem {
  id: number;
  grievanceDepartmentId: number;
  grievanceType: string;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export interface CreateGrievanceTypeDto {
  grievanceDepartmentId: number | string;
  grievanceType: string;
  isActive?: boolean;
  createdBy?: number;
}

export interface UpdateGrievanceTypeDto {
  id: number | string;
  grievanceDepartmentId: number | string;
  grievanceType: string;
  isActive: boolean;
  updatedBy?: number;
}

export interface GrievanceTypeFilterParams {
  id?: number;
  grievanceDepartmentId?: number | string;
  grievanceType?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterLogic?: number;
}

