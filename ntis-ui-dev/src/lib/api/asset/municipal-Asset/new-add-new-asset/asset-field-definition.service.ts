 
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import type {
  AssetFieldDefinition,
  PagedAssetFieldDefinitionResponse,
} from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { AssetFieldDefinition, PagedAssetFieldDefinitionResponse };

/**
 * Service for managing Asset Field Definitions
 */
export const assetFieldDefinitionService = {
  /**
   * Get all Asset Field Definitions for a given category and type
   */
  getFieldDefinitions: async (
    categoryId: number,
    typeId: number
  ): Promise<ApiResponse<AssetFieldDefinition[]>> => {
    const res = await apiClient.get<PagedAssetFieldDefinitionResponse | AssetFieldDefinition[]>(
      `/AssetFieldDefinition?AssetCategoryId=${categoryId}&AssetTypeId=${typeId}&PageSize=1000&pageSize=1000`
    );
    if (!res.success) {
      return { success: false, statusCode: res.statusCode, error: res.error, data: [] };
    }
    const raw = res.data;
    const items: AssetFieldDefinition[] = Array.isArray(raw)
      ? raw
      : raw?.items
      ? raw.items
      : raw?.Items
      ? raw.Items
      : raw?.data
      ? raw.data
      : raw?.Data
      ? raw.Data
      : [];

    return {
      success: true,
      statusCode: res.statusCode,
      data: items,
    };
  },
};