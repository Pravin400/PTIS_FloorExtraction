import { PagedResponse } from "./common.types";

export type { PagedResponse };

// ---------------------------------------------
// Age Factor CV Master
// ---------------------------------------------

export interface AgeFactorCVMaster {
  id: number;
  constructionTypeId: number;
  ageFrom: number;
  ageTo: number;
  factor: number;
  yearRangeCVId: number;
  constructionCode?: string;
  constructionDescription?: string;
  fromYear?: number;
  toYear?: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  yearRangeCVID?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface AgeFactorCVMasterUpdate {
  isActive: boolean;
  updatedBy: number;
  constructionTypeId: number;
  ageFrom: number;
  ageTo: number;
  factor: number;
  yearRangeCVId: number;
}

export interface AgeFactorCVMasterCreate {
  isActive: boolean;
  createdBy: number;
  constructionTypeId: number;
  ageFrom: number;
  ageTo: number;
  factor: number;
  yearRangeCVId: number;
}

export interface AgeFactorCVMasterQueryParams {
  id?: number;
  constructionTypeId?: number | number[];
  yearRangeCVId?: number;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
}

export interface AgeFactorCVBulkCreateItem {
  isActive: boolean;
  createdBy: number;
  constructionTypeId: number;
  ageFrom: number;
  ageTo: number;
  factor: number;
  yearRangeCVId: number;
}

export type BulkAgeFactorCVMasterCreate = AgeFactorCVBulkCreateItem[];

export interface AgeFactorCVBulkUpdateItem {
  id: number;
  data: {
    ageFactorId: number;
    constructionTypeId: number;
    ageFrom: number;
    ageTo: number;
    factor: number;
    yearRangeCVId: number;
    isActive: boolean;
    updatedBy: number;
  };
}
export interface AgeFactorCVMasterSearchParams {
    page?: string;
    pageSize?: string;
    q?: string;
    selectedYearRange?: string;
    /** Comma-separated list of selected construction type IDs */
    constructionType?: string;
    sortBy?: string;
    sortOrder?: string;
}

export interface PagePropsAgeFactor {
    searchParams: Promise<AgeFactorCVMasterSearchParams>;
}
export type BulkAgeFactorCVMasterUpdate = AgeFactorCVBulkUpdateItem[];
