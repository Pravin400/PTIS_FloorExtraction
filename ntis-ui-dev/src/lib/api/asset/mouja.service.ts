/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";

export interface Mouja {
  id: number;
  moujaName: string;
  moujaCode?: string;
  isActive?: boolean;
}

/**
 * Service for fetching Mouja master data
 */
export const moujaService = {
  /**
   * Get all active Moujas
   */
  getMoujas: async (): Promise<ApiResponse<Mouja[]>> => {
    const response = await apiClient.get<any>("/asset-management/mouja?pageSize=-1", { cacheStrategy: 300  } as any);
    if (response.success) {
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data?.items || response.data?.Items || response.data?.data || []);
      return { ...response, data: items };
    }
    return response;
  },
};
