import { PagedResponse } from "./common.types";

export interface UseType {
  id: number;
  typeOfUseCode: string;
  description: string;
  type: string;
  typeOfUseGroupId: number;
  searchKey: string;
  searchSequence: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  // UI-only computed field
  status?: boolean;
  [key: string]: unknown;
}

export interface UseFactorCVMaster {
  id: number;
  typeOfUseId: number;
  subTypeOfUseId: number;
  factor: number;
  yearRangeCVId: number;
  typeOfUseCode?: string;
  typeOfUseDescription?: string;
  type?: string;
  typeOfUseGroupId?: number;
  subTypeOfUseDescription?: string;
  fromYear?: number;
  toYear?: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

export interface UseFactorCVMasterUpdate {
  isActive: boolean;
  updatedBy: number;
  typeOfUseId: number;
  subTypeOfUseId: number;
  factor: number;
  yearRangeCVId: number;
}

export interface UseFactorCVMasterCreate {
  isActive: boolean;
  createdBy: number;
  typeOfUseId: number;
  subTypeOfUseId: number;
  factor: number;
  yearRangeCVId: number;
}

export interface UseFactorCVMasterQueryParams {
  id?: number;
  typeOfUseId?: number;
  subTypeOfUseId?: number;
  yearRangeCVId?: number;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
}

/**
 * Type for a single item in the bulk create payload
 */
export type UseFactorCVBulkCreateItem = UseFactorCVMasterCreate;

/**
 * Bulk Create payload is a root-level array of create items
 */
export type BulkUseFactorCVMasterCreate = UseFactorCVBulkCreateItem[];

/**
 * Type for a single item in the bulk update payload
 */
export interface UseFactorCVBulkUpdateItem {
  id: number;
  data: UseFactorCVMasterUpdate;
}

/**
 * Bulk Update payload is a root-level array of update items
 */
export type BulkUseFactorCVMasterUpdate = UseFactorCVBulkUpdateItem[];

export interface TypeOfUseQueryParams {
  id?: number;
  typeOfUseCode?: string;
  type?: string;
  typeOfUseGroupId?: number;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
}

export interface TypeOfUseResponse {
  id: number;
  typeOfUseCode: string;
  description: string;
  type?: string;
  typeOfUseGroupId?: number;
  searchKey?: string;
  searchSequence?: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  [key: string]: unknown;
}

export type { PagedResponse };
export interface UseCategoryCvPageProps {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        leftPage?: string;
        leftPageSize?: string;
        q?: string;
        selectedYearRange?: string;
        typeOfUseId?: string;
        sortBy?: string;
        sortOrder?: string;
        leftSortBy?: string;
        leftSortOrder?: string;
    }>;
}