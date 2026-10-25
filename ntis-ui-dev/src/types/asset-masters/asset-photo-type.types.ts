import { ApiResponse, PagedResponse } from "../common.types";

/**
 * Form model for creating and editing Asset Photo Types
 */
export interface AssetPhotoTypeFormModel {
  id?: number; // Optional for create, required for update
  photoTypeCode: string;
  photoTypeName: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
  assetCategoryId: number | null;
  assetTypeId: number | null;
  isRequired: boolean;
  isSubUnit: boolean;
}

/**
 * Server response model for Asset Photo Type data
 */
export interface AssetPhotoType {
  [key: string]: unknown;
  id: number;
  photoTypeCode: string;
  photoTypeName: string;
  description: string | null;
  displayOrder: number | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
  assetCategoryId: number | null;
  assetTypeId: number | null;
  assetCategoryName?: string;
  assetTypeName?: string;
  isRequired: boolean;
  isSubUnit: boolean;
}

/**
 * Props for Asset Photo Type list component
 */
export interface AssetPhotoTypeProps extends Omit<PagedResponse<AssetPhotoType>, 'items' | 'hasPrevious' | 'hasNext'> {
  data: AssetPhotoType[];
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Paginated response wrapper for list endpoints
 */
export type PaginatedApiResponse<T> = ApiResponse<PagedResponse<T>>;

export interface AssetCategory {
  id: number;
  categoryName: string;
  isActive: boolean;
}

export interface AssetType {
  id: number;
  typeName: string;
  isActive: boolean;
}
