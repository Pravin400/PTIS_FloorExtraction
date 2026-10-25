import { ApiResponse, PagedResponse } from "./common.types";
import type { UseType } from "./typeOfUse.types";

/**
 * PropertyType to TypeOfUse validation mapping
 * Represents the relationship between property types and type of use
 */
export interface PropertyTypeAndTypeOfUseValidation {
  id: number;
  propertyTypeId: number;
  typeOfUseId: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}

/** 
 * Form model for creating and editing property types
 * Used in UI forms to capture user input
 */
export interface PropertyTypeFormModel {
  id?: number; // Optional for create, required for update
  propertyDescription: string;
  descriptionEnglish?: string;
  propertyDescriptionEnglish?: string | null;
  type: string;
  propertyTypeGroup: string | null;
  searchSequence: number;
  propertyTypeCategoryId: number;
  isActive: boolean;
  updatedBy?: number;
}

/**
 * Server response model for property type data
 * Represents the complete property type record from the database
 * Note: Index signature allows for extensibility at integration boundaries
 */
export interface PropertyType {
  [key: string]: unknown;
  id: number;
  propertyDescription: string;
  descriptionEnglish?: string | null;
  propertyDescriptionEnglish?: string | null;
  type: string;
  propertyTypeGroup: string | null;
  searchSequence: number;
  propertyTypeCategoryId: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * API payload for creating a new property type
 */
export interface PropertyTypeCreatePayload {
  propertyDescription: string;
  descriptionEnglish?: string | null;
  propertyDescriptionEnglish?: string | null;
  type: string;
  propertyTypeGroup: string | null;
  searchSequence: number;
  propertyTypeCategoryId: number;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
}

/**
 * Props for Property Type list component
 * Extends PagedResponse with additional sort fields
 */
export interface PropertyTypeProps extends Omit<PagedResponse<PropertyType>, 'items' | 'hasPrevious' | 'hasNext'> {
  data: PropertyType[];
  sortBy?: string;
  sortOrder?: string;
  categories: import('./property-type-category.types').PropertyTypeCategory[];
  typeOfUseList: UseType[];
  typeOfUseValidation: PropertyTypeAndTypeOfUseValidation[];
}

/**
 * Paginated response wrapper for list endpoints
 */
export type PaginatedPropertyTypeApiResponse<T> = ApiResponse<PagedResponse<T>>;
