/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import type { Zone } from "@/types/municipal-asset-service.types";
import type { ZoneAssetStatsDto } from "./asset-dashboard.service";

export type { Zone };

/**
 * Service for fetching Zone master data
 */
export const zoneService = {
  /**
   * Get all active Zones
   */
  getZones: async (): Promise<ApiResponse<Zone[]>> => {
    const response = await apiClient.get<{ items?: Zone[] } | Zone[]>("/Zone?IsActive=true&PageSize=-1", { cacheStrategy: 300  } as any);
    if (response.success && response.data) {
      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : (data.items || []);
      return { ...response, data: items };
    }
    return response as ApiResponse<Zone[]>;
  },

  /**
   * Get dynamic zone statistics data
   */
  getZoneData: async (): Promise<ApiResponse<ZoneAssetStatsDto[]>> => {
    return apiClient.get<ZoneAssetStatsDto[]>('/AssetDashboard/zone-stats');
  },

  /**
   * Get SubZones for Capital Value calculation, optionally filtered by Mouja
   */
  getSubZones: async (moujaId?: number | string | null): Promise<ApiResponse<unknown[]>> => {
    let url = "/asset-management/sub-zone-details-cv?pageSize=-1";
    if (moujaId && moujaId !== "all") {
      url += `&MoujaId=${moujaId}`;
    }
    const response = await apiClient.get<{ items?: unknown[] } | unknown[]>(url);
    if (response.success && response.data) {
      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : (data.items || []);
      return { ...response, data: items };
    }
    return response as ApiResponse<unknown[]>;
  },
};
