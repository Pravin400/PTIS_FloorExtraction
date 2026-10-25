export interface TypeOfUseMasterItem {
  id: number;
  assetTypeId: number;
  typeOfUseCode: string;
  typeOfUseGroupId: number;
  description: string;
  isActive: boolean;
}

export type TypeOfUseMasterPayload = Omit<TypeOfUseMasterItem, 'id'>;

export interface TypeOfUseMasterListParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  AssetTypeId?: number;
}

export interface TypeOfUseMasterListResponse {
  items: TypeOfUseMasterItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface AssetTypeOfUseGroupItem {
  id: number;
  typeOfUseGroupCode: string;
  groupName: string;
  groupIcon: string | null;
  isFloorWiseRateApplicable: boolean;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface AssetTypeOfUseGroupListResponse {
  items: AssetTypeOfUseGroupItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
