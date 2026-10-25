import 'server-only';

/**
 * GIS Property Detail & Export Endpoints
 * Standard: Clean Architecture / Next.js Client-Server Compatible
 */

import { apiClient } from '@/services/api.service';
import { buildQueryString } from './helpers';
import { ApiResponse } from '@/types/common.types';

export const GisPropertyService = {
  async getPropertyDetail(
    ownerId: string | number,
    paramsOrOptions?: Record<string, unknown> | RequestInit,
    options?: RequestInit
  ): Promise<ApiResponse<unknown>> {
    try {
      let params: Record<string, unknown> | undefined;
      let opts: RequestInit | undefined = options;

      if (paramsOrOptions) {
        if ('cache' in paramsOrOptions || 'headers' in paramsOrOptions || 'method' in paramsOrOptions || 'signal' in paramsOrOptions) {
          opts = paramsOrOptions as RequestInit;
        } else {
          params = paramsOrOptions as Record<string, unknown>;
        }
      }

      const queryString = params ? buildQueryString(params) : '';
      const res = await apiClient.get<unknown>(`/GisPopup/property-detail/${encodeURIComponent(String(ownerId))}${queryString}`, opts);
      if (res.success && res.data) {
        const d = res.data as { items?: unknown; data?: unknown };
        if (typeof d === 'object' && d !== null) {
          return { ...res, data: d.items ?? d.data ?? res.data };
        }
      }
      return res;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, statusCode: 500, error: errMsg, message: errMsg };
    }
  },

  /**
   * Fetch property QC validation status
   */
  async getQcStatus(ownerId: string | number, options?: RequestInit): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>(`/GisPopup/qc-status/${encodeURIComponent(String(ownerId))}`, options);
  },

  /**
   * Fetch property tracking/history records
   */
  async getTracking(ownerId: string | number, options?: RequestInit): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>(`/GisPopup/tracking/${encodeURIComponent(String(ownerId))}`, options);
  },

  /**
   * Fetch property geometry centroid/coords
   */
  async getGeometry(id: string | number, options?: RequestInit): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>(`/GisTile/geometry?id=${encodeURIComponent(String(id))}`, options);
  },

  /**
   * Export Data to Excel
   */
  async exportExcel(params: Record<string, unknown>, options?: RequestInit): Promise<ApiResponse<Blob>> {
    try {
      const response = await apiClient.fetch('/GisDashboard/export-excel', {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ...(options?.headers as Record<string, string>),
        },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        return { success: false, statusCode: response.status, error: response.statusText, message: response.statusText };
      }
      const data = await response.blob();
      return { success: true, statusCode: response.status, data };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, statusCode: 500, error: errMsg, message: errMsg };
    }
  },

  /**
   * Search Properties
   */
  async searchProperties(query: string, type: string = 'OwnerID', options?: RequestInit): Promise<ApiResponse<unknown[]>> {
    try {
      const params = { query, type };
      const queryString = buildQueryString(params);
      const result = await apiClient.get<unknown>(`/GisDashboard/search${queryString}`, options);
      if (result.success && result.data && !Array.isArray(result.data)) {
        const obj = result.data as { items?: unknown[] };
        return { success: true, statusCode: result.statusCode, data: obj.items || [] };
      }
      return result as ApiResponse<unknown[]>;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, statusCode: 500, error: errMsg, message: errMsg, data: [] };
    }
  },

  /**
   * Fetch Top Defaulters
   */
  async getTopDefaulters(options?: RequestInit): Promise<ApiResponse<unknown[]>> {
    try {
      const result = await apiClient.get<unknown>('/GisDashboard/top-defaulters', options);
      if (result.success && result.data && !Array.isArray(result.data)) {
        const obj = result.data as { items?: unknown[] };
        return { success: true, statusCode: result.statusCode, data: obj.items || [] };
      }
      return result as ApiResponse<unknown[]>;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, statusCode: 500, error: errMsg, message: errMsg, data: [] };
    }
  },

  async getAssetKpiCounts(params?: Record<string, unknown>, options?: RequestInit): Promise<ApiResponse<unknown>> {
    try {
      const queryString = params ? buildQueryString(params) : '';
      return await apiClient.get<unknown>(`/GisDashboard/summary${queryString}`, options);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, statusCode: 500, error: errMsg, message: errMsg };
    }
  },

  async exportAssetExcel(params: unknown, options?: RequestInit): Promise<ApiResponse<Blob>> {
    try {
      const searchParams = new URLSearchParams();
      if (params && typeof params === 'object') {
        for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
          if (v !== undefined && v !== null && v !== '' && v !== 'all') {
            searchParams.append(k, String(v));
          }
        }
      }
      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const response = await apiClient.fetch(`/gis/asset/export-excel${qs}`, {
        ...options,
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ...(options?.headers as Record<string, string>),
        },
      });
      if (!response.ok) {
        return { success: false, statusCode: response.status, message: response.statusText, error: response.statusText };
      }
      const data = await response.blob();
      return { success: true, statusCode: response.status, data };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, statusCode: 500, message: errMsg, error: errMsg };
    }
  },
};

export const gisPropertyService = GisPropertyService;
