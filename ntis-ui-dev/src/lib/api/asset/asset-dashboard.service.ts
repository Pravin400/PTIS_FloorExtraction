/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type {
  
  
  AssetDashboardTypeByCategory,
  AssetDashboardAssetByType,
  
} from '@/types/asset-type/asset-dashboard-api.types';

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

/** Returns 'no-store' when any filter is active (avoids serving stale filtered data) */
function cacheFor(zoneId?: number | null, wardId?: number | null, zoneName?: string | null, wardName?: string | null): number | 'no-store' {
  return (zoneId || wardId || zoneName || wardName) ? 'no-store' : 60;
}

/** GET /AssetDashboard */
export async function getAllDashboardData(
  zoneId?: number | null,
  wardId?: number | null,
  zoneName?: string | null,
  wardName?: string | null,
): Promise<any> {
  const url = buildUrl('/AssetDashboard', { ZoneId: zoneId, WardId: wardId, ZoneName: zoneName, WardName: wardName });
  const response = await apiClient.get<any>(url, { cacheStrategy: cacheFor(zoneId, wardId, zoneName, wardName)  } as any);
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
    WardName: wardName,
    zone: zoneName,
    ward: wardName
  });
  const response = await apiClient.get<AssetDashboardTypeByCategory[]>(url, { cacheStrategy: cacheFor(zoneId, wardId, zoneName, wardName)  } as any);
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
  const response = await apiClient.get<AssetDashboardAssetByType[]>(url, { cacheStrategy: cacheFor(zoneId, wardId, zoneName, wardName)  } as any);
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch assets', 'Fetch assets failed');
  }
  return response.data;
}


/** GET /AssetDashboard/assets-by-type/details */
export async function getAssetsByTypeDetails(
  params: { assetCategoryId?: number; assetTypeId?: number; pageNumber?: number; pageSize?: number } | number,
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<any> {
  const assetCategoryId = typeof params === 'object' ? (params.assetCategoryId ?? 1) : 1;
  const assetTypeId = typeof params === 'object' ? params.assetTypeId : params;
  const page = typeof params === 'object' ? (params.pageNumber ?? pageNumber) : pageNumber;
  const size = typeof params === 'object' ? (params.pageSize ?? pageSize) : pageSize;

  const url = buildUrl('/AssetDashboard/assets-by-type/details', {
    assetCategoryId,
    assetTypeId,
    pageNumber: page,
    pageSize: size,
  });

  const response = await apiClient.get<any>(url, { cacheStrategy: 'no-store'  } as any);
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch asset details', 'Fetch asset details failed');
  }
  return response.data;
}

export interface ZoneAssetStatsDto {
  id: number | string;
  name: string;
  type?: string | null;
  totalAssets?: number | null;
  buildingCount?: number | null;
  landCount?: number | null;
  infrastructureCount?: number | null;
  movableCount?: number | null;
  assetValue?: number | null;
  healthScore?: number | null;
  collectionEff?: number | null;
  status?: string | null;
}

/** GET /AssetDashboard/zone-stats */
export async function getZoneStats(): Promise<ZoneAssetStatsDto[]> {
  const response = await apiClient.get<ZoneAssetStatsDto[]>('/AssetDashboard/zone-stats');
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch zone stats', 'Fetch zone stats failed');
  }
  return response.data;
}

