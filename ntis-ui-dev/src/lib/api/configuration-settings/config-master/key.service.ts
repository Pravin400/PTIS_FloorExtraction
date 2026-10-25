import { apiClient } from '@/services/api.service';
import { cache } from 'react';
import type {
  ConfigKeyMaster,
  CreateConfigKeyRequest,
  UpdateConfigKeyRequest,
  BackendMutationResponse,
  DeleteResponse,
} from '@/types/configMaster.types';
import type { ApiResponse } from '@/types/common.types';
import { ConfigKeyResponseSchema } from '@/lib/validations/config-master.schema';
import type { ConfigItem } from '@/types/configMaster.types';
import { logError } from '@/lib/utils/logger';
import { normalizeApiResponse } from './utils';

const ENDPOINT = '/ConfigKeyMaster';

// Reduced page size to avoid backend 500 errors
export const BULK_CONFIG_KEYS_PARAMS = { categoryId: 'all', pageSize: 100, fetchAll: true };

/**
 * Fetch all config keys with optional filtering
 */
export const getAllConfigKeys = cache(async (params: { 
  categoryId?: string; 
  pageNumber?: number; 
  pageSize?: number;
  fetchAll?: boolean;
} = {}): Promise<ApiResponse<ConfigItem[]>> => {
  try {
    // Validate categoryId to prevent SQL injection
    if (params.categoryId && params.categoryId !== 'all') {
      if (!/^\d+$/.test(params.categoryId)) {
        return { success: false, error: 'Invalid category ID format' };
      }
    }
    const normalizeKeys = (raw: unknown[]): ConfigItem[] => {
      if (!Array.isArray(raw)) {
        return [];
      }
      return raw.map((item: unknown) => {
        try {
          const parsed = ConfigKeyResponseSchema.parse(item);
          const itemData = item as Record<string, unknown>;
          
          return {
            id: parsed.id,
            configKeyId: parsed.configKeyId,
            configValueId: 0,
            categoryId: parsed.categoryId,
            name: parsed.configName,
            configCode: parsed.configCode,
            description: parsed.description,
            value: '', // Initial value placeholder
            defaultValue: parsed.defaultValue,
            isEnabled: parsed.isActive,
            category: String(parsed.categoryId),
            type: (parsed.dataType?.toLowerCase() === 'boolean' || parsed.controlType?.toLowerCase() === 'toggle') ? 'boolean' : 'text',
            controlType: parsed.controlType,
            dataType: parsed.dataType,
            options: undefined,
            stats: {
              deptOverrides: 0,
              userOverrides: 0,
              totalDepts: 0,
              totalUsers: 0
            },
            hasTag: false,
            createdDate: parsed.createdDate || (itemData.createdDate as string) || (itemData.CreatedDate as string) || null,
            updatedDate: parsed.updatedDate || (itemData.updatedDate as string) || (itemData.UpdatedDate as string) || (itemData.modifiedDate as string) || (itemData.ModifiedDate as string) || (itemData.lastModifiedDate as string) || (itemData.LastModifiedDate as string) || (itemData.updatedOn as string) || (itemData.UpdatedOn as string) || null
          };
        } catch (parseError) {
          throw parseError;
        }
      });
    };
    const buildQuery = (pageNumber?: number, pageSize?: number): string => {
      const query = new URLSearchParams();
      if (params.categoryId && params.categoryId !== 'all') {
        query.append('CategoryId', params.categoryId);
        // Fallback for different casing/naming in some environments
        query.append('categoryId', params.categoryId);
        query.append('ConfigCategoryId', params.categoryId);
      }
      if (pageNumber) query.append('PageNumber', String(pageNumber));
      if (pageSize) query.append('PageSize', String(pageSize));
      return query.toString();
    };

    let response: ApiResponse<unknown>;
    let normalized: ConfigItem[] = [];

    // Fetch all values to extract global settings (where DepartmentId and ModuleId are null/0)
    const valuesResponse = await apiClient.get<unknown>('/ConfigValueMaster?pageSize=500');
    const rawValues = valuesResponse.success ? normalizeApiResponse(valuesResponse.data) : [];
    const configValues = Array.isArray(rawValues)
      ? rawValues.map((v: unknown) => {
          const d = v as Record<string, unknown>;
          return {
            configValueId: Number(d.configValueId ?? d.ConfigValueId ?? d.id ?? d.Id),
            configKeyId: Number(d.configKeyId ?? d.ConfigKeyId),
            departmentId: d.departmentId ?? d.DepartmentId ?? null,
            moduleId: d.moduleId ?? d.ModuleId ?? null,
            value: String(d.value ?? d.Value ?? ''),
            isActive: d.isActive ?? d.IsActive ?? true,
          };
        })
      : [];

    const mergeGlobalValues = (items: ConfigItem[]): ConfigItem[] => {
      return items.map((item) => {
        const globalVal = configValues.find(
          (v) =>
            v.configKeyId === item.configKeyId &&
            (v.departmentId === null || v.departmentId === 0) &&
            (v.moduleId === null || v.moduleId === 0)
        );
        if (globalVal) {
          return {
            ...item,
            value: globalVal.value,
            configValueId: globalVal.configValueId,
          };
        }
        return item;
      });
    };

    if (params.fetchAll) {
      const effectivePageSize = Math.max(100, params.pageSize ?? 500);
      const maxPages = 50;
      let currentPage = 1;
      let hasNext = true;
      const merged: ConfigItem[] = [];
      while (hasNext && currentPage <= maxPages) {
        const query = buildQuery(currentPage, effectivePageSize);
        response = await apiClient.get<unknown>(`${ENDPOINT}?${query}`);
        if (!response.success) {
          return {
            success: false,
            data: merged,
            error: response.error || 'Failed to fetch keys',
            statusCode: response.statusCode,
          };
        }
        const rawItems = normalizeApiResponse(response.data);
        const pageItems = normalizeKeys(rawItems);
        merged.push(...pageItems);
        const rawData = response.data as Record<string, unknown> | null;
        const rawHasNext = rawData?.hasNext ?? rawData?.HasNext;
        const totalPagesRaw = rawData?.totalPages ?? rawData?.TotalPages;
        const totalPages = Number(totalPagesRaw);
        const hasNextByMeta = typeof rawHasNext === 'boolean'
          ? rawHasNext
          : (Number.isFinite(totalPages) ? currentPage < totalPages : false);
        hasNext = hasNextByMeta || rawItems.length >= effectivePageSize;
        currentPage += 1;
        if (rawItems.length === 0 || rawItems.length < effectivePageSize) {
          hasNext = false;
        }
      }
      normalized = merged.filter((item, index, arr) =>
        arr.findIndex((x) => x.configKeyId === item.configKeyId) === index
      );
      normalized = mergeGlobalValues(normalized);
      return {
        success: true,
        data: normalized,
      };
    } else {
      const query = buildQuery(params.pageNumber, params.pageSize);
      response = await apiClient.get<unknown>(`${ENDPOINT}?${query}`);
      if (!response.success) {
        return {
          success: false,
          data: [],
          error: response.error || 'Failed to fetch keys',
          statusCode: response.statusCode,
        };
      }
      const rawItems = normalizeApiResponse(response.data);
      normalized = mergeGlobalValues(normalizeKeys(rawItems));
    }
    // If we requested a category but got nothing, try fetching all and filtering in JS as a graceful fallback
    if (normalized.length === 0 && params.categoryId && params.categoryId !== 'all') {
      const allRes = await getAllConfigKeys({ ...params, categoryId: 'all', fetchAll: true });
      if (allRes.success && Array.isArray(allRes.data)) {
        const filtered = allRes.data.filter(item => String(item.categoryId) === String(params.categoryId));
        return { ...allRes, data: filtered };
      }
    }
    return {
      ...response,
      data: normalized,
    };
  } catch (err) {
    logError('getAllConfigKeys failed', { error: err instanceof Error ? err : undefined, params });
    return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch keys' };
  }
});
/**
 * Get config key by ID
 */
