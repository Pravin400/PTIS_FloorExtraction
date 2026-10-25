/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse } from "@/types/common.types";
import { apiClient } from "@/services/api.service";
import type {
  CreateAssetRoomWiseMinusDataDto,
  AssetRoomWiseMinusDataDto,
  PagedResult,
} from "@/types/asset/municipal-Asset/new-add-new-asset";

export type {
  CreateAssetRoomWiseMinusDataDto,
  AssetRoomWiseMinusDataDto,
  PagedResult,
};

// ============ Unwrapping Helper ============
async function unwrapResponse<T>(res: ApiResponse<any>): Promise<ApiResponse<T>> {
  if (!res.success) {
    return {
      success: false,
      statusCode: res.statusCode,
      error: res.error || res.message,
      message: res.message || res.error,
    };
  }
  const body = res.data as any;
  return {
    success: true,
    statusCode: res.statusCode,
    data: body?.items ?? body?.data ?? (body as T),
    message: body?.message ?? res.message,
  };
}

// ============ Service ============

/**
 * AssetRoomWiseMinusData API Service
 * Handles CRUD operations for room-wise offsets / minus data (SSR only)
 */
export const assetRoomWiseMinusDataService = {
  /**
   * Get paged minus data entries, optionally filtered by room submission ID
   */
  getAll: async (
    roomWiseSubmissionId?: number
  ): Promise<ApiResponse<PagedResult<AssetRoomWiseMinusDataDto>>> => {
    const query = roomWiseSubmissionId ? `?RoomWiseSubmissionId=${roomWiseSubmissionId}` : "";
    const res = await apiClient.get(`/AssetRoomWiseMinusData${query}`);
    return unwrapResponse<PagedResult<AssetRoomWiseMinusDataDto>>(res);
  },

  /**
   * Create a new minus data entry
   */
  create: async (
    data: CreateAssetRoomWiseMinusDataDto
  ): Promise<ApiResponse<AssetRoomWiseMinusDataDto>> => {
    const res = await apiClient.post('/AssetRoomWiseMinusData', data);
    return unwrapResponse<AssetRoomWiseMinusDataDto>(res);
  },

  /**
   * Update an existing minus data entry
   */
  update: async (
    id: number,
    data: Partial<CreateAssetRoomWiseMinusDataDto>
  ): Promise<ApiResponse<AssetRoomWiseMinusDataDto>> => {
    const res = await apiClient.put(`/AssetRoomWiseMinusData/${id}`, data);
    return unwrapResponse<AssetRoomWiseMinusDataDto>(res);
  },

  /**
   * Delete a minus data entry
   */
  delete: async (
    id: number
  ): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete(`/AssetRoomWiseMinusData/${id}`);
    return unwrapResponse<void>(res);
  },
};

export default assetRoomWiseMinusDataService;
