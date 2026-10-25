import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type {
  AssetDashboardTypeByCategory,
  AssetDashboardAssetByType,
  AssetDashboardDataResponseDto,
} from '@/types/assets/dashboard/master-dashboard/asset-dashboard-api.types';
import { ApiResponse } from '@/types/common.types';
import type { ZoneItem as Zone } from '@/types/zoneMaster.types';
import type { WardItem as Ward } from '@/types/wardMaster.types';

export type { Zone, Ward };

export interface AssetTypeAssetItemDto {
  id: number;
  assetName: string;
  capitalValue: number;
}

export interface AssetTypeDetailsResponse {
  totalCount: number;
  totalValuation: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  items: AssetTypeAssetItemDto[];
}


/** Build URL with optional query params, omitting null/undefined values */
function buildUrl(base: string, params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') sp.append(k, String(v));
  });
  return sp.toString() ? `${base}?${sp.toString()}` : base;
}

export const DEFAULT_CACHE_REVALIDATION = 60;

/** Returns appropriate RequestInit cache options */
function cacheFor(zoneId?: number | null, wardId?: number | null, zoneName?: string | null, wardName?: string | null): RequestInit {
  const isDynamic = (zoneId || wardId || zoneName || wardName);
  return isDynamic ? { cache: 'no-store' } : { next: { revalidate: DEFAULT_CACHE_REVALIDATION } };
}

/** GET /AssetDashboard */
export async function getAllDashboardData(
  zoneId?: number | null,
  wardId?: number | null,
  zoneName?: string | null,
  wardName?: string | null,
  categoryId?: number | null,
): Promise<AssetDashboardDataResponseDto> {
  const url = buildUrl('/AssetDashboard', { ZoneId: zoneId, WardId: wardId, ZoneName: zoneName, WardName: wardName, CategoryId: categoryId });
  const response = await apiClient.get<AssetDashboardDataResponseDto>(url, cacheFor(zoneId, wardId, zoneName, wardName));
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch dashboard data', 'Fetch failed');
  }
  return response.data;
}



/** GET /AssetDashboard/types-by-category */
export async function getTypesByCategory(
  categoryId?: number | null,
  zoneId?: number | null,
  wardId?: number | null,
  zoneName?: string | null,
  wardName?: string | null,
): Promise<AssetDashboardTypeByCategory[]> {
  const url = buildUrl('/AssetDashboard/types-by-category', { 
    CategoryId: categoryId, 
    ZoneId: zoneId, 
    WardId: wardId, 
    ZoneName: zoneName, 
    WardName: wardName
  });
  const response = await apiClient.get<AssetDashboardTypeByCategory[]>(url, cacheFor(zoneId, wardId, zoneName, wardName));
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch types', 'Fetch types failed');
  }
  return response.data;
}

/** GET /AssetDashboard/assets-by-type */
export async function getAssetsByType(
  assetTypeId: number,
  zoneId?: number | null,
  wardId?: number | null,
  zoneName?: string | null,
  wardName?: string | null,
  assetId?: number | null,
): Promise<AssetDashboardAssetByType[]> {
  const url = buildUrl('/AssetDashboard/assets-by-type', { AssetTypeId: assetTypeId, ZoneId: zoneId, WardId: wardId, ZoneName: zoneName, WardName: wardName, AssetId: assetId });
  const response = await apiClient.get<AssetDashboardAssetByType[]>(url, cacheFor(zoneId, wardId, zoneName, wardName));
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch assets', 'Fetch assets failed');
  }
  return response.data;
}


/** GET /AssetDashboard/assets-by-type/details */
export async function getAssetsByTypeDetails(
  assetTypeId: number,
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<AssetTypeDetailsResponse> {
  const url = buildUrl('/AssetDashboard/assets-by-type/details', { assetTypeId, pageNumber, pageSize });
  const response = await apiClient.get<AssetTypeDetailsResponse>(url, { cache: 'no-store' });
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch asset details', 'Fetch asset details failed');
  }
  return response.data;
}

/**
 * Service for fetching Zone master data
 */
export const zoneService = {
  /**
   * Get all active Zones
   */
  getZones: async (): Promise<ApiResponse<Zone[]>> => {
    const response = await apiClient.get<{ items?: Zone[] } | Zone[]>("/Zone?IsActive=true&PageSize=-1");
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
    const response = await apiClient.get<{ items?: Ward[] } | Ward[]>(url);
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
