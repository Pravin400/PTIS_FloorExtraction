export interface OwnershipTypeApiRecord {
  id: number;
  ownershipTypeName: string;
  description: string;
  isActive: boolean;
  createdBy: number;
  createdDate: string;
  updatedBy: number | null;
  updatedDate: string | null;
}

export interface OwnershipTypePagedResponse {
  items: OwnershipTypeApiRecord[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface OwnershipTypeParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  MarkedForDeletion?: boolean;
  IsActive?: boolean | string;
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
}

export interface OwningDepartmentApiRecord {
  id: number;
  owningDepartmentName: string;
  description: string;
  departmentId?: number;
  departmentName?: string;
  isActive: boolean;
  createdBy: number;
  createdDate: string;
  updatedBy: number | null;
  updatedDate: string | null;
}

export interface OwningDepartmentPagedResponse {
  items: OwningDepartmentApiRecord[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface OwningDepartmentParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  MarkedForDeletion?: boolean;
  IsActive?: boolean | string;
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
}

export interface AssetPhotoTypeApiRecord {
  id: number;
  photoTypeCode: string;
  photoTypeName: string;
  description: string;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export interface AssetPhotoTypePagedResponse {
  items: AssetPhotoTypeApiRecord[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface AssetPhotoTypeParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  MarkedForDeletion?: boolean;
  IsActive?: boolean | string;
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
}
