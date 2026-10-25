// Asset-specific types that extend the shared useCategoryCvFactor.types.ts
// Re-export all shared types so downstream imports from this path still work
export * from "@/types/useCategoryCvFactor.types";



export interface TypeOfUseCreate {
  assetCategoryId?: number;
  assetTypeId?: number;
  typeOfUseGroupId?: number;
  typeOfUseGroupCVId?: number;
  typeOfUseCode: string;
  description: string;
  type?: string;
  searchSequence?: number;
  isActive?: boolean;
}

export interface TypeOfUseUpdate {
  assetCategoryId?: number;
  assetTypeId?: number;
  typeOfUseGroupId?: number;
  typeOfUseGroupCVId?: number;
  typeOfUseCode: string;
  description: string;
  type?: string;
  searchSequence?: number;
  isActive?: boolean;
}

export interface SubTypeOfUseQueryParams {
  id?: number;
  typeOfUseId?: number;
  description?: string;
  searchSequence?: number;
  isActive?: boolean;
  markedForDeletion?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
}

export interface SubTypeOfUseResponse {
  id: number;
  typeOfUseId: number;
  description: string;
  searchSequence?: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  [key: string]: unknown;
}

export interface SubTypeOfUseCreate {
  typeOfUseId: number;
  description: string;
  searchSequence?: number;
  isActive?: boolean;
}

export interface SubTypeOfUseUpdate {
  typeOfUseId: number;
  description: string;
  searchSequence?: number;
  isActive?: boolean;
}
