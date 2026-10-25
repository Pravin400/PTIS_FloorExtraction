/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import type { Ward } from "@/types/municipal-asset-service.types";

export type { Ward };

/**
 * Service for fetching Ward master data
 */
export const wardService = {
  /**
   * Get all active Wards
   */
  getWards: async (zoneId?: number | string | null): Promise<ApiResponse<Ward[]>> => {
    let url = "/Ward?IsActive=true&PageSize=-1";
    if (zoneId && zoneId !== "all") {
      url += `&ZoneId=${zoneId}`;
    }
    const response = await apiClient.get<{ items?: Ward[] } | Ward[]>(url, { cacheStrategy: 300  } as any);
    if (response.success && response.data) {
      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : (data.items || []);
      return { ...response, data: items };
    }
    return response as ApiResponse<Ward[]>;
  },
};
