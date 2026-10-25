/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  RentInformationDto,
  FloorConfigurationDto,
  RoomDetailDto,
  CreateSubUnitRequest,
  SubUnitResponseDto,
  BulkGenerateRequest,
  GeneratedAssetDto,
  BulkGenerateResponse,
} from '@/types/asset/municipal-Asset/new-add-new-asset';

export type {
  RentInformationDto,
  FloorConfigurationDto,
  RoomDetailDto,
  CreateSubUnitRequest,
  SubUnitResponseDto,
  BulkGenerateRequest,
  GeneratedAssetDto,
  BulkGenerateResponse,
};

import { ApiResponse } from "@/types/common.types";
import { apiClient } from "@/services/api.service";
import { serverFetch } from '@/lib/utils/server-fetch';
import { getAppConfig } from '@/config/app.config';
import { cookies } from 'next/headers';

// ============ Types ============











// Bulk Generate Types






// ============ Unwrapping Helper ============
async function unwrapResponse<T>(res: ApiResponse<any>): Promise<ApiResponse<T>> {
  if (!res.success) {
    return {
      success: false,
      statusCode: res.statusCode,
      error: res.error || res.message,
      message: res.message || res.error,
    };
  }
  const body = res.data as any;
  return {
    success: true,
    statusCode: res.statusCode,
    data: body?.items ?? body?.data ?? (body as T),
    message: body?.message ?? res.message,
  };
}

// ============ Service ============

/**
 * ManageSubUnits API Service
 * Handles sub-unit (flat/shop) creation and management
 */
