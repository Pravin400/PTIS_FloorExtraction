import 'server-only';

import { apiClient } from '@/services/api.service';
import type {
  ApiResponse,
  GisFilterGroup,
  GisKpiSummaryResponse,
  GisAssetFilterState,
  GisAssetGeometryDetails,
  GisAssetPopupDetailsDto,
} from '@/types/asset-gis-asset.types';

function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      query.set(key, String(value));
    }
  }
  const str = query.toString();
  return str ? `?${str}` : '';
}

export const assetGisService = {
  /**
   * Fetch dynamic cascading filters (Zones, Wards, Categories, Types)
   * GET /api/gis/asset/filters
   */
  async getFilters(
    zoneId?: number | string | null,
    assetCategoryId?: number | string | null
  ): Promise<ApiResponse<GisFilterGroup[]>> {
    const params: Record<string, unknown> = {};
    if (zoneId && zoneId !== 'all') params.zoneId = zoneId;
    if (assetCategoryId && assetCategoryId !== 'all') params.assetCategoryId = assetCategoryId;
    const qs = buildQueryString(params);
    const primaryRes = await apiClient.get<GisFilterGroup[] | { items?: GisFilterGroup[]; data?: GisFilterGroup[] }>(`/gis/asset/filters${qs}`, { cache: 'no-store' });
    if (primaryRes.success && primaryRes.data) {
      const raw = primaryRes.data;
      const data: GisFilterGroup[] = Array.isArray(raw) ? raw : (raw as { items?: GisFilterGroup[]; data?: GisFilterGroup[] })?.items ?? (raw as { items?: GisFilterGroup[]; data?: GisFilterGroup[] })?.data ?? [];
      if (Array.isArray(data) && data.length > 0) {
        return { success: true, data };
      }
    }
    return primaryRes as ApiResponse<GisFilterGroup[]>;
  },

  /**
   * Fetch Dynamic 6 KPI Cards metrics with Indian currency formatting & styling
   * GET /api/gis/asset/kpis
   */
  async getKpis(filters: GisAssetFilterState = {}): Promise<ApiResponse<GisKpiSummaryResponse>> {
    const params: Record<string, unknown> = {
      zoneId: filters.zoneId,
      wardId: filters.wardId,
      assetCategoryId: filters.assetCategoryId,
      assetTypeId: filters.assetTypeId,
      kpiCode: filters.kpiCode,
      financeYear: filters.financeYear,
      searchTerm: filters.searchTerm,
      encroachmentStatus: filters.encroachmentStatus,
    };
    const qs = buildQueryString(params);
    const primaryRes = await apiClient.get<GisKpiSummaryResponse | { items?: GisKpiSummaryResponse; data?: GisKpiSummaryResponse }>(`/gis/asset/kpis${qs}`, { cache: 'no-store' });
    if (primaryRes.success && primaryRes.data) {
      const raw = primaryRes.data;
      const payload = (typeof raw === 'object' && raw !== null && 'items' in raw ? (raw as { items?: GisKpiSummaryResponse }).items : undefined) ??
        (typeof raw === 'object' && raw !== null && 'data' in raw ? (raw as { data?: GisKpiSummaryResponse }).data : undefined) ??
        (raw as GisKpiSummaryResponse);
      return { success: true, data: payload, items: payload };
    }

    return primaryRes as ApiResponse<GisKpiSummaryResponse>;
  },

  /**
   * Single-Call Unified 360° Asset Popup Details
   * GET /api/gis/asset/AssetPopupDetails?assetId={assetId}
   */
  async getAssetPopupDetails(assetId: number | string): Promise<ApiResponse<GisAssetPopupDetailsDto>> {
    return apiClient.get<GisAssetPopupDetailsDto>(
      `/gis/asset/AssetPopupDetails?assetId=${encodeURIComponent(String(assetId))}`,
      { cache: 'no-store' }
    );
  },

  /**
   * Point-in-polygon coordinate identify lookup
   * GET /api/gis/asset/identify?lat={lat}&lng={lng}
   */
  async identifyAsset(lat: number, lng: number): Promise<ApiResponse<GisAssetGeometryDetails>> {
    return apiClient.get<GisAssetGeometryDetails>(
      `/gis/asset/identify?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
      { cache: 'no-store' }
    );
  },

  /**
   * Single asset geometry & centroid lookup
   * GET /api/gis/asset/geometry/{id}
   */
  async getAssetGeometry(targetId: string | number): Promise<ApiResponse<GisAssetGeometryDetails>> {
    return apiClient.get<GisAssetGeometryDetails>(
      `/gis/asset/geometry/${encodeURIComponent(String(targetId))}`,
      { cache: 'no-store' }
    );
  },

  /**
   * Construct dynamic filtered vector tile URL
   */
  buildTileUrl(filters: GisAssetFilterState = {}): string {
    const params: Record<string, unknown> = {
      zoneId: filters.zoneId,
      wardId: filters.wardId,
      assetCategoryId: filters.assetCategoryId,
      assetTypeId: filters.assetTypeId,
      kpiCode: filters.kpiCode,
      searchTerm: filters.searchTerm,
      encroachmentStatus: filters.encroachmentStatus,
    };
    const qs = buildQueryString(params);
    return `/api/gis/asset/tiles/{z}/{x}/{y}.mvt${qs}`;
  },

  /**
   * Reload asset spatial status and style cache into memory
   * POST /api/gis/asset/tiles/reload-status
   */
  async reloadStatus(): Promise<ApiResponse<string>> {
    return apiClient.post<string>('/gis/asset/tiles/reload-status', {});
  },

  /**
   * Diagnostic endpoint for spatial tile engine status
   * GET /api/gis/asset/tiles/debug
   */
  async getTileDebugInfo(): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>('/gis/asset/tiles/debug', { cache: 'no-store' });
  },

  /**
   * Streaming upload of Asset GeoJSON spatial polygons
   * POST /api/gis/asset/upload-geojson?mode={mode}
   */
  async uploadGeoJson(formData: FormData, mode = 'replace'): Promise<ApiResponse<unknown>> {
    try {
      const response = await apiClient.fetch(`/gis/asset/upload-geojson?mode=${encodeURIComponent(mode)}`, {
        method: 'POST',
        headers: {
          'X-Client-Timeout': '600000',
        },
        body: formData,
        cache: 'no-store',
      });

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          message: response.statusText,
          errors: [response.statusText],
        };
      }

      const data = await response.json();
      return {
        success: data?.success ?? true,
        statusCode: response.status,
        data: data?.items ?? data?.data ?? data,
        items: data?.items ?? data?.data ?? data,
        message: data?.message,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload GeoJSON file';
      return {
        success: false,
        statusCode: 500,
        message: errorMsg,
        errors: [errorMsg],
      };
    }
  },

  /**
   * Export Asset GIS Excel report (returns base64 string)
   * GET /api/gis/asset/export-excel
   */
  async exportExcel(filters: Record<string, unknown> = {}, options?: RequestInit): Promise<ApiResponse<string>> {
    try {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null && v !== '' && v !== 'all') {
          params.append(k, String(v));
        }
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.fetch(`/gis/asset/export-excel${qs}`, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        ...options,
      });

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          message: response.statusText,
          errors: [response.statusText],
        };
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return { success: true, data: base64 };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export asset Excel report';
      return {
        success: false,
        statusCode: 500,
        message: errorMsg,
        errors: [errorMsg],
      };
    }
  },
};

export const AssetGisService = assetGisService;
