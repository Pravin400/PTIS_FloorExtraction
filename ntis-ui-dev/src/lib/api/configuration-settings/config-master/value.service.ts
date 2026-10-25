import { apiClient } from '@/services/api.service';
import { cache } from 'react';
import type {
  ConfigValueMaster,
  CreateConfigValueRequest,
  UpdateConfigValueRequest,
  BackendMutationResponse,
  DeleteResponse,
} from '@/types/configMaster.types';
import type { ApiResponse } from '@/types/common.types';
import { ConfigValueResponseSchema } from '@/lib/validations/config-master.schema';
import { logError } from '@/lib/utils/logger';

const ENDPOINT = '/ConfigValueMaster';

/**
 * Fetch config values for a key
 */
export const getAllConfigValuesFull = cache(async (
  configKeyId: number
): Promise<ApiResponse<ConfigValueMaster[]>> => {
  try {
    const response = await apiClient.get<unknown>(`${ENDPOINT}?ConfigKeyId=${configKeyId}`);
    if (!response.success) {
      if (response.statusCode === 404) {
        return {
          success: true,
          data: [],
        };
      }
      return {
        success: false,
        data: [],
        error: response.error || 'Failed to fetch config values',
      };
    }
    
    // Handle both direct array and paginated response (handles .data, .items, .Items, and nested variations)
    const data = response.data as Record<string, unknown> | unknown[];
    const rawItems = Array.isArray(data) 
      ? data 
      : (data as Record<string, unknown>)?.items as unknown[] ?? 
        (data as Record<string, unknown>)?.Items as unknown[] ?? 
        ((data as Record<string, unknown>)?.data as Record<string, unknown>)?.items as unknown[] ?? 
        ((data as Record<string, unknown>)?.data as Record<string, unknown>)?.Items as unknown[] ??
        (data as Record<string, unknown>)?.data as unknown[] ?? 
        [];

    return {
      success: true,
      data: rawItems.map((item: unknown) => ConfigValueResponseSchema.parse(item)),
    };
  } catch (err) {
    logError('getAllConfigValuesFull failed', { error: err instanceof Error ? err : undefined, configKeyId });
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : 'Failed to fetch config values',
    };
  }
});

/**
 * Get config value by ID
 */
export const getConfigValueById = cache(async (id: number): Promise<ApiResponse<ConfigValueMaster>> => {
  try {
    const response = await apiClient.get<unknown>(`${ENDPOINT}/${id}`);
    if (!response.data) throw new Error('Value not found');

    return {
      ...response,
      data: ConfigValueResponseSchema.parse(response.data),
    };
  } catch (err) {
    logError('getConfigValueById failed', { error: err instanceof Error ? err : undefined, id });
    return { success: false, error: 'Value not found' };
  }
});

/**
 * Create config value
 */
export async function createConfigValue(payload: CreateConfigValueRequest) {
  return apiClient.post<BackendMutationResponse<ConfigValueMaster>>(ENDPOINT, payload);
}

/**
 * Update config value
 */
export async function updateConfigValue(id: number, payload: UpdateConfigValueRequest) {
  return apiClient.put<BackendMutationResponse<ConfigValueMaster>>(`${ENDPOINT}/${id}`, payload);
}

/**
 * Delete config value (Hard delete)
 */
export async function deleteConfigValue(id: number) {
  return apiClient.delete<DeleteResponse>(`${ENDPOINT}/${id}`);
}
