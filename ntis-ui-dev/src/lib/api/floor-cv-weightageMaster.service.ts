import { apiClient } from '@/services/api.service';
import { getTranslations } from 'next-intl/server';
import type { ApiResponse, PagedResponse } from '@/types/common.types';
import {
  FloorFactorCVMaster,
  FloorFactorCVMasterUpdate,
  FloorFactorCVMasterCreate,
  BulkFloorFactorCVMasterCreate,
  BulkFloorFactorCVMasterUpdate,
  AssessmentYearCV,
  AssessmentYearPagedResponseCV,
  FloorPagedResponse,
} from '@/types/floor-cv-weightageMaster.types';
import { ApiError } from '../utils/api';

function isPagedResponse<T = unknown>(value: unknown): value is PagedResponse<T> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.items) &&
    typeof obj.totalCount === "number" &&
    typeof obj.pageNumber === "number" &&
    typeof obj.pageSize === "number" &&
    typeof obj.totalPages === "number" &&
    typeof obj.hasPrevious === "boolean" &&
    typeof obj.hasNext === "boolean"
  );
}

/**
 * Updates an existing FloorFactorCVMaster record
 */
export async function updateFloorFactorCVMaster(
  id: number,
  payload: FloorFactorCVMasterUpdate
): Promise<void> {
  try {
    if (!id || id <= 0) {
      throw new Error('Valid FloorFactorCV ID is required for update');
    }
    
    const requestPayload = {
      isActive: payload.isActive,
      updatedBy: payload.updatedBy,
      floorId: payload.floorId,
      factorWithLift: Number(payload.factorWithLift),
      factorWithoutLift: Number(payload.factorWithoutLift),
      yearRangeCVId: payload.yearRangeCVId,
    };

    const response = await apiClient.put<unknown>(
      `/FloorFactorCVMaster/${encodeURIComponent(String(id))}`,
      requestPayload
    );

    if (!response.success) {
      throw new ApiError(
        500,
        response.error || 'Failed to update Floor Factor CV Master',
        'Update Floor Factor CV Master failed'
      );
    }
  } catch (error) {
    console.error('Error updating Floor Factor CV Master:', error);
    throw error;
  }
}

/**
 * Fetches paginated FloorFactorCVMaster records with filtering
 */
