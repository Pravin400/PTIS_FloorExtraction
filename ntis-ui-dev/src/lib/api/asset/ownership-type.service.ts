/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";

export interface OwnershipType {
  id: number;
  code?: string;
  name?: string;
  ownershipTypeName?: string;
  description?: string;
  isActive: boolean;
}

/**
 * Service for fetching Ownership Type master data
 */
export const ownershipTypeService = {
  /**
   * Get all active Ownership Types
   */
  getOwnershipTypes: async (): Promise<ApiResponse<OwnershipType[]>> => {
    const response = await apiClient.get<any>("/OwnershipType?pageSize=-1", { cacheStrategy: 300  } as any);
    if (response.success) {
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data?.items || response.data?.Items || response.data?.data || []);
      return { ...response, data: items };
    }
    return response;
  },
};
