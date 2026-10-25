import 'server-only';

/**
 * GIS Dashboard Endpoints
 * Standard: Clean Architecture / Next.js Client-Server Compatible
 */

import { apiClient } from '@/services/api.service';
import { buildQueryString } from './helpers';
import { ApiResponse } from '@/types/common.types';
import {
  isPropertyGroupShape,
  normalizePropertyGroup,
  isPropertyTypeMasterShape,
  normalizePropertyTypeMaster,
} from './asset-gis-types-guard';
import type { PropertyGroup, PropertyTypeMasterItem } from '@/types/asset-gis.types';

export const GisDashboardService = {
  /**
   * Fetch Initial Dashboard Data (Zones, Blocks, Categories)
   */
  async getDashboardInit(params: Record<string, unknown> = {}, options?: RequestInit): Promise<ApiResponse<unknown>> {
    const queryParams: Record<string, unknown> = {
      PropertyTypeID: params.propertyTypeId ?? params.PropertyTypeID ?? params.assetTypeId ?? params.AssetTypeId,
      AssetTypeId: params.propertyTypeId ?? params.PropertyTypeID ?? params.assetTypeId ?? params.AssetTypeId,
      WardNo: params.wardNo ?? params.WardNo,
      OwnerIDList: params.ownerIdListCsv ?? params.OwnerIDList,
    };
    const query = buildQueryString(queryParams);
    const res = await apiClient.get<unknown>(`/GisDashboard/init${query}`, options);
    if (res.success && res.data) {
      const obj = res.data as { items?: unknown };
      if (typeof obj === 'object' && obj !== null && 'items' in obj) {
        return { ...res, data: obj.items ?? res.data };
      }
    }
    return res;
  },

  /**
   * Fetch KPI Summary
   */
  async getKpiSummary(params: Record<string, unknown> = {}, options?: RequestInit): Promise<ApiResponse<unknown>> {
    const queryParams: Record<string, unknown> = {
      Category: params.category ?? params.Category,
      PropertyTypeGroup: params.propertyTypeGroup ?? params.PropertyTypeGroup,
      PropertyTypeID: params.propertyTypeId ?? params.PropertyTypeID ?? params.assetTypeId ?? params.AssetTypeId,
      AssetTypeId: params.propertyTypeId ?? params.PropertyTypeID ?? params.assetTypeId ?? params.AssetTypeId,
      ZoneId: params.zoneId ?? params.ZoneId,
      BlockId: params.blockId ?? params.BlockId,
      WardNo: params.wardNo ?? params.WardNo,
      StatusType: params.statusType ?? params.StatusType,
      AssessmentSubCategory: params.assessmentSubCategory ?? params.AssessmentSubCategory,
      DocumentSubmittedStatus: params.documentSubmittedStatus ?? params.DocumentSubmittedStatus,
    };
    const query = buildQueryString(queryParams);
    const res = await apiClient.get<unknown>(`/GisDashboard/kpi-summary${query}`, options);
    if (res.success && res.data) {
      const obj = res.data as { items?: unknown };
      if (typeof obj === 'object' && obj !== null && 'items' in obj) {
        return { ...res, data: obj.items ?? res.data };
      }
    }
    return res;
  },

  /**
   * Fetch Ward Summary
   */
  async getWardSummary(params: Record<string, unknown> = {}, options?: RequestInit): Promise<ApiResponse<unknown[]>> {
    const queryParams: Record<string, unknown> = {
      Category: params.category ?? params.Category,
      PropertyTypeGroup: params.propertyTypeGroup ?? params.PropertyTypeGroup,
      PropertyTypeID: params.propertyTypeId ?? params.PropertyTypeID ?? params.assetTypeId ?? params.AssetTypeId,
      AssetTypeId: params.propertyTypeId ?? params.PropertyTypeID ?? params.assetTypeId ?? params.AssetTypeId,
      ZoneId: params.zoneId ?? params.ZoneId,
      BlockId: params.blockId ?? params.BlockId,
      WardNo: params.wardNo ?? params.WardNo,
      StatusType: params.statusType ?? params.StatusType,
      AssessmentSubCategory: params.assessmentSubCategory ?? params.AssessmentSubCategory,
      DocumentSubmittedStatus: params.documentSubmittedStatus ?? params.DocumentSubmittedStatus,
    };
    const query = buildQueryString(queryParams);
    const res = await apiClient.get<unknown[] | { items?: unknown[] }>(`/GisDashboard/ward-summary${query}`, options);
    if (res.success && res.data) {
      const raw = res.data;
      const items = Array.isArray(raw) ? raw : (raw as { items?: unknown[] }).items ?? [];
      return { success: true, statusCode: res.statusCode, data: items };
    }
    return { success: res.success, statusCode: res.statusCode, error: res.error, message: res.error, data: [] };
  },

  /**
   * Fetch Unified Dashboard Data
   */
  async getUnifiedData(params: Record<string, unknown> = {}, options?: RequestInit): Promise<ApiResponse<unknown>> {
    const res = await apiClient.post<unknown>('/GisDashboard/data', params, options);
    if (res.success && res.data) {
      const payload = (typeof res.data === 'object' && res.data !== null && 'items' in res.data) ? (res.data as { items?: unknown }).items : res.data;
      return { ...res, data: payload };
    }
    return res;
  },

  /**
   * Fetch Property Groups
   */
  async getPropertyGroups(options?: RequestInit): Promise<ApiResponse<PropertyGroup[]>> {
    const res = await apiClient.get<unknown[] | { items?: unknown[] }>('/GisDashboard/property-groups', options);
    if (res.success && res.data) {
      const raw = res.data;
      const rawItems = Array.isArray(raw) ? raw : (raw as { items?: unknown[] }).items ?? [];
      const items = rawItems.filter(isPropertyGroupShape).map(normalizePropertyGroup);
      return { success: true, statusCode: res.statusCode, data: items };
    }
    return { success: res.success, statusCode: res.statusCode, error: res.error, message: res.error, data: [] };
  },

  /**
   * Fetch Property Types
   */
  async getPropertyTypeMasterList(
    type?: string,
    filters?: { zoneId?: string; blockId?: string },
    options?: RequestInit
  ): Promise<ApiResponse<PropertyTypeMasterItem[]>> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (filters?.zoneId && filters.zoneId !== 'all') params.append('ZoneId', filters.zoneId);
    if (filters?.blockId && filters.blockId !== 'all') params.append('BlockId', filters.blockId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<unknown[] | { items?: unknown[] }>(`/GisDashboard/property-types${query}`, options);
    if (res.success && res.data) {
      const raw = res.data;
      const rawItems = Array.isArray(raw) ? raw : (raw as { items?: unknown[] }).items ?? [];
      const items = rawItems.filter(isPropertyTypeMasterShape).map(normalizePropertyTypeMaster);
      return { success: true, statusCode: res.statusCode, data: items };
    }
    return { success: res.success, statusCode: res.statusCode, error: res.error, message: res.error, data: [] };
  },

  /**
   * Search Properties
   */
  async searchProperties(
    query: string,
    type: string = 'OwnerID',
    options?: RequestInit
  ): Promise<ApiResponse<unknown[]>> {
    const q = new URLSearchParams();
    q.set('query', query);
    q.set('type', type);
    return apiClient.get<unknown[]>(`/GisDashboard/search?${q.toString()}`, options);
  },

  /**
   * Fetch Top Defaulters
   */
  async getTopDefaulters(options?: RequestInit): Promise<ApiResponse<unknown[]>> {
    return apiClient.get<unknown[]>('/GisDashboard/top-defaulters', options);
  },

  /**
   * Fetch GIS Config
   */
  async getConfig(options?: RequestInit): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>('/gis/config', options);
  },

  /**
   * Export Dashboard Excel (returns base64 string)
   */
  async exportExcel(params: Record<string, unknown> = {}, options?: RequestInit): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.fetch('/GisDashboard/export-excel', {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        ...options,
      });

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: response.statusText,
        };
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return { success: true, data: base64 };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to export Excel report';
      return {
        success: false,
        statusCode: 500,
        error: errorMsg,
      };
    }
  },
};

export const gisDashboardService = GisDashboardService;
