import { ApiResponse, PagedResponse } from "./common.types";

/**
 * Server response model for property type category data
 * Represents the complete property type category record from the database
 */
export interface PropertyTypeCategory {
  id: number;
  propertyTypeCategory: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * Paginated response wrapper for property type category list endpoints
 */
export type PropertyTypeCategoryResponse = ApiResponse<PagedResponse<PropertyTypeCategory>>;

/**
 * Option type for dropdown/select components
 */
export interface PropertyTypeCategoryOption {
  label: string;
  value: number;
}
