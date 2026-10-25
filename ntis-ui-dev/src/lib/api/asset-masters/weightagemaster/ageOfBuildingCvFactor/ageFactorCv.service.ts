import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import {
  PagedResponse,
  AgeFactorCVMaster,
  AgeFactorCVMasterUpdate,
  AgeFactorCVMasterCreate,
  AgeFactorCVMasterQueryParams
} from '@/types/asset-masters/ageFactorCv.types';
import { ApiError } from '@/lib/utils/api';

/**
 * Mapping of frontend query parameter keys to backend PascalCase keys.
 */
const QUERY_PARAM_MAP: Record<string, string> = {
  yearRangeCVId: 'YearRangeCVId',
  constructionTypeId: 'ConstructionTypeId',
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
  params: AgeFactorCVMasterQueryParams = {},
  options?: RequestInit
): Promise<ApiResponse<PagedResponse<AgeFactorCVMaster>>> {
  const searchParams = new URLSearchParams();

  // Add parameters to query string if they exist
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Safety check: Skip numeric values that are NaN or Infinity
      if (typeof value === 'number' && !Number.isFinite(value)) {
        return;
      }

      // Map frontend camelCase to backend PascalCase using specialized mapping
      const apiKey = mapQueryParamKey(key);
      searchParams.append(apiKey, String(value));
    }
  });

  const endpoint = searchParams.toString()
    ? `/asset-management/age-factor-cv?${searchParams.toString()}`
    : '/asset-management/age-factor-cv';

  return apiClient.get<PagedResponse<AgeFactorCVMaster>>(endpoint, options);
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
      `/asset-management/age-factor-cv/${encodeURIComponent(String(id))}`,
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

    return await apiClient.post<unknown>('/asset-management/age-factor-cv', requestPayload);
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
  return apiClient.delete<unknown>(`/asset-management/age-factor-cv/${id}`);
}
