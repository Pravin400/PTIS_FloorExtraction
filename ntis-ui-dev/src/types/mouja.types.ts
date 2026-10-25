import { ApiResponse, PagedResponse } from "./common.types";

/**
 * Form model for creating and editing mouja
 * Used in UI forms to capture user input
 */
export interface MoujaFormModel {
  id?: number; // Optional for create, required for update
  moujaNo: string;
  moujaName: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

/**
 * Server response model for mouja data
 * Represents the complete mouja record from the database
 * Note: Index signature allows for extensibility at integration boundaries
 */
export interface Mouja {
  [key: string]: unknown;
  id: number;
  moujaNo: string;
  moujaName: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * API payload for creating a new mouja
 */
export interface MoujaCreatePayload {
  moujaNo: string;
  moujaName: string;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
}

/**
 * Props for Mouja Master list component
 * Extends PagedResponse with additional sort fields
 */
export interface MoujaProps extends Omit<PagedResponse<Mouja>, 'items' | 'hasPrevious' | 'hasNext'> {
  data: Mouja[];
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Paginated response wrapper for list endpoints
 */
export type PaginatedMoujaApiResponse<T> = ApiResponse<PagedResponse<T>>;
