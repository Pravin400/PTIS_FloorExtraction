/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  UnitCVRequestPayload,
  BuildingCVRequestPayload,
  MovableCVRequestPayload,
} from '@/types/asset/municipal-Asset/new-add-new-asset';

export type {
  UnitCVRequestPayload,
  BuildingCVRequestPayload,
  MovableCVRequestPayload,
};

import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";

export const capitalValueService = {
  calculateFloorCV: async (floorDetailId: number): Promise<ApiResponse<any>> => {
    return apiClient.post<any>("/AssetCapitalValue/calculate-cv", { floorDetailId });
  },

  calculateBuildingCV: async (payload: BuildingCVRequestPayload): Promise<ApiResponse<any>> => {
    return apiClient.post<any>("/AssetCapitalValue/building/calculate-cv", {
      buildingAssetId: payload.buildingAssetId,
      forceRecalculate: payload.forceRecalculate ?? true,
      createdBy: payload.createdBy ?? 1,
    });
  },

  calculateUnitCV: async (payload: UnitCVRequestPayload): Promise<ApiResponse<any>> => {
    return apiClient.post<any>("/AssetCapitalValue/unit/calculate-cv", payload);
  },

  calculateMovableCV: async (payload: MovableCVRequestPayload): Promise<ApiResponse<any>> => {
    return apiClient.post<any>("/AssetCapitalValue/movable/calculate-cv", {
      assetId: payload.assetId,
      valuationMethod: payload.valuationMethod ?? 1,
      conditionFactor: payload.conditionFactor ?? 1.0,
      depreciationRate: payload.depreciationRate,
      depreciation: payload.depreciation,
      createdBy: payload.createdBy ?? 1,
    });
  },

  getParentAssetValuation: async (parentAssetId: number): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/AssetCapitalValue/parent/${parentAssetId}/valuation`);
  },
};