export async function getFloorFactorCVMasterWithPagination(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  yearRangeCVId?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<FloorFactorCVMaster>> {
  try {
    const params = new URLSearchParams({
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
    });

    if (searchTerm?.trim()) {
      params.append("SearchTerm", searchTerm.trim());
    }

    if (yearRangeCVId?.trim()) {
      params.append("YearRangeCVId", yearRangeCVId.trim());
    }

    if (sortBy?.trim()) {
      params.append("SortBy", sortBy.trim());
    }

    if (sortOrder?.trim()) {
      params.append("SortOrder", sortOrder.trim());
    }

    const response = await apiClient.get<PagedResponse<FloorFactorCVMaster>>(
      `/FloorFactorCVMaster?${params.toString()}`
    );

    if (!response.success) {
      throw new ApiError(
        500,
        response.error || "Failed to fetch FloorFactorCVMaster records",
        "Fetch FloorFactorCVMaster (paged) failed"
      );
    }

    const data = response.data;

    if (!isPagedResponse(data)) {
      throw new ApiError(
        500,
        "Invalid response format",
        "Expected PagedResponse but received unexpected format"
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching paged FloorFactorCVMaster records:", error);
    throw error;
  }
}

/**
 * Fetches a single FloorFactorCVMaster record by ID
 */
export async function getFloorFactorCVMasterById(id: number): Promise<FloorFactorCVMaster> {
  try {
    if (!id || id <= 0) {
      throw new Error("Valid FloorFactorCV ID is required");
    }

    const response = await apiClient.get<FloorFactorCVMaster>(
      `/FloorFactorCVMaster/${encodeURIComponent(String(id))}`
    );

    if (!response.success || !response.data) {
      throw new ApiError(
        500,
        response.error || "Failed to fetch FloorFactorCVMaster record",
        "Fetch FloorFactorCVMaster (by ID) failed"
      );
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching FloorFactorCVMaster with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Creates a new FloorFactorCVMaster record (POST)
 */
export async function createFloorWeightageCv(payload: FloorFactorCVMasterCreate): Promise<ApiResponse<unknown>> {
  try {
    const requestPayload = {
      isActive: payload.isActive,
      createdBy: payload.createdBy,
      floorId: payload.floorId,
      factorWithLift: Number(payload.factorWithLift),
      factorWithoutLift: Number(payload.factorWithoutLift),
      yearRangeCVId: payload.yearRangeCVId,
    };

    return await apiClient.post<unknown>('/FloorFactorCVMaster', requestPayload);
  } catch (error) {
    console.error('Error creating Floor Factor CV Master:', error);
    throw error;
  }
}

/**
 * Bulk creates FloorFactorCVMaster records (POST)
 */
export async function bulkCreateFloorWeightageCv(
  payload: BulkFloorFactorCVMasterCreate
): Promise<ApiResponse<unknown>> {
  try {
    if (!payload || payload.length === 0) {
      throw new Error('Valid payload with floorFactors is required for bulk create');
    }

    const requestPayload = payload.map((factor) => ({
      isActive: factor.isActive,
      createdBy: factor.createdBy,
      floorId: factor.floorId,
      factorWithLift: Number(factor.factorWithLift),
      factorWithoutLift: Number(factor.factorWithoutLift),
      yearRangeCVId: factor.yearRangeCVId,
    }));

    return await apiClient.post<unknown>('/FloorFactorCVMaster/bulk', requestPayload);
  } catch (error) {
    console.error('Error in bulk creating Floor Factor CV Master:', error);
    throw error;
  }
}

/**
 * Bulk updates FloorFactorCVMaster records (PUT)
 */
export async function bulkUpdateFloorFactorCVMaster(
  payload: BulkFloorFactorCVMasterUpdate
): Promise<void> {
  try {
    if (!payload || payload.length === 0) {
      throw new Error('Valid payload with floorFactors is required for bulk update');
    }

    const requestPayload = payload.map((item) => ({
      id: item.id,
      data: {
        isActive: item.data.isActive,
        updatedBy: item.data.updatedBy,
        floorId: item.data.floorId,
        factorWithLift: Number(item.data.factorWithLift),
        factorWithoutLift: Number(item.data.factorWithoutLift),
        yearRangeCVId: item.data.yearRangeCVId,
      }
    }));

    const response = await apiClient.put<unknown>(
      '/FloorFactorCVMaster/bulk',
      requestPayload
    );

    if (!response.success) {
      throw new ApiError(
        500,
        response.error || 'Failed to bulk update Floor Factor CV Master',
        'Bulk update Floor Factor CV Master failed'
      );
    }
  } catch (error) {
    console.error('Error in bulk updating Floor Factor CV Master:', error);
    throw error;
  }
}

/**
 * Assessment Year CV Services
 */
export async function getAssessmentYearsPagedServerCV(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<AssessmentYearPagedResponseCV> {
  const params = new URLSearchParams();
  
  // Add pagination params - use -1 to fetch all records, reject values < -1
  if (pageNumber > 0) params.append("PageNumber", pageNumber.toString());
  if (pageSize >= 1 || pageSize === -1) {
    params.append("PageSize", pageSize.toString());
  }

  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());

  const queryString = params.toString();
  const endpoint = queryString ? `/AssessmentYearRangeCV?${queryString}` : '/AssessmentYearRangeCV';
  const response = await apiClient.get<AssessmentYearPagedResponseCV>(endpoint);

  if (!response.success) {
    throw new ApiError(
      500,
      response.error || "Failed to fetch assessment years CV",
      "Fetch assessment years CV (server-paged) failed"
    );
  }

  const data = response.data;
  if (!data) {
    throw new ApiError(
      500,
      "No data returned from assessment years CV API",
      "Fetch assessment years CV (server-paged) returned undefined data"
    );
  }

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
      pageNumber: pageNumber,
      pageSize: effectivePageSize,
      totalPages,
      hasPrevious: pageNumber > 1,
      hasNext: isFetchAllPageSize ? false : pageNumber < totalPages
    };
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as AssessmentYearPagedResponseCV).items)
  ) {
    (data as AssessmentYearPagedResponseCV).items = ((data as AssessmentYearPagedResponseCV).items as AssessmentYearCV[]).map((item) => ({
      ...item,
      yearId: item.id || item.yearId,
    }));
    return data as AssessmentYearPagedResponseCV;
  }

  throw new ApiError(
    500,
    "Invalid response format for assessment years CV",
    "Fetch assessment years CV (server-paged) returned unexpected format"
  );
}

/**
 * Floor Services
 */
export async function getFloorPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<FloorPagedResponse> {
  const params = new URLSearchParams();

  // Add pagination params - use -1 to fetch all records, reject values < -1
  if (pageNumber > 0) params.append("PageNumber", pageNumber.toString());
  if (pageSize >= 1 || pageSize === -1) {
    params.append("PageSize", pageSize.toString());
  }

  if (searchTerm?.trim()) {
    params.append("SearchTerm", searchTerm.trim());
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/Floor?${queryString}` : '/Floor';
  const response = await apiClient.get<FloorPagedResponse>(endpoint);

  if (!response.success) {
    throw new ApiError(
      500,
      response.error || "Failed to fetch floors",
      "Fetch floors failed"
    );
  }

  const data = response.data;
  if (!data) {
    throw new ApiError(
      500,
      "No data returned from floors API",
      "Fetch floors returned undefined data"
    );
  }

  // If API returns an array (non-paged response), normalize to PagedResponse format
  if (Array.isArray(data)) {
    const totalCount = data.length;
    const isFetchAllPageSize = pageSize <= 0;
    const effectivePageSize = isFetchAllPageSize ? (totalCount > 0 ? totalCount : 1) : pageSize;
    const totalPages = isFetchAllPageSize ? 1 : Math.ceil(totalCount / effectivePageSize);
    return {
      items: data,
      totalCount,
      pageNumber: pageNumber,
      pageSize: effectivePageSize,
      totalPages,
      hasPrevious: pageNumber > 1,
      hasNext: isFetchAllPageSize ? false : pageNumber < totalPages
    };
  }

  return data;
}

/**
 * Delete FloorFactorCVMaster record by ID
 * @param id The ID of the record to delete
 * @returns Promise resolving to an object indicating success or failure
 */


export async function deleteFloorFactorCVMasterById(id:number): Promise<ApiResponse<null>> {
  const response = await apiClient.delete<null>(`/FloorFactorCVMaster/${id}/purge`);
  if (!response.success) {
    const t = await getTranslations('floor');
    throw new ApiError(response.statusCode || 500, response.error || t('messages.deleteFailed'), 'Delete Floor Factor CV Master failed');
  }
  return response;
}
