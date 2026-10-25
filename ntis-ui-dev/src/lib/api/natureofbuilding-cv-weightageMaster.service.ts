import { apiClient } from '@/services/api.service';
import { getTranslations } from 'next-intl/server';
import type { ApiResponse, PagedResponse } from '@/types/common.types';
import {
  NatureFactorCVMaster,
  NatureFactorCVMasterUpdate,
  NatureFactorCVMasterCreate,
  BulkNatureFactorCVMasterCreate,
  BulkNatureFactorCVMasterUpdate,
} from '@/types/natureofbuilding-cv-weightageMaster.types';
import { ApiError } from '../utils/api';
import { AssessmentYearCV, AssessmentYearPagedResponseCV } from '@/types/floor-cv-weightageMaster.types';

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
      `/NatureFactorCVMaster?${params.toString()}`
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
 * Fetches a single NatureFactorCVMaster record by ID
 */
export async function getNatureFactorCVMasterById(id: number): Promise<NatureFactorCVMaster> {
  try {
    const t = await getTranslations('natureFactorCVMaster');
    if (!id || id <= 0) {
      throw new ApiError(400, t('errors.invalidNatureFactorCVId'), "Validation");
    }

    const response = await apiClient.get<NatureFactorCVMaster>(`/NatureFactorCVMaster/${id}`);
    
    if (!response.success || !response.data) {
      throw new ApiError(
        response.statusCode || 404,
        response.error || t('errors.fetchFailed'),
        "Fetch Nature Factor CV Master by ID"
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

    const response = await apiClient.put<void>(`/NatureFactorCVMaster/${id}`, requestPayload);

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
    return await apiClient.post<unknown>('/NatureFactorCVMaster', requestPayload);
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
    return await apiClient.post<unknown>('/NatureFactorCVMaster/Bulk', payload);
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
    const response = await apiClient.put<void>('/NatureFactorCVMaster/Bulk', payload);
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
 * Normalizes assessment year response into a consistent paged format
 */
function normalizeAssessmentYearResponse(
  data: unknown,
  pageNumber: number,
  pageSize: number
): AssessmentYearPagedResponseCV {
  // Handle array response - normalize to paged format
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
      hasNext: isFetchAllPageSize ? false : pageNumber < totalPages
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

  throw new Error("Unexpected format");
}

// ---------------------------------------------
// Assessment Year CV Services (Used by Nature Module)
// ---------------------------------------------

/**
 * Fetches assessment years with pagination
 * Handles both array and paged-object responses from the API
 */
export async function getAssessmentYearsPagedServerCV(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<AssessmentYearPagedResponseCV> {
  const params = new URLSearchParams();
  if (pageNumber > 0) params.append("PageNumber", pageNumber.toString());
  if (pageSize >= 1 || pageSize === -1) params.append("PageSize", pageSize.toString());
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());

  const queryString = params.toString();
  const endpoint = queryString ? `/AssessmentYearRangeCV?${queryString}` : '/AssessmentYearRangeCV';
  const response = await apiClient.get<AssessmentYearPagedResponseCV>(endpoint);

  if (!response.success) {
    const t = await getTranslations('natureFactorCVMaster');
    throw new ApiError(
      500,
      response.error || t('errors.fetchFailed'),
      "Fetch Assessment Year Range CV failed"
    );
  }

  const data = response.data;
  if (!data) {
    const t = await getTranslations('natureFactorCVMaster');
    throw new ApiError(
      500,
      t('errors.fetchFailed'),
      "Fetch Assessment Year Range CV returned undefined data"
    );
  }

  try {
    return normalizeAssessmentYearResponse(data, pageNumber, pageSize);
  } catch (_error) {
    const t = await getTranslations('natureFactorCVMaster');
    throw new ApiError(
      500,
      t('errors.fetchFailed'),
      "Fetch Assessment Year Range CV returned unexpected format"
    );
  }
}

/**
 * Deletes a NatureFactorCVMaster record by ID
 * @param id The ID of the record to delete
 * @returns Promise resolving to an object indicating success or failure
 */

export async function deleteNatureFactorCVMasterById(id:number): Promise<ApiResponse<null>> {
  const response = await apiClient.delete<null>(`/NatureFactorCVMaster/${id}/purge`);
  if (!response.success) {
    const t = await getTranslations('natureFactorCVMaster');
    throw new ApiError(response.statusCode || 500, response.error || t('deleteConfirmation.deleteFailed'), 'Delete Nature Factor CV Master failed');
  }
  return response;
}