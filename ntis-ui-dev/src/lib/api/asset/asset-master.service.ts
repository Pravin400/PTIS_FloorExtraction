/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '@/services/api.service';
import {
  AssetMasterRequest,
  AssetMasterResponse,
} from '@/types/asset-types/basic-info/asset-wizard.types';
import { ApiResponse } from '@/types/common.types';
import type {
  AssetDashboardStatsDto,
  PagedAssetMasterResponse,
} from '@/types/asset-types/asset-register.types';
import { serverFetch } from '@/lib/utils/server-fetch';
import { getAppConfig } from '@/config/app.config';
import { cookies } from 'next/headers';

async function getAuthHeadersForFormData(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const csrf = cookieStore.get('csrf_token')?.value;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const cookieStr = cookieStore
    .getAll()
    .filter((c) =>
      /auth_token|refresh_token|session_id|csrf_token|\.AspNetCore\.Antiforgery/.test(c.name)
    )
    .map((c) => `${c.name.replace(/[^\x00-\x7F]/g, '')}=${c.value.replace(/[^\x00-\x7F]/g, '')}`)
    .join('; ');
  if (cookieStr) headers['Cookie'] = cookieStr;
  return headers;
}

/**
 * Service for managing Asset Master records
 */

export const assetMasterService = {
  /**
   * Create a new Asset Master record
   */
  createAsset: async (
    data: AssetMasterRequest | FormData
  ): Promise<ApiResponse<AssetMasterResponse>> => {
    const isDataFormData = data !== null && typeof data === 'object' && typeof (data as any).append === 'function' && typeof (data as any).entries === 'function';
    if (isDataFormData) {
      const config = getAppConfig();
      const baseUrl = config.api.baseUrl?.trim();
      if (!baseUrl)
        return { success: false, statusCode: 500, error: 'API base URL is not configured' };

      const url = `${baseUrl.replace(/\/$/, '')}/AssetMaster`;
      const headers = await getAuthHeadersForFormData();

      const safeFormData = new FormData();
      for (const [key, value] of (data as FormData).entries()) {
        if (typeof value === 'object' && value !== null && 'stream' in value) {
          try {
            const file = value as File;
            const chunks: any[] = [];
            const reader = file.stream().getReader();
            while (true) {
              const { done, value: chunk } = await reader.read();
              if (done) break;
              if (chunk) chunks.push(chunk);
            }
            safeFormData.append(
              key,
              new Blob(chunks, { type: file.type }),
              file.name || 'upload.jpg'
            );
          } catch (_e) {
            safeFormData.append(key, value);
          }
        } else {
          safeFormData.append(key, value);
        }
      }

      const response = await serverFetch(url, { method: 'POST', body: safeFormData, headers });
      let text = '';
      try {
        text = await response.text();
        let json: any = undefined;
        try {
          json = text ? JSON.parse(text) : undefined;
        } catch {
          // not JSON, keep raw text
        }
        if (!response.ok) {
          let errMessage =
            json?.message ||
            json?.detail ||
            json?.title ||
            json?.error ||
            (typeof json === 'string' ? json : undefined) ||
            (text && text.trim() ? text.trim() : 'An error occurred');

          if (json?.errors && typeof json.errors === 'object') {
            const firstKey = Object.keys(json.errors)[0];
            if (firstKey) {
              const firstErr = json.errors[firstKey];
              if (Array.isArray(firstErr) && firstErr.length > 0) errMessage = firstErr[0];
              else if (typeof firstErr === 'string') errMessage = firstErr;
            }
          }
          return { success: false, statusCode: response.status, error: errMessage };
        }
        return { success: true, statusCode: response.status, data: json };
      } catch (e: any) {
        return { success: false, statusCode: response.status, error: text || e?.message || 'Invalid server response' };
      }
    }
    return apiClient.post<AssetMasterResponse>('/AssetMaster', data);
  },

  /**
   * Get all Asset Master records (unpaginated)
   */
  getAllAssets: async (): Promise<ApiResponse<AssetMasterResponse[]>> => {
    return apiClient.get<AssetMasterResponse[]>('/AssetMaster');
  },

  /**
   * Get all Asset Master records with pagination and filters
   */
  getAllAssetsPaginated: async (
    params: {
      pageNumber?: number;
      pageSize?: number;
      assetCategoryId?: number | null;
      assetTypeId?: string | number | null;
      zoneId?: number | null;
      wardId?: number | null;
      owningDepartmentId?: number | null;
      searchTerm?: string;
      assetNo?: string;
      mpmsNo?: string;
      assetName?: string;
      address?: string;
      sortBy?: string;
      sortOrder?: string;
      isActive?: boolean;
      encroachmentStatus?: string | null;
    } = {}
  ): Promise<ApiResponse<PagedAssetMasterResponse>> => {
    const query = new URLSearchParams();
    query.set('PageNumber', String(params.pageNumber ?? 1));
    query.set('PageSize', String(params.pageSize ?? 10));
    query.set('IsActive', String(params.isActive ?? true));
    if (params.assetCategoryId) query.set('AssetCategoryId', String(params.assetCategoryId));
    if (params.assetTypeId) {
      String(params.assetTypeId)
        .split(',')
        .forEach((id) => {
          if (id.trim()) query.append('AssetTypeId', id.trim());
        });
    }
    if (params.zoneId) query.set('ZoneId', String(params.zoneId));
    if (params.wardId) query.set('WardId', String(params.wardId));
    if (params.owningDepartmentId) query.set('DepartmentId', String(params.owningDepartmentId));
    if (params.encroachmentStatus && params.encroachmentStatus !== 'all') {
      query.set('EncroachmentStatus', params.encroachmentStatus);
    }
    if (params.searchTerm?.trim()) {
      query.set('SearchTerm', params.searchTerm.trim());
      query.set('MpmsNo', params.searchTerm.trim());
    }
    if (params.assetNo?.trim()) {
      query.set('AssetNo', params.assetNo.trim());
      query.set('MpmsNo', params.assetNo.trim());
    }
    if (params.mpmsNo?.trim()) query.set('MpmsNo', params.mpmsNo.trim());
    if (params.assetName?.trim()) query.set('AssetName', params.assetName.trim());
    if (params.address?.trim()) query.set('Address', params.address.trim());
    if (params.sortBy) query.set('SortBy', params.sortBy);
    if (params.sortOrder) query.set('SortOrder', params.sortOrder);
    return apiClient.get<PagedAssetMasterResponse>(`/AssetMaster?${query.toString()}`);
  },

  /**
   * Get a single Asset Master record by ID
   */
  getAssetById: async (id: number): Promise<ApiResponse<AssetMasterResponse>> => {
    return apiClient.get<AssetMasterResponse>(`/AssetMaster/${id}`);
  },

  /**
   * Get dashboard statistics (category-wise counts, type breakdowns)
   * Endpoint: GET /AssetMaster/dashboard-stats
   */
  getDashboardStats: async (): Promise<ApiResponse<AssetDashboardStatsDto>> => {
    return apiClient.get<AssetDashboardStatsDto>('/AssetMaster/dashboard-stats', { cacheStrategy: 300,
     } as any);
  },

  /**
   * Real, backend-computed health scores for a batch of asset ids — used for child/sub-unit
   * rows, which are full AssetMaster rows with their own id but aren't part of a parent's
   * paginated list response and so never otherwise get a health score computed for them.
   */
  getHealthScoresBatch: async (
    assetIds: number[]
  ): Promise<ApiResponse<Array<{ assetId: number; healthScore: number; healthScoreRating: string }>>> => {
    return apiClient.post<Array<{ assetId: number; healthScore: number; healthScoreRating: string }>>(
      '/AssetMaster/health-scores/batch',
      assetIds
    );
  },

  /**
   * Update an existing Asset Master record
   */
  updateAsset: async (
    id: number,
    data: Partial<AssetMasterRequest> | FormData
  ): Promise<ApiResponse<AssetMasterResponse>> => {
    const isDataFormData = data !== null && typeof data === 'object' && typeof (data as any).append === 'function' && typeof (data as any).entries === 'function';
    if (isDataFormData) {
      const config = getAppConfig();
      const baseUrl = config.api.baseUrl?.trim();
      if (!baseUrl)
        return { success: false, statusCode: 500, error: 'API base URL is not configured' };

      const url = `${baseUrl.replace(/\/$/, '')}/AssetMaster/${id}`;
      const headers = await getAuthHeadersForFormData();

      const safeFormData = new FormData();
      for (const [key, value] of (data as FormData).entries()) {
        if (typeof value === 'object' && value !== null && 'stream' in value) {
          try {
            const file = value as File;
            const chunks: any[] = [];
            const reader = file.stream().getReader();
            while (true) {
              const { done, value: chunk } = await reader.read();
              if (done) break;
              if (chunk) chunks.push(chunk);
            }
            safeFormData.append(
              key,
              new Blob(chunks, { type: file.type }),
              file.name || 'upload.jpg'
            );
          } catch (_e) {
            safeFormData.append(key, value);
          }
        } else {
          safeFormData.append(key, value);
        }
      }

      const response = await serverFetch(url, { method: 'PUT', body: safeFormData, headers });
      let text = '';
      try {
        text = await response.text();
        let json: any = undefined;
        try {
          json = text ? JSON.parse(text) : undefined;
        } catch {
          // not JSON, keep raw text
        }
        if (!response.ok) {
          let errMessage =
            json?.message ||
            json?.detail ||
            json?.title ||
            json?.error ||
            (typeof json === 'string' ? json : undefined) ||
            (text && text.trim() ? text.trim() : 'An error occurred');

          if (json?.errors && typeof json.errors === 'object') {
            const firstKey = Object.keys(json.errors)[0];
            if (firstKey) {
              const firstErr = json.errors[firstKey];
              if (Array.isArray(firstErr) && firstErr.length > 0) errMessage = firstErr[0];
              else if (typeof firstErr === 'string') errMessage = firstErr;
            }
          }
          return { success: false, statusCode: response.status, error: errMessage };
        }
        return { success: true, statusCode: response.status, data: json };
      } catch (e: any) {
        return { success: false, statusCode: response.status, error: text || e?.message || 'Invalid server response' };
      }
    }
    return apiClient.put<AssetMasterResponse>(`/AssetMaster/${id}`, data);
  },

  /**
   * Activate an Asset Master record and all its related child records
   * Endpoint: PUT /AssetMaster/{id}/activate
   */
  activateAsset: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.put<void>(`/AssetMaster/${id}/activate`, {});
  },

  /**
   * Delete an Asset Master record
   */
  deleteAsset: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/AssetMaster/${id}`);
  },
};
