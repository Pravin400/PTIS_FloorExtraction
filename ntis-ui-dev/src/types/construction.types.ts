import { ApiResponse, PagedResponse } from "./common.types";


/** 
 * Form model for creating and editing construction types
 * Used in UI forms to capture user input
 */
export interface ConstructionTypeFormModel {
  id?: number; // Optional for create, required for update
  constructionCode: string;
  description: string;
  descriptionEnglish?: string;
  searchSequence: number;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

/**
 * Server response model for construction type data
 * Represents the complete construction type record from the database
 * Note: Index signature allows for extensibility at integration boundaries
 */
export interface ConstructionType {
  [key: string]: unknown;
  id: number;
  constructionCode: string;
  description: string;
  descriptionEnglish?: string;
  searchSequence: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * API payload for creating a new construction type
 */
export interface ConstructionTypeCreatePayload {
  constructionCode: string;
  description: string;
  descriptionEnglish?: string;
  searchSequence: number;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
}

/**
 * Props for Construction Type list component
 * Extends PagedResponse with additional sort fields
 */
export interface ConstructionTypeProps extends Omit<PagedResponse<ConstructionType>, 'items' | 'hasPrevious' | 'hasNext'> {
  data: ConstructionType[];
  sortBy?: string;
  sortOrder?: string;
}
/**
 * Paginated response wrapper for list endpoints
 */
export type PaginatedApiResponse<T> = ApiResponse<PagedResponse<T>>;