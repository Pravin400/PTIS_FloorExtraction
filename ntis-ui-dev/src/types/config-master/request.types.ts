import { ApiResponse, PagedResponse } from '../common.types';

/**
 * API Request Payloads and Response Wrappers
 */

export type { ApiResponse, PagedResponse as PaginatedResponse };

export interface CreateConfigCategoryRequest {
  categoryCode: string;
  categoryName: string;
  displayOrder: number;
  isActive: boolean;
  createdBy: number;
}

export interface UpdateConfigCategoryRequest {
  categoryCode: string;
  categoryName: string;
  displayOrder: number;
  isActive: boolean;
  updatedBy: number;
}

export interface CreateConfigKeyRequest {
  categoryId: number;
  configCode: string;
  configName: string;
  description: string;
  dataType: string;
  controlType: string;
  defaultValue: string;
  isActive: boolean;
  createdBy: number;
}

export interface UpdateConfigKeyRequest {
  categoryId: number;
  configCode: string;
  configName: string;
  description: string;
  dataType: string;
  controlType: string;
  defaultValue: string;
  isActive: boolean;
  updatedBy: number;
}

export interface CreateConfigValueRequest {
  configKeyId: number;
  departmentId: number | null;
  moduleId: number | null;
  value: string;
  isActive: boolean;
  createdBy: number;
}

export interface UpdateConfigValueRequest {
  configKeyId: number;
  departmentId: number | null;
  moduleId: number | null;
  value: string;
  isActive: boolean;
  updatedBy: number;
}


export interface BackendMutationResponse<T> {
  success: boolean;
  message: string;
  items: T;
  errors: string | null;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  items: null;
  errors: null;
}
