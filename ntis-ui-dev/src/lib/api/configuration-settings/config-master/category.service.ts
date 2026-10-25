import { apiClient } from '@/services/api.service';
import { cache } from 'react';
import type {
  ConfigCategory,
  ConfigCategoryMaster,
  CreateConfigCategoryRequest,
  UpdateConfigCategoryRequest,
  BackendMutationResponse,
  DeleteResponse,
} from '@/types/configMaster.types';
import type { ApiResponse } from '@/types/common.types';
import { ConfigCategoryResponseSchema } from '@/lib/validations/config-master.schema';
import { logError } from '@/lib/utils/logger';

import { normalizeApiResponse } from './utils';

const ENDPOINT = '/ConfigCategoryMaster';

/**
 * Fetch all categories
 */
export const getAllCategories = cache(async (): Promise<ConfigCategory[]> => {
  try {
    const response = await apiClient.get<unknown>(ENDPOINT);
    
    // Handle failed API requests explicitly
    if (!response.success) {
      const errorMsg = response.error || 'Failed to fetch categories';
      logError('getAllCategories: API request failed', { error: new Error(errorMsg) });
      return [];
    }
    
    // Use shared normalization utility (Medium Priority 1 Fix)
    const rawItems = normalizeApiResponse(response.data);

    if (!Array.isArray(rawItems)) return [];

    const colors: ('rose' | 'emerald' | 'blue' | 'violet' | 'purple' | 'cyan')[] = 
      ['rose', 'emerald', 'blue', 'violet', 'purple', 'cyan'];

    // Return new objects to avoid mutating cached results
    return rawItems
      .map((item, index) => {
        const parsed = ConfigCategoryResponseSchema.parse(item);
        // Map to ConfigCategory UI type - return new object with count/total set here
        return {
          ...parsed,
          id: String(parsed.categoryId),
          name: parsed.categoryName,
          code: parsed.categoryCode,
          color: colors[index % colors.length],
          icon: parsed.categoryCode.toLowerCase(), // Use code as icon key
          count: 0, // Placeholder - will be updated externally without mutation
          total: 0, // Placeholder - will be updated externally without mutation
        };
      })
      .filter((cat) => {
        // Filter out garbage data
        const isPlaceholder = cat.name?.toLowerCase() === 'string' || 
                             cat.code?.toLowerCase() === 'string';
        return !isPlaceholder && cat.categoryId > 0;
      }) as ConfigCategory[];
  } catch (err) {
    logError('getAllCategories failed', { error: err instanceof Error ? err : undefined });
    throw err;
  }
});

/**
 * Get category by ID
 */
export const getCategoryById = cache(async (id: number): Promise<ConfigCategoryMaster | null> => {
  try {
    const response = await apiClient.get<ApiResponse<ConfigCategoryMaster>>(`${ENDPOINT}/${id}`);
    if (!response.data) return null;
    return ConfigCategoryResponseSchema.parse(response.data);
  } catch (err) {
    logError('getCategoryById failed', { error: err instanceof Error ? err : undefined, id });
    return null;
  }
});

/**
 * Create category
 */
export async function createCategory(payload: CreateConfigCategoryRequest) {
  return apiClient.post<BackendMutationResponse<ConfigCategoryMaster>>(ENDPOINT, payload);
}

/**
 * Update category
 */
export async function updateCategory(id: number, payload: UpdateConfigCategoryRequest) {
  return apiClient.put<BackendMutationResponse<ConfigCategoryMaster>>(`${ENDPOINT}/${id}`, payload);
}

/**
 * Delete category (Hard delete)
 */
export async function deleteCategory(id: number) {
  return apiClient.delete<DeleteResponse>(`${ENDPOINT}/${id}`);
}
