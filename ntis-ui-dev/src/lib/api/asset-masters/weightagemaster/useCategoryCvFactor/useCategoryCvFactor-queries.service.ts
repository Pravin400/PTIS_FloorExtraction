import { apiClient } from '@/services/api.service';
import { getTranslations } from 'next-intl/server';
import type { ApiResponse } from '@/types/common.types';
import {
  PagedResponse,
  UseFactorCVMaster,
  UseFactorCVMasterQueryParams,
  TypeOfUseQueryParams,
  TypeOfUseResponse,
  SubTypeOfUseQueryParams,
  SubTypeOfUseResponse,
} from '@/types/asset-masters/useCategoryCvFactor.types';
import { ApiError } from '@/lib/utils/api';
import { mapQueryParamsToPascalCase } from '@/lib/utils/api-params';

// ---------------------------------------------
// Use Factor CV Master Query Services
// ---------------------------------------------

/**
 * Fetches all UseFactorCVMaster records from the API
 * @returns Promise resolving to ApiResponse containing items array
 */
export async function getUseFactorCVMaster(): Promise<ApiResponse<{ items: UseFactorCVMaster[] }>> {
  const response = await apiClient.get<{ items: UseFactorCVMaster[] }>('/asset-management/use-factor-cv').then(r =>
    r.success ? r : apiClient.get<{ items: UseFactorCVMaster[] }>('/UseFactorCVMaster')
  );

  if (!response.success) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(
      response.statusCode || 500,
      response.error || t('errors.fetchFailed'),
      'Fetch all Use Factor CV Master failed'
    );
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
    yearRangeCVId: 'YearRangeCVId',
  });

  const endpoint = searchParams.toString()
    ? `/asset-management/use-factor-cv?${searchParams.toString()}`
    : '/asset-management/use-factor-cv';

  const response = await apiClient.get<PagedResponse<UseFactorCVMaster>>(endpoint).then(r =>
    r.success && r.data
      ? r
      : apiClient.get<PagedResponse<UseFactorCVMaster>>(
          searchParams.toString()
            ? `/UseFactorCVMaster?${searchParams.toString()}`
            : '/UseFactorCVMaster'
        )
  );

  if (!response.success) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(
      response.statusCode || 500,
      response.error || t('errors.fetchFailed'),
      'Fetch Use Factor CV Master with params failed'
    );
  }

  return response;
}

/**
 * Fetches a single UseFactorCVMaster record by ID
 * @param id The UseFactorCV ID to fetch
 * @returns Promise resolving to ApiResponse containing the record
 */
export async function getUseFactorCVMasterById(
  id: number
): Promise<ApiResponse<UseFactorCVMaster>> {
  if (id <= 0) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(400, t('errors.invalidId'), "Validation");
  }

  const response = await apiClient.get<UseFactorCVMaster>(`/asset-management/use-factor-cv/${id}`).then(r =>
    r.success ? r : apiClient.get<UseFactorCVMaster>(`/UseFactorCVMaster/${id}`)
  );

  if (!response.success) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(
      response.statusCode || 500,
      response.error || t('errors.fetchFailed'),
      'Fetch Use Factor CV Master by ID failed'
    );
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
    ? `/asset-management/asset-type-of-use?${searchParams.toString()}`
    : '/asset-management/asset-type-of-use';

  const response = await apiClient.get<PagedResponse<TypeOfUseResponse>>(endpoint).then(r =>
    r.success && r.data
      ? r
      : apiClient.get<PagedResponse<TypeOfUseResponse>>(
          searchParams.toString() ? `/TypeOfUse?${searchParams.toString()}` : '/TypeOfUse'
        )
  );

  if (!response.success) {
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(
      response.statusCode || 500,
      response.error || t('errors.fetchFailed'),
      'Fetch Type of Use with params failed'
    );
  }

  return response;
}

/**
 * Fetches a single TypeOfUse record by ID
 * @param id The TypeOfUse ID to fetch
 * @returns Promise resolving to ApiResponse containing the record
 */
export async function getTypeOfUseById(
  id: number
): Promise<ApiResponse<TypeOfUseResponse>> {
  return apiClient.get<TypeOfUseResponse>(`/asset-management/asset-type-of-use/${id}`).then(r =>
    r.success ? r : apiClient.get<TypeOfUseResponse>(`/TypeOfUse/${id}`)
  );
}

// ---------------------------------------------
// SubTypeOfUse Query Services
// ---------------------------------------------

/**
 * Fetches SubTypeOfUse records with query parameters for filtering, pagination, and sorting
 * @param params Query parameters for filtering and pagination
 * @returns Promise resolving to ApiResponse containing paginated results
 */
export async function getSubTypeOfUseWithParams(
  params: SubTypeOfUseQueryParams = {}
): Promise<ApiResponse<PagedResponse<SubTypeOfUseResponse>>> {
  const searchParams = mapQueryParamsToPascalCase(params as Record<string, unknown>, {
    typeOfUseId: 'TypeOfUseId',
  });
  const queryString = searchParams.toString();

  return apiClient.get<PagedResponse<SubTypeOfUseResponse>>(
    queryString
      ? `/asset-management/asset-sub-type-of-use?${queryString}`
      : '/asset-management/asset-sub-type-of-use'
  ).then(r =>
    r.success && r.data
      ? r
      : apiClient.get<PagedResponse<SubTypeOfUseResponse>>(
          queryString ? `/SubTypeOfUse?${queryString}` : '/SubTypeOfUse'
        )
  );
}

/**
 * Fetches a single SubTypeOfUse record by ID
 * @param id The SubTypeOfUse ID to fetch
 * @returns Promise resolving to ApiResponse containing the record
 */
export async function getSubTypeOfUseById(
  id: number
): Promise<ApiResponse<SubTypeOfUseResponse>> {
  return apiClient.get<SubTypeOfUseResponse>(`/asset-management/asset-sub-type-of-use/${id}`).then(r =>
    r.success ? r : apiClient.get<SubTypeOfUseResponse>(`/SubTypeOfUse/${id}`)
  );
}