'use client';

import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';
import {
  GisFilterGroup,
  GisKpiSummaryResponse,
  GisAssetFilterState,
  GisAssetPopupDetailsDto,
  GisCorporationConfigDto,
  GisDepartmentKpiMappingDto,
  GisDepartmentFilterMappingDto,
  GisLayerMasterDto,
} from '@/types/asset-gis-asset.types';
import {
  getAssetGisFiltersAction,
  getAssetGisKpisAction,
  getAssetPopupDetailsAction,
  identifyAssetAction,
  exportAssetGisExcelAction,
  getGisCorporationConfigAction,
  getGisDepartmentKpiMappingsAction,
  getGisDepartmentFilterMappingsAction,
  getGisLayerMastersAction,
} from '@/app/[locale]/assets/gismapviewer/actions';

export const assetGisQueryKeys = {
  all: ['asset-gis'] as const,
  corporationConfig: () => [...assetGisQueryKeys.all, 'corp-config'] as const,
  departmentKpis: (deptId?: string | number | null) => [...assetGisQueryKeys.all, 'dept-kpi-mappings', String(deptId || 'all')] as const,
  departmentFilters: (deptId?: string | number | null) => [...assetGisQueryKeys.all, 'dept-filter-mappings', String(deptId || 'all')] as const,
  layerMasters: () => [...assetGisQueryKeys.all, 'layer-masters'] as const,
  filters: (zoneId?: string | number | null, categoryId?: string | number | null) =>
    [...assetGisQueryKeys.all, 'filters', zoneId, categoryId] as const,
  kpis: (filters: GisAssetFilterState) =>
    [...assetGisQueryKeys.all, 'kpis', filters] as const,
  popup: (assetId: string | number) =>
    [...assetGisQueryKeys.all, 'popup', String(assetId)] as const,
  geometry: (targetId: string | number) =>
    [...assetGisQueryKeys.all, 'geometry', String(targetId)] as const,
};

function unwrapResponse<T>(res: unknown): T | null {
  if (!res) return null;
  let val = res as Record<string, unknown>;
  if (val.success !== undefined && val.data !== undefined) {
    val = val.data as Record<string, unknown>;
  } else if (val.items !== undefined) {
    val = val.items as Record<string, unknown>;
  } else if (val.data !== undefined) {
    val = val.data as Record<string, unknown>;
  }

  // Handle double-wrapping from backend ApiResponse<T>
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const valObj = val as Record<string, unknown>;
    if (valObj.data !== undefined && valObj.data !== null && typeof valObj.data === 'object') {
      val = valObj.data as Record<string, unknown>;
    } else if (valObj.items !== undefined && valObj.items !== null && Array.isArray(valObj.items)) {
      val = valObj.items as unknown as Record<string, unknown>;
    }
  }

  return val as unknown as T;
}

/**
 * Hook to fetch Corporation GIS Configuration
 * GET /api/GisCorporationConfig
 */
