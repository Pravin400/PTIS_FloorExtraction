import { apiClient } from '@/services/api.service';
import { getTranslations } from 'next-intl/server';
import type { ApiResponse } from '@/types/common.types';
import { 
  PagedResponse, 
  UseFactorCVMaster,
  UseFactorCVMasterQueryParams,
  TypeOfUseQueryParams,
  TypeOfUseResponse,
} from '@/types/useCategoryCvFactor.types';
import { ApiError } from '../../../utils/api';
import { mapQueryParamsToPascalCase } from '../../../utils/api-params';

// ---------------------------------------------
// Use Factor CV Master Query Services
// ---------------------------------------------

/**
 * Fetches all UseFactorCVMaster records from the API
 * @returns Promise resolving to ApiResponse containing items array
 */
export async function getUseFactorCVMaster(): Promise<ApiResponse<{ items: UseFactorCVMaster[] }>> {
  const response = await apiClient.get<{ items: UseFactorCVMaster[] }>('/UseFactorCVMaster');
  if (!response.success) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(response.statusCode || 500, response.error || t('errors.fetchFailed'), 'Fetch all Use Factor CV Master failed');
  }
  return response;
}

/**
 * Fetches UseFactorCVMaster records with query parameters for filtering, pagination, and sorting
 * @param params Query parameters for filtering and pagination
 * @returns Promise resolving to ApiResponse containing paginated results
 */
export async function getUseFactorCVMasterWithParams(
  params: UseFactorCVMasterQueryParams = {}
): Promise<ApiResponse<PagedResponse<UseFactorCVMaster>>> {
  const searchParams = mapQueryParamsToPascalCase(params as Record<string, unknown>, {
    yearRangeCVId: 'YearRangeCVId'
  });

  const endpoint = searchParams.toString() 
    ? `/UseFactorCVMaster?${searchParams.toString()}`
    : '/UseFactorCVMaster';

  const response = await apiClient.get<PagedResponse<UseFactorCVMaster>>(endpoint);
  if (!response.success) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(response.statusCode || 500, response.error || t('errors.fetchFailed'), 'Fetch Use Factor CV Master with params failed');
  }
  return response;
}

/**
 * Fetches a single UseFactorCVMaster record by ID
 * @param id The UseFactorCV ID to fetch
 * @returns Promise resolving to ApiResponse containing the record
 */
export async function getUseFactorCVMasterById(id: number): Promise<ApiResponse<UseFactorCVMaster>> {
  if (id <= 0) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(400, t('errors.invalidId'), "Validation");
  }
  const response = await apiClient.get<UseFactorCVMaster>(`/UseFactorCVMaster/${id}`);
  if (!response.success) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(response.statusCode || 500, response.error || t('errors.fetchFailed'), 'Fetch Use Factor CV Master by ID failed');
  }
  return response;
}

// ---------------------------------------------
// TypeOfUse Query Services
// ---------------------------------------------

/**
 * Fetches TypeOfUse records with query parameters for filtering, pagination, and sorting
 * @param params Query parameters for filtering and pagination
 * @returns Promise resolving to ApiResponse containing paginated results
 */
export async function getTypeOfUseWithParams(
  params: TypeOfUseQueryParams = {}
): Promise<ApiResponse<PagedResponse<TypeOfUseResponse>>> {
  const searchParams = mapQueryParamsToPascalCase(params as Record<string, unknown>);
  const endpoint = searchParams.toString() 
    ? `/TypeOfUse?${searchParams.toString()}`
    : '/TypeOfUse';

  const response = await apiClient.get<PagedResponse<TypeOfUseResponse>>(endpoint);
  if (!response.success) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(response.statusCode || 500, response.error || t('errors.fetchFailed'), 'Fetch Type of Use with params failed');
  }
  return response;
}

/**
 * Deletes a UseFactorCVMaster record
 * @param id The ID of the record to delete
 * @returns Promise resolving to ApiResponse
 */

export async function deleteUseFactorCVMaster(id:number): Promise<ApiResponse<null>> {
  const response = await apiClient.delete<null>(`/UseFactorCVMaster/${id}/purge`);
  if (!response.success) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(response.statusCode || 500, response.error || t('errors.deleteFailed'), 'Delete Use Factor CV Master failed');
  }
  return response;
}