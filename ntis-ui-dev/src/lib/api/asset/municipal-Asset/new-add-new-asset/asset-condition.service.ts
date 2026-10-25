 
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import type {
  AssetConditionOption,
  InventoryConditionOption,
  RawConditionMasterItem,
} from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { AssetConditionOption, InventoryConditionOption, RawConditionMasterItem };

/**
 * Service for fetching Asset Condition master data (AMS.AssetConditionMaster).
 * ConditionCategory is a discriminator ('Asset' | 'Inventory'); for 'Asset' rows, CategoryId is the
 * AssetCategoryMaster id the condition scale applies to (e.g. Buildings vs Land & Plots have
 * different scales), so the Add-Asset wizard must pass the selected Asset Category's id.
 */

export const assetConditionService = {
  getAssetConditions: async (assetCategoryId?: number | string | null): Promise<ApiResponse<AssetConditionOption[]>> => {
    let url = "/AssetConditionMaster?pageSize=-1&ConditionCategory=Asset&SortBy=DisplayOrder";
    if (assetCategoryId) {
      url += `&CategoryId=${assetCategoryId}`;
    }
    const response = await apiClient.get<{ items?: AssetConditionOption[] } | AssetConditionOption[]>(url);
    if (response.success && response.data) {
      const data = response.data;
      const items = Array.isArray(data) ? data : (data.items || []);
      return { ...response, data: items };
    }
    return response as ApiResponse<AssetConditionOption[]>;
  },

  /**
   * Inventory condition grades for the Furniture & Fixtures screen.
   */
  getInventoryConditions: async (): Promise<ApiResponse<InventoryConditionOption[]>> => {
    const url = "/AssetConditionMaster?pageSize=-1&ConditionCategory=Inventory&SortBy=DisplayOrder";
    const response = await apiClient.get<{ items?: RawConditionMasterItem[] } | RawConditionMasterItem[]>(url);
    if (response.success && response.data) {
      const data = response.data;
      const items: RawConditionMasterItem[] = Array.isArray(data) ? data : (data.items || []);
      const mapped: InventoryConditionOption[] = items.map((c: RawConditionMasterItem) => ({
        id: c.id,
        inventoryItemCategoryId: c.categoryId ?? c.CategoryId ?? 0,
        conditionName: c.conditionName ?? c.ConditionName ?? "",
        description: c.description ?? c.Description ?? null,
        conditionFactor: Number(c.conditionFactor ?? c.ConditionFactor ?? 1),
        displayOrder: c.displayOrder ?? c.DisplayOrder ?? null,
        isActive: c.isActive ?? c.IsActive ?? true,
      }));
      return { ...response, data: mapped };
    }
    return response as ApiResponse<InventoryConditionOption[]>;
  },
};
