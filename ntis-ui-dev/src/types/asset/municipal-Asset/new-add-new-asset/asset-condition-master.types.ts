export interface AssetConditionMasterDto {
  id: number;
  conditionCategory: string;
  categoryId: number;
  conditionName: string;
  description: string;
  conditionFactor: number;
  displayOrder: number;
  isActive: boolean;
}

export interface AssetConditionMasterListResponse {
  items: AssetConditionMasterDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