export const manageSubUnitsService = {
  /**
   * Bulk generate sub-units (flats, shops, etc.) under a parent asset
   * Creates assets in DB and returns their IDs
   */
  bulkGenerate: async (
    data: BulkGenerateRequest
  ): Promise<ApiResponse<BulkGenerateResponse>> => {
    const res = await apiClient.post('/ManageSubUnits/bulk-generate', data);
    return unwrapResponse<BulkGenerateResponse>(res);
  },

  /**
   * Create a new sub-unit (flat, shop, etc.)
   */
  create: async (
    data: CreateSubUnitRequest | FormData
  ): Promise<ApiResponse<SubUnitResponseDto>> => {
    const isDataFormData = data !== null && typeof data === 'object' && typeof (data as any).append === 'function' && typeof (data as any).entries === 'function';
    if (isDataFormData) {
      const config = getAppConfig();
      const baseUrl = config.api.baseUrl?.trim();
      if (!baseUrl)
        return { success: false, statusCode: 500, error: 'API base URL is not configured' };

      const url = `${baseUrl.replace(/\/$/, '')}/ManageSubUnits/create`;

      const getAuthHeadersForFormData = async (): Promise<Record<string, string>> => {
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
      };

      const headers = await getAuthHeadersForFormData();

      const safeFormData = new FormData();
      for (const [key, value] of (data as FormData).entries()) {
        if (typeof value === 'object' && value !== null && typeof (value as any).arrayBuffer === 'function') {
          try {
            const file = value as File;
            const arrayBuffer = await file.arrayBuffer();
            safeFormData.append(
              key,
              new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' }),
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
      try {
        const text = await response.text();
        const json = text ? JSON.parse(text) : undefined;
        if (!response.ok) {
          let errMessage = json?.message || json?.title || json?.detail || 'An error occurred';
          if (json?.errors && typeof json.errors === 'object') {
            const firstKey = Object.keys(json.errors)[0];
            if (firstKey) {
              const firstErr = json.errors[firstKey];
              if (Array.isArray(firstErr) && firstErr.length > 0) errMessage = firstErr[0];
            }
          }
          return { success: false, statusCode: response.status, error: errMessage, message: json?.message };
        }

        const resData = json as any;
        return {
          success: true,
          statusCode: response.status,
          data: resData?.items ?? resData?.data ?? (resData as SubUnitResponseDto),
          message: resData?.message,
        };
      } catch {
        return { success: false, statusCode: response.status, error: 'Invalid JSON response' };
      }
    }

    const res = await apiClient.post('/ManageSubUnits/create', data);
    return unwrapResponse<SubUnitResponseDto>(res);
  },

  /**
   * Get all sub-units for an asset
   */
  getByAssetId: async (
    assetId: number
  ): Promise<ApiResponse<SubUnitResponseDto[]>> => {
    const res = await apiClient.get(`/ManageSubUnits/by-asset/${assetId}`);
    return unwrapResponse<SubUnitResponseDto[]>(res);
  },

  /**
   * Get complete details of all sub-units by parent asset ID
   */
  getCompleteDetailsByParentId: async (
    parentAssetId: number
  ): Promise<ApiResponse<any[]>> => {
    const res = await apiClient.get(`/ManageSubUnits/parent/${parentAssetId}/complete-details`);
    return unwrapResponse<any[]>(res);
  },

  /**
   * Get all details of all sub-units (including lease details) by parent asset ID
   */
  getAllDetailsByParentId: async (
    parentAssetId: number
  ): Promise<ApiResponse<any[]>> => {
    const res = await apiClient.get(`/ManageSubUnits/parent/${parentAssetId}/all-details`);
    return unwrapResponse<any[]>(res);
  },

  getById: async (
    id: number
  ): Promise<ApiResponse<any>> => {
    const res = await apiClient.get(`/ManageSubUnits/${id}`);
    if (!res.success) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || res.message,
        message: res.message || res.error,
      };
    }
    // The backend wraps the response as:
    //   { success: true, message: '...', data: { id, roomDetails: [...], renterDetails: {...}, ... } }
    // We need to unwrap just the outer envelope to get the inner detail object.
    // Check for the API envelope wrapper by looking for a 'data' key that contains
    // any known sub-unit detail field (roomDetails, id, unitNo, assetId, etc.)
    const body = res.data as any;
    const targetPayload = body?.items ?? body?.data;
    const isEnvelope =
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      targetPayload &&
      typeof targetPayload === 'object' &&
      !Array.isArray(targetPayload);

    const detail = isEnvelope ? targetPayload : body;
    return { success: true, statusCode: res.statusCode, data: detail };
  },

  /**
   * Update an existing sub-unit
   */
  update: async (
    id: number,
    data: Partial<CreateSubUnitRequest> | FormData
  ): Promise<ApiResponse<SubUnitResponseDto>> => {
    const isDataFormData = data !== null && typeof data === 'object' && typeof (data as any).append === 'function' && typeof (data as any).entries === 'function';
    if (isDataFormData) {
      const config = getAppConfig();
      const baseUrl = config.api.baseUrl?.trim();
      if (!baseUrl)
        return { success: false, statusCode: 500, error: 'API base URL is not configured' };

      const url = `${baseUrl.replace(/\/$/, '')}/ManageSubUnits/${id}`;

      const getAuthHeadersForFormData = async (): Promise<Record<string, string>> => {
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
      };

      const headers = await getAuthHeadersForFormData();

      const safeFormData = new FormData();
      for (const [key, value] of (data as FormData).entries()) {
        if (typeof value === 'object' && value !== null && typeof (value as any).arrayBuffer === 'function') {
          try {
            const file = value as File;
            const arrayBuffer = await file.arrayBuffer();
            safeFormData.append(
              key,
              new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' }),
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
      try {
        const text = await response.text();
        const json = text ? JSON.parse(text) : undefined;
        if (!response.ok) {
          let errMessage = json?.title || json?.message || json?.detail || 'An error occurred';
          if (json?.errors && typeof json.errors === 'object') {
            const firstKey = Object.keys(json.errors)[0];
            if (firstKey) {
              const firstErr = json.errors[firstKey];
              if (Array.isArray(firstErr) && firstErr.length > 0) errMessage = firstErr[0];
            }
          }
          return { success: false, statusCode: response.status, error: errMessage };
        }

        const resData = json as any;
        return {
          success: true,
          statusCode: response.status,
          data: resData?.items ?? resData?.data ?? (resData as SubUnitResponseDto),
          message: resData?.message,
        };
      } catch {
        return { success: false, statusCode: response.status, error: 'Invalid JSON response' };
      }
    }

    const res = await apiClient.put(`/ManageSubUnits/${id}`, data);
    return unwrapResponse<SubUnitResponseDto>(res);
  },

  /**
   * Delete a sub-unit
   */
  delete: async (
    id: number
  ): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete(`/ManageSubUnits/${id}`);
    return unwrapResponse<void>(res);
  },

  // ── Floor Submission direct-persistence methods ──────────────────────────
  // These call the new endpoints that write directly to AMS.SubUnitsDetails
  // with AssetId = parentAssetId — no child AssetMaster is created.

  /**
   * Creates a Floor Submission directly in AMS.SubUnitsDetails.
   * POST /ManageSubUnits/floor-submission/create
   */
  createFloorSubmission: async (data: {
    parentAssetId: number;
    floorId?: number;
    subFloorId?: number;
    constructionYear?: string;
    assessmentYear?: string;
    constructionTypeId?: number;
    typeOfUseId?: number;
    subTypeOfUseId?: number;
    carpetAreaSqFeet?: number;
    carpetAreaSqMeter?: number;
    builtupAreaSqFeet?: number;
    builtupAreaSqMeter?: number;
    totalAreaSqFt?: number;
    noOfRooms?: number;
    isRented?: boolean;
    isRenter?: boolean;
    roomDetails?: RoomDetailDto[];
    rentInformation?: RentInformationDto;
    renterName?: string;
    mobileNo?: string;
    emailId?: string;
    gstNo?: string;
    aadhaarCardNo?: string;
    panCardNo?: string;
    propertyDescription?: string;
    agreementId?: string;
    createdBy?: number;
  }): Promise<ApiResponse<any>> => {
    const res = await apiClient.post('/ManageSubUnits/floor-submission/create', data);
    return unwrapResponse<any>(res);
  },

  /**
   * Updates an existing Floor Submission record (direct SubUnitsDetails row).
   * PUT /ManageSubUnits/floor-submission/{subUnitsDetailsId}
   */
  updateFloorSubmission: async (
    subUnitsDetailsId: number,
    data: Record<string, any>
  ): Promise<ApiResponse<any>> => {
    const res = await apiClient.put(`/ManageSubUnits/floor-submission/${subUnitsDetailsId}`, data);
    return unwrapResponse<any>(res);
  },

  /**
   * Soft-deletes a direct Floor Submission record.
   * DELETE /ManageSubUnits/floor-submission/{subUnitsDetailsId}
   */
  deleteFloorSubmission: async (
    subUnitsDetailsId: number
  ): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete(`/ManageSubUnits/floor-submission/${subUnitsDetailsId}`);
    return unwrapResponse<void>(res);
  },

  /**
   * Returns all direct Floor Submission records for a parent asset.
   * GET /ManageSubUnits/parent/{parentAssetId}/floor-submissions
   */
  getFloorSubmissionsByParent: async (
    parentAssetId: number
  ): Promise<ApiResponse<any[]>> => {
    const res = await apiClient.get(`/ManageSubUnits/parent/${parentAssetId}/floor-submissions`);
    return unwrapResponse<any[]>(res);
  },

  /**
   * Synchronizes FloorId across all active SubUnitsDetails rows for a specific Unit AssetId.
   * PUT /ManageSubUnits/{unitAssetId}/sync-floor?floorId={floorId}
   */
  syncUnitFloor: async (
    unitAssetId: number,
    floorId: number
  ): Promise<ApiResponse<boolean>> => {
    const res = await apiClient.put(`/ManageSubUnits/${unitAssetId}/sync-floor?floorId=${floorId}`);
    return unwrapResponse<boolean>(res);
  },
};

export default manageSubUnitsService;
