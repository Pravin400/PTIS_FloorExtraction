import { ApiResponse, PagedResponse } from "../common.types";

/**
 * Form model for creating and editing geography types
 * Used in UI forms to capture user input
 */
export interface GeographyTypeFormModel {
  id?: number; // Optional for create, required for update
  geographyTypeCode: string;
  geographyType: string;
  levelNo: number;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

/**
 * Server response model for geography type data
 * Represents the complete geography type record from the database
 */
export interface GeographyType {
  [key: string]: unknown;
  id: number;
  geographyTypeCode: string;
  geographyType: string;
  levelNo: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * Props for Geography Type list component
 * Note: the API does not support server-side sorting.
 */
export interface GeographyTypeProps extends Omit<PagedResponse<GeographyType>, 'items' | 'hasPrevious' | 'hasNext'> {
  data: GeographyType[];
}

export type PaginatedApiResponse<T> = ApiResponse<PagedResponse<T>>;
