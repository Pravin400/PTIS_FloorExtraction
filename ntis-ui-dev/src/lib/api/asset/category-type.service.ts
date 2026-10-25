/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import type { AssetCategory } from "@/types/asset-type/asset-category.types";
import type { AssetType, ApiCategoryItem, ApiTypeItem } from "@/types/municipal-asset-service.types";

export type { AssetCategory, AssetType };

/**
 * Service for fetching Asset Categories and Types from Master Data
 */
export const categoryTypeService = {
  /**
   * Get all active Asset Categories
   */
  getCategories: async (): Promise<ApiResponse<AssetCategory[]>> => {
    const response = await apiClient.get<{ items?: ApiCategoryItem[] } | ApiCategoryItem[]>("/AssetCategory?IsActive=true&PageSize=-1", { cacheStrategy: 300  } as any);
    if (response.success && response.data) {
      const data = response.data;
      let items = Array.isArray(data) ? data : (data.items || []);
      items = items.filter((item) => 
        item.isActive !== false && 
        item.IsActive !== false && 
        item.status?.toLowerCase() !== 'inactive'
      );
      return { ...response, data: items };
    }
    return response as ApiResponse<AssetCategory[]>;
  },

  /**
   * Get all active Asset Types
   */
  getAllTypes: async (): Promise<ApiResponse<AssetType[]>> => {
    const response = await apiClient.get<{ items?: ApiTypeItem[] } | ApiTypeItem[]>("/AssetType?IsActive=true&PageSize=-1", { cacheStrategy: 300  } as any);
    if (response.success && response.data) {
      const data = response.data;
      let items = Array.isArray(data) ? data : (data.items || []);
      items = items.filter((item) => 
        item.isActive !== false && 
        item.IsActive !== false && 
        item.status?.toLowerCase() !== 'inactive'
      );
      return { ...response, data: items };
    }
    return response as ApiResponse<AssetType[]>;
  },

  /**
   * Get Asset Types filtered by Category ID
   */
  getTypesByCategory: async (categoryId: number): Promise<ApiResponse<AssetType[]>> => {
    const response = await apiClient.get<{ items?: ApiTypeItem[] } | ApiTypeItem[]>(`/AssetType?AssetCategoryId=${categoryId}&IsActive=true&PageSize=-1`);
    if (response.success && response.data) {
      const data = response.data;
      let items = Array.isArray(data) ? data : (data.items || []);
      items = items.filter((item) => 
        item.isActive !== false && 
        item.IsActive !== false && 
        item.status?.toLowerCase() !== 'inactive'
      );
      return { ...response, data: items };
    }
    return response as ApiResponse<AssetType[]>;
  }
};