export const getConfigKeyById = cache(async (id: number): Promise<ApiResponse<ConfigKeyMaster>> => {
  try {
    const response = await apiClient.get<unknown>(`${ENDPOINT}/${id}`);
    if (!response.data) throw new Error('Key not found');

    return {
      ...response,
      data: ConfigKeyResponseSchema.parse(response.data),
    };
  } catch (err) {
    logError('getConfigKeyById failed', { error: err instanceof Error ? err : undefined, id });
    return { success: false, error: 'Key not found' };
  }
});
/**
 * Get items by category with a high PageSize to ensure all records are shown.
 * Wrapped in React cache for request-level deduplication.
 */
export const getItemsByCategory = cache(async (categoryId: string) => {
  try {
    if (categoryId === 'all') {
      return await getAllConfigKeys({ pageSize: 100, fetchAll: true });
    }
    return getAllConfigKeys({ categoryId, pageSize: 100, fetchAll: true });
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error in getItemsByCategory'
    };
  }
});
/**
 * Create config key
 */
export async function createConfigKey(payload: CreateConfigKeyRequest) {
  return apiClient.post<BackendMutationResponse<ConfigKeyMaster>>(ENDPOINT, payload);
}
/**
 * Update config key
 */
export async function updateConfigKey(id: number, payload: UpdateConfigKeyRequest) {
  return apiClient.put<BackendMutationResponse<ConfigKeyMaster>>(`${ENDPOINT}/${id}`, payload);
}

/**
 * Delete config key (Hard delete)
 */
export async function deleteConfigKey(id: number) {
  return apiClient.delete<DeleteResponse>(`${ENDPOINT}/${id}`);
}
