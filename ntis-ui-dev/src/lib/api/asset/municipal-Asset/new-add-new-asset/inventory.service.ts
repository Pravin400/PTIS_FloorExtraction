/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  InventoryItemCategory,
  InventoryItemCondition,
  InventoryItemName,
  InventoryItemModel,
} from '@/types/asset/municipal-Asset/new-add-new-asset';

export type {
  InventoryItemCategory,
  InventoryItemCondition,
  InventoryItemName,
  InventoryItemModel,
};

import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";









/**
 * Service for fetching Inventory Item master data
 * Follows the same pattern as wardService, zoneService etc.
 */
export const inventoryService = {
  /**
   * Get all Inventory Item Categories
   * GET /api/InventoryItemCategory
   */
  getCategories: async (): Promise<ApiResponse<InventoryItemCategory[]>> => {
    const response = await apiClient.get<any>("/InventoryItemCategory?IsActive=true&PageSize=-1", { cacheStrategy: 300 } as any);
    if (response.success && response.data) {
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data.items || response.data.Items || response.data.data || []);
      return { ...response, data: items };
    }
    return response;
  },

  /**
   * Get all Inventory Item Conditions
   * GET /api/InventoryItemCondition
   */
  getConditions: async (): Promise<ApiResponse<InventoryItemCondition[]>> => {
    const response = await apiClient.get<any>("/InventoryItemCondition?IsActive=true&PageSize=-1", { cacheStrategy: 300 } as any);
    if (response.success && response.data) {
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data.items || response.data.Items || response.data.data || []);
      return { ...response, data: items };
    }
    return response;
  },

  /**
   * Get all Inventory Item Names
   * GET /api/InventoryItemName
   */
  getItemNames: async (): Promise<ApiResponse<InventoryItemName[]>> => {
    const response = await apiClient.get<any>("/InventoryItemName?IsActive=true&PageSize=-1", { cacheStrategy: 300 } as any);
    if (response.success && response.data) {
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data.items || response.data.Items || response.data.data || []);
      return { ...response, data: items };
    }
    return response;
  },

  /**
   * Get all Inventory Item Models
   * GET /api/InventoryItemModel
   */
  getItemModels: async (): Promise<ApiResponse<InventoryItemModel[]>> => {
    const response = await apiClient.get<any>("/InventoryItemModel?IsActive=true&PageSize=-1", { cacheStrategy: 300 } as any);
    if (response.success && response.data) {
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data.items || response.data.Items || response.data.data || []);
      return { ...response, data: items };
    }
    return response;
  },
};
