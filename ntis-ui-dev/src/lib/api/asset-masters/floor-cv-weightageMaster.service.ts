import { apiClient } from '@/services/api.service';
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
} from '@/types/asset-masters/floor-cv-weightageMaster.types';
import { ApiError } from '@/lib/utils/api';

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
      `/asset-management/floor-factor-cv/${encodeURIComponent(String(id))}`,
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

    let response = await apiClient.get<PagedResponse<FloorFactorCVMaster>>(
      `/asset-management/floor-factor-cv?${params.toString()}`
    );

    if (!response.success) {
      response = await apiClient.get<PagedResponse<FloorFactorCVMaster>>(
        `/FloorFactorCVMaster?${params.toString()}`
      );
    }

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

    const res = await apiClient.post<unknown>('/asset-management/floor-factor-cv', requestPayload);
    if (res.success) return res;
    return await apiClient.post<unknown>('/FloorFactorCVMaster', requestPayload);
  } catch (error) {
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

    try {
      const res = await apiClient.post<unknown>('/asset-management/floor-factor-cv/Bulk', requestPayload);
      if (res.success) return res;
    } catch {}

    return await apiClient.post<unknown>('/FloorFactorCVMaster/Bulk', requestPayload);
  } catch (error) {
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

    let response;
    try {
      response = await apiClient.put<unknown>(
        '/asset-management/floor-factor-cv/Bulk',
        requestPayload
      );
    } catch {
      response = await apiClient.put<unknown>(
        '/FloorFactorCVMaster/Bulk',
        requestPayload
      );
    }

    if (!response.success) {
      throw new ApiError(
        500,
        response.error || 'Failed to bulk update Floor Factor CV Master',
        'Bulk update Floor Factor CV Master failed'
      );
    }
  } catch (error) {
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
  const endpoint = queryString ? `/asset-management/assessment-year-range-cv?${queryString}` : '/asset-management/assessment-year-range-cv';
  let response = await apiClient.get<AssessmentYearPagedResponseCV>(endpoint);
  if (!response.success) {
    const fallbackEndpoint = queryString ? `/AssessmentYearRangeCV?${queryString}` : '/AssessmentYearRangeCV';
    response = await apiClient.get<AssessmentYearPagedResponseCV>(fallbackEndpoint);
  }

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
  let response = await apiClient.get<FloorPagedResponse>(endpoint);

  if (!response.success) {
    const fallbackEndpoint = queryString ? `/asset-management/floor?${queryString}` : '/asset-management/floor';
    response = await apiClient.get<FloorPagedResponse>(fallbackEndpoint);
  }

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