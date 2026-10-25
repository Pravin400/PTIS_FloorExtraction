export interface RawOwningDepartment {
  id?: number;
  owningDepartmentName?: string;
  description?: string;
  isActive?: boolean;
  markedForDeletion?: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface OwningDepartment {
  [key: string]: unknown;
  id: number;
  owningDepartmentName: string;
  description: string;
  isActive: boolean;
  markedForDeletion?: boolean;
  createdDate: string | null;
  updatedDate: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface OwningDepartmentFormModel {
  id?: number | null;
  owningDepartmentName: string;
  description: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface OwningDepartmentMasterProps {
  data: OwningDepartment[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
}
