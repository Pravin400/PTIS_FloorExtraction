 
import { apiClient } from '@/services/api.service';
import { ApiResponse } from '@/types/common.types';
import type {
  AssetConditionMasterDto,
  AssetConditionMasterListResponse,
} from '@/types/asset/municipal-Asset/new-add-new-asset';

export type {
  AssetConditionMasterDto,
  AssetConditionMasterListResponse,
};

export const assetConditionMasterService = {
  getAll: async (params?: { conditionCategory?: string; categoryId?: number; isActive?: boolean }): Promise<ApiResponse<AssetConditionMasterListResponse>> => {
    const q = new URLSearchParams();
    if (params?.conditionCategory) q.set('ConditionCategory', params.conditionCategory);
    if (params?.categoryId) q.set('CategoryId', params.categoryId.toString());
    if (params?.isActive !== undefined) q.set('IsActive', params.isActive.toString());
    q.set('PageSize', '-1');

    const queryString = q.toString();
    return apiClient.get<AssetConditionMasterListResponse>(
      `/AssetConditionMaster?${queryString}`
    );
  }
};
