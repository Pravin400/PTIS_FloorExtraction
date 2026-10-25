 
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import type { AssetFieldValueSaveRequest } from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { AssetFieldValueSaveRequest };

/**
 * Service for managing Asset Field Value (EAV) records
 */
export const assetFieldValueService = {
  /**
   * Save a dynamic field value for an asset
   */
  saveFieldValue: async (data: AssetFieldValueSaveRequest): Promise<ApiResponse<AssetFieldValueSaveRequest | boolean>> => {
    return apiClient.post<AssetFieldValueSaveRequest | boolean>("/AssetFieldValue", data);
  },

  /**
   * Bulk save dynamic field values for an asset, eliminating N+1 API calls.
   */
  saveBulkFieldValues: async (assetId: number, data: AssetFieldValueSaveRequest[]): Promise<ApiResponse<boolean | number>> => {
    return apiClient.post<boolean | number>(`/AssetMaster/${assetId}/field-values/bulk`, data);
  },
};
