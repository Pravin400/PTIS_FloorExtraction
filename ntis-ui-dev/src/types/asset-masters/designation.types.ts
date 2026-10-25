import { PagedResponse } from "../common.types";

export interface DesignationFormModel {
  id?: number;
  designationCode: string;
  designationName: string;
  designationLocal: string;
  designationDescription: string;
  owningDepartmentId: number | null;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface Designation {
  [key: string]: unknown;
  id: number;
  designationCode: string;
  designationName: string;
  designationLocal: string;
  designationDescription: string | null;
  owningDepartmentId: number;
  owningDepartmentName?: string; // Loaded directly from API response
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface OwningDepartment {
  id: number;
  owningDepartmentName: string;
  description: string | null;
  isActive: boolean;
}

export interface DesignationProps extends Omit<PagedResponse<Designation>, 'items' | 'hasPrevious' | 'hasNext'> {
  data: Designation[];
  sortBy?: string;
  sortOrder?: string;
}
