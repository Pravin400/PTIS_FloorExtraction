/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import { AssetMasterResponse } from "@/types/asset-types/basic-info/asset-wizard.types";
import { FloorDetailApiResponse } from "@/types/asset/floor-details.types";

/**
 * Valuation API Service
 * Interacts with AssetMaster and related sub-services to provide real-time computed valuations.
 */
export const valuationApiService = {
  /**
   * Fetch full Asset details for a selected AssetId only
   */
  getAssetDetails: async (assetId: number): Promise<ApiResponse<AssetMasterResponse>> => {
    return apiClient.get<AssetMasterResponse>(`/AssetMaster/${assetId}`);
  },

  /**
   * Fetch floor construction and valuation details for a selected AssetId only
   */
  getFloorsByAsset: async (assetId: number): Promise<ApiResponse<FloorDetailApiResponse[]>> => {
    return apiClient.get<FloorDetailApiResponse[]>(`/AssetFloorDetails/by-asset/${assetId}`);
  },

  /**
   * Fetch dynamic inventory items count and live valuation totals for a selected AssetId only
   */
  getInventoryBatchesByAsset: async (assetId: number): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/asset-management/AssetInventory/batches/${assetId}`);
  },

  /**
   * Recalculate building Capital Value (CV) including floor details and child assets
   */
  calculateBuildingCV: async (assetId: number): Promise<ApiResponse<any>> => {
    return apiClient.post<any>('/AssetCapitalValue/building/calculate-cv', {
      buildingAssetId: assetId,
      forceRecalculate: true,
      createdBy: 0
    });
  },

  /**
   * Recalculate open plot Capital Value (CV) including plot details
   */
  calculatePlotCV: async (assetId: number): Promise<ApiResponse<any>> => {
    return apiClient.post<any>('/AssetCapitalValue/plot/calculate-cv', {
      assetId: assetId,
      createdBy: 0
    });
  },

  /**
   * Fetch parent asset valuation rollup (base value, floor count, sub-units CV, and inventory CV).
   * Read-only — sums already-calculated values, calculates/persists nothing.
   */
  getParentAssetValuation: async (parentAssetId: number): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/AssetCapitalValue/parent/${parentAssetId}/valuation`);
  }
};

