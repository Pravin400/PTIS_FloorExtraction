export interface SubTypeOfUseMasterItem {
  id: number;
  typeOfUseId: number;
  description: string;
  searchSequence: number;
  isActive: boolean;
}

export type SubTypeOfUseMasterPayload = Omit<SubTypeOfUseMasterItem, 'id'>;

export interface SubTypeOfUseMasterListParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  TypeOfUseId?: number;
}

export interface SubTypeOfUseMasterListResponse {
  items: SubTypeOfUseMasterItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