export function useGisCorporationConfig(
  options?: Partial<UseQueryOptions<GisCorporationConfigDto | null>>
) {
  return useQuery({
    queryKey: assetGisQueryKeys.corporationConfig(),
    queryFn: async (): Promise<GisCorporationConfigDto | null> => {
      const res = await getGisCorporationConfigAction();
      const data = unwrapResponse<GisCorporationConfigDto>(res);
      return data || null;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Master KPI Card Mappings for a Department
 * GET /api/GisDepartmentKpiMapping?DepartmentId={id}
 */
export function useGisDepartmentKpiMappings(
  departmentId?: number | string | null,
  options?: Partial<UseQueryOptions<GisDepartmentKpiMappingDto[]>>
) {
  return useQuery({
    queryKey: assetGisQueryKeys.departmentKpis(departmentId),
    queryFn: async (): Promise<GisDepartmentKpiMappingDto[]> => {
      const res = await getGisDepartmentKpiMappingsAction(departmentId || undefined);
      const data = unwrapResponse<GisDepartmentKpiMappingDto[] | { items?: GisDepartmentKpiMappingDto[] }>(res);
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) return data.items;
      return [];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Master Filter Mappings for a Department
 * GET /api/GisDepartmentFilterMapping?DepartmentId={id}
 */
export function useGisDepartmentFilterMappings(
  departmentId?: number | string | null,
  options?: Partial<UseQueryOptions<GisDepartmentFilterMappingDto[]>>
) {
  return useQuery({
    queryKey: assetGisQueryKeys.departmentFilters(departmentId),
    queryFn: async (): Promise<GisDepartmentFilterMappingDto[]> => {
      const res = await getGisDepartmentFilterMappingsAction(departmentId || undefined);
      const data = unwrapResponse<GisDepartmentFilterMappingDto[] | { items?: GisDepartmentFilterMappingDto[] }>(res);
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) return data.items;
      return [];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Master GIS Layers Definition
 * GET /api/GisLayerMaster
 */
export function useGisLayerMasters(
  options?: Partial<UseQueryOptions<GisLayerMasterDto[]>>
) {
  return useQuery({
    queryKey: assetGisQueryKeys.layerMasters(),
    queryFn: async (): Promise<GisLayerMasterDto[]> => {
      const res = await getGisLayerMastersAction();
      const data = unwrapResponse<GisLayerMasterDto[] | { items?: GisLayerMasterDto[] }>(res);
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) return data.items;
      return [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch dynamic cascading filters from /api/gis/asset/filters
 */
export function useAssetGisFilters(
  zoneId?: number | string | null,
  assetCategoryId?: number | string | null,
  options?: Partial<UseQueryOptions<GisFilterGroup[]>>
) {
  return useQuery({
    queryKey: assetGisQueryKeys.filters(zoneId, assetCategoryId),
    queryFn: async () => {
      const res = await getAssetGisFiltersAction(zoneId, assetCategoryId);
      const data = unwrapResponse<GisFilterGroup[] | { items?: GisFilterGroup[] }>(res);
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) return data.items;
      return [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch dynamic KPI metric cards from /api/gis/asset/kpis
 */
export function useAssetGisKpis(
  filters: GisAssetFilterState = {},
  options?: Partial<UseQueryOptions<GisKpiSummaryResponse>>
) {
  return useQuery({
    queryKey: assetGisQueryKeys.kpis(filters),
    queryFn: async (): Promise<GisKpiSummaryResponse> => {
      const res = await getAssetGisKpisAction(filters);
      const data = unwrapResponse<GisKpiSummaryResponse>(res);
      if (data && typeof data === 'object') {
        return data;
      }
      return { cards: [] };
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
    ...options,
  });
}

/**
 * Hook to fetch complete 360° asset popup details from /api/gis/asset/AssetPopupDetails
 */
export function useAssetPopupDetails(
  assetId: number | string | null | undefined,
  options?: Partial<UseQueryOptions<GisAssetPopupDetailsDto | null>>
) {
  const cleanId = assetId && !isNaN(Number(assetId)) && Number(assetId) > 0 ? Number(assetId) : null;
  return useQuery({
    queryKey: assetGisQueryKeys.popup(cleanId || 0),
    queryFn: async () => {
      if (!cleanId) return null;
      const res = await getAssetPopupDetailsAction(cleanId);
      const data = unwrapResponse<GisAssetPopupDetailsDto>(res);
      return data || null;
    },
    enabled: !!cleanId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to identify an asset by map click coordinates
 */
export function useAssetIdentify() {
  return useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      const res = await identifyAssetAction(lat, lng);
      if (!res.success) throw new Error((res as { error?: string }).error || 'Failed to identify asset');
      const resObj = res as unknown as Record<string, unknown>;
      return (resObj.items || resObj.data || null) as unknown;
    },
  });
}

/**
 * Hook to export filtered GIS assets into .xlsx spreadsheet
 */
export function useAssetExportExcel() {
  return useMutation({
    mutationFn: async (filters: GisAssetFilterState) => {
      const res = await exportAssetGisExcelAction(filters);
      if (!res.success || !res.data) throw new Error((res as { error?: string }).error || 'Export failed');
      
      const byteCharacters = atob(res.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GIS_Assets_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

/**
 * Hook to fetch tile engine debug diagnostics
 * GET /api/gis/asset/tiles/debug
 */
export function useGisTileDebugInfo() {
  return useQuery({
    queryKey: ['gis-tile-debug'],
    queryFn: async () => {
      const { getGisTileDebugAction } = await import('@/app/[locale]/assets/gismapviewer/actions');
      const res = await getGisTileDebugAction();
      return unwrapResponse<Record<string, unknown>>(res);
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to reload spatial status cache
 * POST /api/gis/asset/tiles/reload-status
 */
export function useGisReloadStatus() {
  return useMutation({
    mutationFn: async () => {
      const { reloadGisStatusAction } = await import('@/app/[locale]/assets/gismapviewer/actions');
      const res = await reloadGisStatusAction();
      if (!res.success) throw new Error((res as { error?: string }).error || 'Failed to reload status cache');
      return res;
    },
  });
}

/**
 * Hook to upload Asset GeoJSON polygon stream
 * POST /api/gis/asset/upload-geojson
 */
export function useUploadAssetGeoJson() {
  return useMutation({
    mutationFn: async ({ formData, mode = 'replace' }: { formData: FormData; mode?: string }) => {
      const { uploadAssetGeoJsonAction } = await import('@/app/[locale]/assets/gismapviewer/actions');
      const res = await uploadAssetGeoJsonAction(formData, mode);
      if (!res.success) throw new Error((res as { error?: string }).error || 'GeoJSON upload failed');
      const resObj = res as unknown as Record<string, unknown>;
      return resObj.data || resObj.items || res;
    },
  });
}
