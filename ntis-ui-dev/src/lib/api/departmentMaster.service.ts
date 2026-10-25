import { apiClient } from '@/services/api.service';
import { cache } from 'react';
import {
  DepartmentMaster,
  DepartmentMasterFormModel,
  PagedResponse,
} from '@/types/departmentMaster.types';
import { logError } from '@/lib/utils/logger';
import {
  buildDepartmentPayload,
  buildDepartmentQueryString,
  normalizeDepartmentMaster,
} from './departmentMaster.utils';

const API_ENDPOINTS = {
  getAll: '/DepartmentMaster',
  create: '/DepartmentMaster',
  update: (id: number) => `/DepartmentMaster/${id}`,
  delete: (id: number) => `/DepartmentMaster/${id}`,
};

/**
 * Get Department Masters with pagination (for dropdowns/stats)
 * Returns { success, data } to match the pattern expected by server actions
 */
export const getDepartmentMasters = cache(async (
  pageNumber = 1,
  pageSize = 10,
  searchTerm?: string
): Promise<{ success: boolean; data: DepartmentMaster[] | null; error?: string }> => {
  try {
    const pagedData = await getDepartmentMastersPagedServer(pageNumber, pageSize, searchTerm);
    if (pagedData && Array.isArray(pagedData.items)) {
      return { success: true, data: pagedData.items };
    }
    return { success: true, data: [] };
  } catch (_error) {
    logError('getDepartmentMasters failed', { error: _error instanceof Error ? _error : undefined, pageNumber, pageSize, searchTerm });
    return {
      success: false,
      data: null,
      error: _error instanceof Error ? _error.message : 'Failed to fetch departments',
    };
  }
});

/**
 * Get all Department Masters by paging through backend responses.
 */
export const getAllDepartmentMasters = cache(async (
  searchTerm?: string
): Promise<{ success: boolean; data: DepartmentMaster[] | null; error?: string }> => {
  const pageSize = 1000;
  const maxPages = 50;
  const allItems: DepartmentMaster[] = [];

  try {
    // 1. Fetch first page
    const firstPage = await getDepartmentMastersPagedServer(1, pageSize, searchTerm);
    const firstItems = Array.isArray(firstPage.items) ? firstPage.items : [];
    
    if (firstItems.length === 0) return { success: true, data: [] };
    allItems.push(...firstItems);

    const totalPages = firstPage.totalPages || 0;

    // 2. Fetch subsequent pages sequentially to avoid rate limits (Critical Fix)
    if (totalPages > 1) {
      for (let page = 2; page <= Math.min(totalPages, maxPages); page++) {
        const pageRes = await getDepartmentMastersPagedServer(page, pageSize, searchTerm);
        if (Array.isArray(pageRes.items)) {
          allItems.push(...pageRes.items);
        }
        // If we got fewer items than requested, we've reached the end
        if (!pageRes.items || pageRes.items.length < pageSize) break;
      }
    } else if (firstItems.length === pageSize) {
      // Fallback for missing totalPages
      for (let pageNumber = 2; pageNumber <= maxPages; pageNumber += 1) {
        const page = await getDepartmentMastersPagedServer(pageNumber, pageSize, searchTerm);
        const items = Array.isArray(page.items) ? page.items : [];
        if (items.length === 0) break;
        allItems.push(...items);
        if (items.length < pageSize) break;
      }
    }

    return { success: true, data: allItems };
  } catch (error: unknown) {
    logError('getAllDepartmentMasters failed', { error: error instanceof Error ? error : undefined, searchTerm });
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch all departments',
    };
  }
});
/**
 * Get Paged Department Masters (Server Side)
 */
export async function getDepartmentMastersPagedServer(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<DepartmentMaster>> {
  const queryParams: Record<string, string | number> = {
    PageNumber: pageNumber,
    PageSize: pageSize,
  };

  if (searchTerm?.trim()) {
    queryParams.SearchTerm = searchTerm.trim();
  }

  const queryString = buildDepartmentQueryString(queryParams);
  const response = await apiClient.get<PagedResponse<DepartmentMaster>>(
    `${API_ENDPOINTS.getAll}?${queryString}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch departments');
  }

  const rawData = response.data;
  const rawItems = (rawData.items ?? (rawData as unknown as Record<string, unknown>).Items ?? []) as unknown[];
  
  return {
    ...rawData,
    items: rawItems.map(normalizeDepartmentMaster),
  };
}

/**
 * Create Department Master
 */
export async function createDepartmentMaster(data: DepartmentMasterFormModel): Promise<void> {
  const response = await apiClient.post(API_ENDPOINTS.create, buildDepartmentPayload(data));

  if (!response.success) {
    throw new Error(response.error || 'Failed to create department');
  }
}

/**
 * Update Department Master
 */
export async function updateDepartmentMaster(data: DepartmentMasterFormModel): Promise<void> {
  if (!data.departmentId) throw new Error('Department ID is required for update');
  const response = await apiClient.put(
    API_ENDPOINTS.update(data.departmentId),
    buildDepartmentPayload(data)
  );

  if (!response.success) {
    throw new Error(response.error || 'Failed to update department');
  }
}

/**
 * Delete Department Master
 */
export async function deleteDepartmentMaster(id: number): Promise<void> {
  const response = await apiClient.delete(API_ENDPOINTS.delete(id));

  if (!response.success) {
    throw new Error(response.error || `Failed to delete department ${id}`);
  }
}

/**
 * Service object wrapper for class-style imports
 */
export const departmentMasterService = {
  getDepartmentMasters,
  getAllDepartmentMasters,
  getDepartmentMastersPagedServer,
  createDepartmentMaster,
  updateDepartmentMaster,
  deleteDepartmentMaster,
};
