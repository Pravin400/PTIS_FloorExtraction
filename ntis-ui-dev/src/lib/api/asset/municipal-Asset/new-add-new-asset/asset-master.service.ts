 
import { apiClient } from '@/services/api.service';
import {
  AssetMasterRequest,
  AssetMasterResponse,
} from '@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types';
import { ApiResponse } from '@/types/common.types';
import type {
  AssetDashboardStatsDto,
  PagedAssetMasterResponse,
} from '@/types/asset/municipal-Asset/new-add-new-asset/asset-register.types';
import {
  isFormData,
  sendAssetMasterFormData,
} from './asset-master-formdata.helper';

/**
 * Service for managing Asset Master records
 */
export const assetMasterService = {
  /**
   * Create a new Asset Master record
   */
  createAsset: async (
    data: AssetMasterRequest | Partial<AssetMasterRequest> | FormData
  ): Promise<ApiResponse<AssetMasterResponse>> => {
    if (!isFormData(data)) {
      return apiClient.post<AssetMasterResponse>('/AssetMaster', data);
    }
    return sendAssetMasterFormData('/AssetMaster', 'POST', data);
  },

  /**
   * Get all Asset Master records
   */
  getAllAssets: async (): Promise<ApiResponse<AssetMasterResponse[]>> => {
    return apiClient.get<AssetMasterResponse[]>('/AssetMaster');
  },

  /**
   * Get a single Asset Master record by ID
   */
  getAssetById: async (id: number): Promise<ApiResponse<AssetMasterResponse>> => {
    return apiClient.get<AssetMasterResponse>(`/AssetMaster/${id}`);
  },

  /**
   * Update an existing Asset Master record
   */
  updateAsset: async (
    id: number,
    data: Partial<AssetMasterRequest> | FormData
  ): Promise<ApiResponse<AssetMasterResponse>> => {
    if (!isFormData(data)) {
      return apiClient.put<AssetMasterResponse>(`/AssetMaster/${id}`, data);
    }
    return sendAssetMasterFormData(`/AssetMaster/${id}`, 'PUT', data);
  },

  /**
   * Delete an Asset Master record
   */
  deleteAsset: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/AssetMaster/${id}`);
  },

  /**
   * Activate an asset and all its child records
   */
  activateAsset: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.put<void>(`/AssetMaster/${id}/activate`);
  },

  /**
   * Get paginated Asset Master records
   */
  getPagedAssets: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      assetCategoryId?: number;
      assetTypeId?: number;
      departmentId?: number;
      zoneId?: number;
      wardId?: number;
      isActive?: boolean;
    } = {}
  ): Promise<ApiResponse<PagedAssetMasterResponse>> => {
    const queryParams: Record<string, string> = {};
    if (params.page !== undefined) queryParams.page = String(params.page);
    if (params.limit !== undefined) queryParams.limit = String(params.limit);
    if (params.search) queryParams.search = params.search;
    if (params.assetCategoryId !== undefined) queryParams.assetCategoryId = String(params.assetCategoryId);
    if (params.assetTypeId !== undefined) queryParams.assetTypeId = String(params.assetTypeId);
    if (params.departmentId !== undefined) queryParams.departmentId = String(params.departmentId);
    if (params.zoneId !== undefined) queryParams.zoneId = String(params.zoneId);
    if (params.wardId !== undefined) queryParams.wardId = String(params.wardId);
    if (params.isActive !== undefined) queryParams.isActive = String(params.isActive);

    const qs = new URLSearchParams(queryParams).toString();
    return apiClient.get<PagedAssetMasterResponse>(`/AssetMaster/paged${qs ? `?${qs}` : ''}`);
  },

  /**
   * Alias for paginated asset lookup (used across actions and SSR)
   */
  getAllAssetsPaginated: async (
    params: {
      page?: number;
      limit?: number;
      pageSize?: number;
      search?: string;
      searchTerm?: string;
      assetCategoryId?: number;
      assetTypeId?: number;
      departmentId?: number;
      zoneId?: number;
      wardId?: number;
      isActive?: boolean;
    } = {}
  ): Promise<ApiResponse<PagedAssetMasterResponse>> => {
    return assetMasterService.getPagedAssets({
      page: params.page,
      limit: params.limit ?? params.pageSize,
      search: params.search ?? params.searchTerm,
      assetCategoryId: params.assetCategoryId,
      assetTypeId: params.assetTypeId,
      departmentId: params.departmentId,
      zoneId: params.zoneId,
      wardId: params.wardId,
      isActive: params.isActive,
    });
  },

  /**
   * Get Asset Dashboard Stats
   */
  getDashboardStats: async (): Promise<ApiResponse<AssetDashboardStatsDto>> => {
    return apiClient.get<AssetDashboardStatsDto>('/AssetMaster/dashboard/stats');
  },

  /**
   * Check if Asset Code is unique
   */
  checkCodeUnique: async (
    code: string,
    excludeId?: number
  ): Promise<ApiResponse<{ isUnique: boolean }>> => {
    const queryParams: Record<string, string> = { code };
    if (excludeId !== undefined) queryParams.excludeId = String(excludeId);
    const qs = new URLSearchParams(queryParams).toString();
    return apiClient.get<{ isUnique: boolean }>(`/AssetMaster/check-code${qs ? `?${qs}` : ''}`);
  },

  /**
   * Export Asset Master records to Excel
   */
  exportToExcel: async (params?: {
    search?: string;
    assetCategoryId?: number;
    assetTypeId?: number;
    departmentId?: number;
    zoneId?: number;
    wardId?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<Blob>> => {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.assetCategoryId !== undefined) queryParams.assetCategoryId = String(params.assetCategoryId);
    if (params?.assetTypeId !== undefined) queryParams.assetTypeId = String(params.assetTypeId);
    if (params?.departmentId !== undefined) queryParams.departmentId = String(params.departmentId);
    if (params?.zoneId !== undefined) queryParams.zoneId = String(params.zoneId);
    if (params?.wardId !== undefined) queryParams.wardId = String(params.wardId);
    if (params?.isActive !== undefined) queryParams.isActive = String(params.isActive);

    const qs = new URLSearchParams(queryParams).toString();
    const res = await apiClient.fetch(`/AssetMaster/export${qs ? `?${qs}` : ''}`);
    if (!res.ok) {
      return { success: false, statusCode: res.status, error: 'Export failed' };
    }
    const blob = await res.blob();
    return { success: true, statusCode: res.status, data: blob };
  },

  /**
   * Download Excel Import Template
   */
  downloadTemplate: async (): Promise<ApiResponse<Blob>> => {
    const res = await apiClient.fetch('/AssetMaster/template');
    if (!res.ok) {
      return { success: false, statusCode: res.status, error: 'Download template failed' };
    }
    const blob = await res.blob();
    return { success: true, statusCode: res.status, data: blob };
  },

  /**
   * Import Asset Master records from Excel
   */
  importExcel: async (
    file: File
  ): Promise<
    ApiResponse<{
      successCount: number;
      errorCount: number;
      errors?: Array<{ row: number; field: string; message: string }>;
    }>
  > => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/AssetMaster/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export * from './asset-master-formdata.helper';
