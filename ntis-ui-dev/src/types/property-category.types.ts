import { ApiResponse, PagedResponse } from "./common.types";

/**
 * Server response model for property category data
 * Represents the complete property category record from the database
 * API endpoint: /api/PropertyCategory
 */
export interface PropertyCategory {
  id: number;
  propertyCategoryName: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * Paginated response wrapper for property category list endpoints
 */
export type PropertyCategoryResponse = ApiResponse<PagedResponse<PropertyCategory>>;

/**
 * Option type for dropdown/select components
 */
export interface PropertyCategoryOption {
  label: string;
  value: number;
}

/**
 * Form model for creating a new property
 */
export interface CreatePropertyFormModel {
  wardId: number;
  propertyTypeId: number;
  categoryId: number;
  taxZoneId: number | null;
  propertyNo: string;
  ownerName: string;
  isBulkCreate: boolean;
  fromPropertyNo?: string;
  toPropertyNo?: string;
}

/**
 * Payload for creating a single property via API
 */
export interface CreatePropertyPayload {
  wardId: number;
  propertyTypeId: number;
  categoryId: number;
  taxZoneId: number | null;
  propertyNo: string;
  ownerName: string;
  createdBy: number;
}

/**
 * Payload for bulk creating properties via API
 */
export interface BulkCreatePropertyPayload {
  wardId: number;
  propertyTypeId: number;
  categoryId: number;
  taxZoneId: number | null;
  fromPropertyNo: string;
  toPropertyNo: string;
  ownerName: string;
  createdBy: number;
}
