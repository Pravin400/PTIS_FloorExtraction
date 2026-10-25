import { PagedResponse } from "../common.types";

/**
 * Form model for creating and editing Asset Room Types
 */
export interface AssetRoomTypeFormModel {
  id?: number; // Optional for create, required for update
  roomTypeCode: string;
  roomTypeName: string;
  description: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
  assetCategoryId: number | null;
  assetTypeId: number | null;
}

/**
 * Server response model for Asset Room Type data
 */
export interface AssetRoomType {
  [key: string]: unknown;
  id: number;
  roomTypeCode: string;
  roomTypeName: string;
  description: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
  assetCategoryId: number | null;
  assetTypeId: number | null;
  assetCategoryName?: string;
  assetTypeName?: string;
}

/**
 * Props for Asset Room Type list component
 */
export interface AssetRoomTypeProps extends Omit<PagedResponse<AssetRoomType>, 'items' | 'hasPrevious' | 'hasNext'> {
  data: AssetRoomType[];
  sortBy?: string;
  sortOrder?: string;
}

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
