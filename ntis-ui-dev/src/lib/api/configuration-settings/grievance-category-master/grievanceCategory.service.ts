/**
 * Grievance Category API Service
 */
import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import type {
  GrievanceCategory,
  CreateGrievanceCategoryRequest,
  UpdateGrievanceCategoryRequest,
  GetGrievanceCategoriesParams,
  GetGrievanceCategoriesResult,
} from '@/types/grievance-category-master/grievanceCategory.types';
import {
  normalizeGrievanceCategory,
  parsePaginatedResponse,
  type RawPaginatedResponse,
} from './grievance-category-normalizer';
import { logError } from '@/lib/utils/logger';

const ENDPOINTS = {
  list: '/GrievanceCategory',
  getById: '/GrievanceCategory',
  create: '/GrievanceCategory',
  update: '/GrievanceCategory',
  delete: '/GrievanceCategory',
};
const GRIEVANCE_FETCH_BATCH_SIZE = 10;
const GRIEVANCE_MAX_PAGE_SIZE = 1000;

export async function getGrievanceCategories(
  params: GetGrievanceCategoriesParams
): Promise<GetGrievanceCategoriesResult> {
  const {
    page = 1,
    pageSize = GRIEVANCE_FETCH_BATCH_SIZE,
    search,
    departmentId,
    isActive,
  } = params;
  const effectivePageSize = Math.min(pageSize, GRIEVANCE_MAX_PAGE_SIZE);
  const queryParams = new URLSearchParams();
  queryParams.set('PageNumber', String(page));
  queryParams.set('PageSize', String(effectivePageSize));
  if (search) queryParams.set('SearchTerm', search);
  if (departmentId) queryParams.set('DepartmentId', String(departmentId));
  if (isActive !== undefined) queryParams.set('IsActive', String(isActive));

  const response = await apiClient.get<RawPaginatedResponse>(`${ENDPOINTS.list}?${queryParams}`);
  if (!response.success)
    return {
      categories: [],
      total: 0,
      page,
      pageSize: effectivePageSize,
      totalPages: 0,
    };

  const { items, total } = parsePaginatedResponse(response.data);

  const categories = items.reduce<GrievanceCategory[]>((acc, item) => {
    try {
      acc.push(normalizeGrievanceCategory(item));
    } catch (err) {
      logError('Failed to parse grievance category item', {
        errorDetail: err instanceof Error ? err.message : String(err),
        itemKeys: typeof item === 'object' && item !== null ? Object.keys(item) : [],
        itemPreview: JSON.stringify(item).slice(0, 200),
      });
    }
    return acc;
  }, []);
  const totalPages = Math.ceil(total / effectivePageSize);
  return { categories, total, page, pageSize: effectivePageSize, totalPages };
}

export async function getAllCategories(
  params: GetGrievanceCategoriesParams = {}
): Promise<{ categories: GrievanceCategory[]; total: number }> {
  const result = await getGrievanceCategories({
    ...params,
    page: 1,
    pageSize: GRIEVANCE_MAX_PAGE_SIZE,
  });
  return { categories: result.categories, total: result.total };
}

export async function getGrievanceCategoryById(
  id: number
): Promise<ApiResponse<GrievanceCategory>> {
  if (!id || id <= 0) return { success: false, error: 'Invalid ID' };
  const response = await apiClient.get<unknown>(`${ENDPOINTS.getById}/${id}`);
  if (!response.success) return { success: false, error: response.error };
  try {
    const resData = response.data as Record<string, unknown>;
    if (resData && resData.success === false) {
      return {
        success: false,
        error:
          (resData.error as string) || (resData.message as string) || 'Failed to fetch category',
      };
    }
    const rawData = resData?.items ?? resData?.data ?? resData;
    const category = normalizeGrievanceCategory(rawData);
    return { success: true, data: category };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse category',
    };
  }
}

export async function createGrievanceCategory(
  data: CreateGrievanceCategoryRequest
): Promise<ApiResponse<GrievanceCategory>> {
  const response = await apiClient.post<unknown>(ENDPOINTS.create, data);
  if (!response.success)
    return { success: false, error: response.error, message: response.message };
  try {
    const resData = response.data as Record<string, unknown>;
    if (resData && resData.success === false) {
      return {
        success: false,
        error:
          (resData.error as string) || (resData.message as string) || 'Failed to create category',
      };
    }
    const rawData = resData?.items ?? resData?.data ?? resData;
    const category = normalizeGrievanceCategory(rawData);
    return { success: true, data: category, message: 'Created successfully' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse created category',
    };
  }
}

export async function updateGrievanceCategory(
  data: UpdateGrievanceCategoryRequest
): Promise<ApiResponse<GrievanceCategory>> {
  const response = await apiClient.put<unknown>(`${ENDPOINTS.update}/${data.id}`, data);
  if (!response.success)
    return { success: false, error: response.error, message: response.message };
  try {
    const resData = response.data as Record<string, unknown>;
    if (resData && resData.success === false) {
      return {
        success: false,
        error:
          (resData.error as string) || (resData.message as string) || 'Failed to update category',
      };
    }
    const rawData = resData?.items ?? resData?.data ?? resData;
    const category = normalizeGrievanceCategory(rawData);
    return { success: true, data: category, message: 'Updated successfully' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse updated category',
    };
  }
}

export async function deleteGrievanceCategory(id: number, userId?: number): Promise<ApiResponse<void>> {
  if (!id || id <= 0) return { success: false, error: 'Invalid ID' };
  const queryParams = new URLSearchParams();
  if (userId) {
    queryParams.set('userId', String(userId));
    queryParams.set('updatedBy', String(userId));
  }
  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const response = await apiClient.delete<unknown>(`${ENDPOINTS.delete}/${id}${queryStr}`);
  if (!response.success)
    return { success: false, error: response.error, message: response.message };

  const resData = response.data as Record<string, unknown> | undefined;
  if (resData && resData.success === false) {
    return {
      success: false,
      error:
        (resData.error as string) || (resData.message as string) || 'Failed to delete category',
    };
  }
  return { success: true, message: 'Deleted successfully' };
}
