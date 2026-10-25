import { apiClient } from '@/services/api.service';
import { getTranslations } from 'next-intl/server';
import type { ApiResponse, PagedResponse } from '@/types/common.types';
import {
  NatureFactorCVMaster,
  NatureFactorCVMasterUpdate,
  NatureFactorCVMasterCreate,
  BulkNatureFactorCVMasterCreate,
  BulkNatureFactorCVMasterUpdate,
} from '@/types/asset-masters/natureofbuilding-cv-weightageMaster.types';
import { ApiError } from '@/lib/utils/api';
import {
  AssessmentYearCV,
  AssessmentYearPagedResponseCV,
} from '@/types/asset-masters/floor-cv-weightageMaster.types';

// ---------------------------------------------
// Nature Factor CV Master Services
// ---------------------------------------------

/**
 * Fetches NatureFactorCVMaster records with pagination and filtering
 */
export async function getNatureFactorCVMasterWithPagination(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  yearRangeCVId?: string,
  constructionTypeId?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<NatureFactorCVMaster>> {
  try {
    const params = new URLSearchParams({
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
    });

    if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
    if (yearRangeCVId?.trim()) params.append("YearRangeCVId", yearRangeCVId.trim());
    if (constructionTypeId?.trim()) params.append("ConstructionTypeId", constructionTypeId.trim());
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<NatureFactorCVMaster>>(
      `/asset-management/nature-factor-cv?${params.toString()}`
    ).then(r =>
      r.success && r.data
        ? r
        : apiClient.get<PagedResponse<NatureFactorCVMaster>>(`/NatureFactorCVMaster?${params.toString()}`)
    );

    if (!response.success || !response.data) {
      const t = await getTranslations('natureFactorCVMaster');
      throw new ApiError(
        response.statusCode || 500,
        response.error || t('errors.fetchFailed'),
        "Fetch Nature Factor CV Master"
      );
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Updates an existing NatureFactorCVMaster record
 */
export async function updateNatureFactorCVMaster(
  id: number,
  payload: NatureFactorCVMasterUpdate
): Promise<void> {
  try {
    const t = await getTranslations('natureFactorCVMaster');
    if (!id || id <= 0) {
      throw new ApiError(400, t('errors.invalidNatureFactorCVId'), "Validation");
    }

    const requestPayload = {
      isActive: payload.isActive,
      updatedBy: payload.updatedBy,
      constructionTypeId: payload.constructionTypeId,
      factor: Number(payload.factor),
      yearRangeCVId: payload.yearRangeCVId,
    };

    const response = await apiClient.put<void>(
      `/asset-management/nature-factor-cv/${id}`,
      requestPayload
    ).then(r =>
      r.success ? r : apiClient.put<void>(`/NatureFactorCVMaster/${id}`, requestPayload)
    );

    if (!response.success) {
      throw new ApiError(
        response.statusCode || 500,
        response.error || t('errors.updateFailed'),
        "Update Nature Factor CV Master"
      );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Creates a new NatureFactorCVMaster record
 */
export async function createNatureFactorCVMaster(
  payload: NatureFactorCVMasterCreate
): Promise<ApiResponse<unknown>> {
  try {
    const requestPayload = {
      isActive: payload.isActive,
      createdBy: payload.createdBy,
      constructionTypeId: payload.constructionTypeId,
      factor: Number(payload.factor),
      yearRangeCVId: payload.yearRangeCVId,
    };
    return await apiClient.post<unknown>('/asset-management/nature-factor-cv', requestPayload).then(r =>
      r.success ? r : apiClient.post<unknown>('/NatureFactorCVMaster', requestPayload)
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Bulk creates NatureFactorCVMaster records
 */
export async function bulkCreateNatureFactorCVMaster(
  payload: BulkNatureFactorCVMasterCreate
): Promise<ApiResponse<unknown>> {
  try {
    return await apiClient.post<unknown>('/asset-management/nature-factor-cv/Bulk', payload).then(r =>
      r.success ? r : apiClient.post<unknown>('/NatureFactorCVMaster/Bulk', payload)
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Bulk updates NatureFactorCVMaster records
 */
export async function bulkUpdateNatureFactorCVMaster(
  payload: BulkNatureFactorCVMasterUpdate
): Promise<void> {
  try {
    const response = await apiClient.put<void>('/asset-management/nature-factor-cv/Bulk', payload).then(r =>
      r.success ? r : apiClient.put<void>('/NatureFactorCVMaster/Bulk', payload)
    );
    if (!response.success) {
      const t = await getTranslations('natureFactorCVMaster');
      throw new ApiError(
        response.statusCode || 500,
        response.error || t('errors.bulkUpdateFailed'),
        "Bulk Update Nature Factor CV Master"
      );
    }
  } catch (error) {
    throw error;
  }
}

// ---------------------------------------------
// Helper Functions
// ---------------------------------------------

/**
 * Normalizes assessment year API response into a consistent paged format.
 * Handles both array responses and paged-object responses from the API.
 *
 * @param data    Raw response data from the API
 * @param pageNumber  Requested page number
 * @param pageSize    Requested page size (-1 = fetch all)
 */
export function normalizeAssessmentYearResponse(
  data: unknown,
  pageNumber: number,
  pageSize: number
): AssessmentYearPagedResponseCV {
  // Handle array response — normalize to paged format
  if (Array.isArray(data)) {
    const items = (data as AssessmentYearCV[]).map((item) => ({
      ...item,
      yearId: item.id || item.yearId,
    }));
    const totalCount = data.length;
    const isFetchAllPageSize = pageSize <= 0;
    const effectivePageSize = isFetchAllPageSize ? (totalCount > 0 ? totalCount : 1) : pageSize;
    const totalPages = isFetchAllPageSize ? 1 : Math.ceil(totalCount / effectivePageSize);
    return {
      items,
      totalCount,
      pageNumber,
      pageSize: effectivePageSize,
      totalPages,
      hasPrevious: pageNumber > 1,
      hasNext: isFetchAllPageSize ? false : pageNumber < totalPages,
    };
  }

  // Handle paged-object response
  if (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as AssessmentYearPagedResponseCV).items)
  ) {
    const pagedData = data as AssessmentYearPagedResponseCV;
    pagedData.items = (pagedData.items as AssessmentYearCV[]).map((item) => ({
      ...item,
      yearId: item.id || item.yearId,
    }));
    return pagedData;
  }

  throw new Error("Unexpected response format for assessment years");
}

// ---------------------------------------------
// Asset Construction Type Services
// ---------------------------------------------

/**
 * Fetches asset construction types with pagination.
 * Used by the Nature Factor CV Master dropdown.
 *
 * @param pageNumber  Page number (use -1 to fetch all)
 * @param pageSize    Page size (use -1 to fetch all)
 * @param searchTerm  Optional search term
 */
export async function getAssetConstructionPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<{ id: number; constructionCode: string; description: string; isActive: boolean }>> {
  const params = new URLSearchParams();
  if (pageNumber > 0) params.append("PageNumber", pageNumber.toString());
  if (pageSize >= 1 || pageSize === -1) params.append("PageSize", pageSize.toString());
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());

  const qs = params.toString();
  const primaryEndpoint = qs
    ? `/asset-management/construction-type?${qs}`
    : '/asset-management/construction-type';
  const fallbackEndpoint = qs ? `/ConstructionType?${qs}` : '/ConstructionType';

  type ConstructionTypeItem = { id: number; constructionCode: string; description: string; isActive: boolean };

  const response = await apiClient.get<PagedResponse<ConstructionTypeItem>>(primaryEndpoint).then(r =>
    r.success && r.data
      ? r
      : apiClient.get<PagedResponse<ConstructionTypeItem>>(fallbackEndpoint)
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      500,
      response.error || "Failed to fetch construction types",
      "Fetch construction types failed"
    );
  }

  const data = response.data;

  // Normalize array response to paged format
  if (Array.isArray(data)) {
    const totalCount = data.length;
    const isFetchAllPageSize = pageSize <= 0;
    const effectivePageSize = isFetchAllPageSize ? (totalCount > 0 ? totalCount : 1) : pageSize;
    const totalPages = isFetchAllPageSize ? 1 : Math.ceil(totalCount / effectivePageSize);
    return {
      items: data,
      totalCount,
      pageNumber,
      pageSize: effectivePageSize,
      totalPages,
      hasPrevious: pageNumber > 1,
      hasNext: isFetchAllPageSize ? false : pageNumber < totalPages,
    };
  }

  return data;
}