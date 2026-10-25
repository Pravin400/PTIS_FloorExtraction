import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import {
  PagedResponse,
  AgeFactorCVMaster,
  AgeFactorCVMasterUpdate,
  AgeFactorCVMasterCreate,
  AgeFactorCVMasterQueryParams
} from '@/types/ageFactorCv.types';
import { ApiError } from '@/lib/utils/api';

/**
 * Mapping of frontend query parameter keys to backend PascalCase keys.
 */
const QUERY_PARAM_MAP: Record<string, string> = {
  yearRangeCVId: 'YearRangeCVId',
  constructionTypeId: 'ConstructionTypeId',
};

/**
 * Backend key to use instead when the value is an array (e.g. multiple selected
 * construction types are filtered via the dedicated ConstructionTypeIds "IN" param,
 * not by repeating the singular ConstructionTypeId key).
 */
const QUERY_PARAM_ARRAY_MAP: Record<string, string> = {
  constructionTypeId: 'ConstructionTypeIds',
};

/**
 * Converts a frontend camelCase key to a backend PascalCase key using a predefined map
 * or by capitalizing the first letter as a fallback.
 */
const mapQueryParamKey = (key: string): string => {
  return QUERY_PARAM_MAP[key] || (key.charAt(0).toUpperCase() + key.slice(1));
};

/**
 * Fetches AgeFactorCVMaster records with query parameters for filtering, pagination, and sorting
 * @param params Query parameters for filtering and pagination
 * @returns Promise resolving to ApiResponse containing paginated results
 */
export async function getAgeFactorCVMasterWithParams(
  params: AgeFactorCVMasterQueryParams = {}
): Promise<ApiResponse<PagedResponse<AgeFactorCVMaster>>> {
  const searchParams = new URLSearchParams();

  // Add parameters to query string if they exist
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Array values (e.g. multiple selected construction type IDs) are sent as
    // repeated query params under the dedicated plural "IN" key:
    // ConstructionTypeIds=1&ConstructionTypeIds=2
    if (Array.isArray(value)) {
      const arrayApiKey = QUERY_PARAM_ARRAY_MAP[key] || mapQueryParamKey(key);
      value.forEach((item) => {
        if (typeof item === 'number' && !Number.isFinite(item)) return;
        searchParams.append(arrayApiKey, String(item));
      });
      return;
    }

    const apiKey = mapQueryParamKey(key);

    // Safety check: Skip numeric values that are NaN or Infinity
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return;
    }

    searchParams.append(apiKey, String(value));
  });

  const endpoint = searchParams.toString()
    ? `/AgeFactorCVMaster?${searchParams.toString()}`
    : '/AgeFactorCVMaster';

  return apiClient.get<PagedResponse<AgeFactorCVMaster>>(endpoint);
}

/**
 * Updates an existing AgeFactorCVMaster record
 * @param id The ID of the record to update
 * @param payload The update payload
 * @param t Optional translation function for error messages
 * @returns Promise resolving to void on success
 */
export async function updateAgeFactorCVMaster(
  id: number,
  payload: AgeFactorCVMasterUpdate,
  t?: (key: string) => string
): Promise<void> {
  try {
    if (!id || id <= 0) {
      throw new ApiError(400, t ? t('errors.validIdRequired') : 'Valid AgeFactorCV ID is required for update', 'Validation');
    }
    if (!payload.constructionTypeId || payload.constructionTypeId <= 0) {
      throw new ApiError(400, t ? t('errors.constructionTypeRequired') : 'constructionTypeId is required', 'Validation');
    }
    if (!payload.yearRangeCVId || payload.yearRangeCVId <= 0) {
      throw new ApiError(400, t ? t('errors.yearRangeRequired') : 'yearRangeCVId is required', 'Validation');
    }

    const requestPayload = {
      isActive: payload.isActive,
      updatedBy: payload.updatedBy,
      constructionTypeId: payload.constructionTypeId,
      ageFrom: Number(payload.ageFrom),
      ageTo: Number(payload.ageTo),
      factor: Number(payload.factor),
      yearRangeCVId: payload.yearRangeCVId,
    };

    const response = await apiClient.put<unknown>(
      `/AgeFactorCVMaster/${encodeURIComponent(String(id))}`,
      requestPayload
    );

    if (!response.success) {
      throw new ApiError(500, response.error || (t ? t('errors.updateFailed') : 'Failed to update Age Factor CV Master'), 'Update Age Factor CV Master failed');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Creates a new AgeFactorCVMaster record (POST)
 * @param payload The creation payload
 * @param t Optional translation function for error messages
 * @returns Promise resolving to ApiResponse containing the created record
 */
export async function createAgeFactorCVMaster(
  payload: AgeFactorCVMasterCreate,
  t?: (key: string) => string
): Promise<ApiResponse<unknown>> {
  try {
    if (!payload.constructionTypeId || payload.constructionTypeId <= 0) {
      throw new ApiError(400, t ? t('errors.constructionTypeRequired') : 'constructionTypeId is required', 'Validation');
    }
    if (!payload.yearRangeCVId || payload.yearRangeCVId <= 0) {
      throw new ApiError(400, t ? t('errors.yearRangeRequired') : 'yearRangeCVId is required', 'Validation');
    }

    const requestPayload = {
      isActive: payload.isActive,
      createdBy: payload.createdBy,
      constructionTypeId: payload.constructionTypeId,
      ageFrom: Number(payload.ageFrom),
      ageTo: Number(payload.ageTo),
      factor: Number(payload.factor),
      yearRangeCVId: payload.yearRangeCVId,
    };

    return await apiClient.post<unknown>('/AgeFactorCVMaster', requestPayload);
  } catch (error) {
    throw error;
  }
}

/**
 * Deletes an AgeFactorCVMaster record
 * @param id The ID of the record to delete
 * @param t Optional translation function for error messages
 * @returns Promise resolving to ApiResponse
 */
export async function deleteAgeFactorCVMaster(
  id: number,
  t?: (key: string) => string
): Promise<ApiResponse<unknown>> {
  if (id <= 0) {
    throw new ApiError(400, t ? t('errors.validIdRequired') : 'Valid AgeFactorCV ID is required', 'Validation');
  }
  const response = await apiClient.delete<unknown>(`/AgeFactorCVMaster/${id}/purge`);
  if (!response.success) {
    throw new ApiError(response.statusCode || 500, response.error || response.message || 'Failed to delete Age Factor CV Master', 'Delete Age Factor CV Master failed');
  }
  return response;
}

/**
 * Fetches a single AgeFactorCVMaster record by ID
 * @param id The AgeFactorCV ID to fetch
 * @returns Promise resolving to ApiResponse containing the record
 */

export async function getAgeFactorCVMasterById(id: number, t?: (key: string) => string): Promise<ApiResponse<AgeFactorCVMaster>> {
  if (id <= 0) {
    throw new ApiError(400, t ? t('errors.validIdRequired') : 'Valid AgeFactorCV ID is required', 'Validation');
  }

  try {
    const response = await apiClient.get<AgeFactorCVMaster>(`/AgeFactorCVMaster/${id}`);
    if (!response.success) {
      throw new ApiError(response.statusCode || 500, response.error || (t ? t('errors.fetchFailed') : 'Failed to fetch Age Factor CV Master'), 'Fetch Age Factor CV Master by ID failed');
    }
    return response;
  } catch (error) {
    throw error;

  }

}

