import { apiClient } from '@/services/api.service';
import { cache } from 'react';
import type {
  ModuleMaster,
  ModuleMasterResponse,
  CreateModuleMasterRequest,
  UpdateModuleMasterRequest,
} from '@/types/moduleMaster.types';
import type { ApiResponse } from '@/types/common.types';
import { ModuleMasterResponseSchema } from '@/lib/validations/config-master.schema';
import { logError } from '@/lib/utils/logger';
import { parseBoolean } from '@/lib/utils/type-guards';
const ENDPOINTS = {
  list: '/ModuleMaster',
};
const MAX_PAGE_SIZE = 1000;
const MAX_PAGES = 50;
function normalizeModuleMaster(data: unknown): ModuleMaster {
  const result = ModuleMasterResponseSchema.safeParse(data);
  if (!result.success) {
    const item = (data || {}) as Record<string, unknown>;
    const activeVal = item.isActive ?? item.IsActive ?? item.status ?? item.Status ?? true;
    const isActive =
      typeof activeVal === 'string' && activeVal.toLowerCase() === 'inactive'
        ? false
        : parseBoolean(activeVal);

    const modId = Number(
      item.moduleMasterId ??
        item.ModuleMasterId ??
        item.moduleId ??
        item.ModuleId ??
        item.id ??
        item.Id ??
        0
    );
    const deptId = Number(
      item.departmentMasterId ??
        item.DepartmentMasterId ??
        item.departmentId ??
        item.DepartmentId ??
        item.deptId ??
        item.DeptId ??
        0
    );

    return {
      moduleId: isNaN(modId) ? 0 : modId,
      departmentId: isNaN(deptId) ? 0 : deptId,
      moduleCode: String(item.moduleCode ?? item.ModuleCode ?? item.code ?? item.Code ?? ''),
      moduleName: String(
        item.moduleName ??
          item.ModuleName ??
          item.moduleNane ??
          item.ModuleNane ??
          ''
      ),
      moduleNameLocal: String(item.moduleNameLocal ?? item.ModuleNameLocal ?? ''),
      moduleIcon: String(item.moduleIcon ?? item.ModuleIcon ?? ''),
      moduleLabel: String(item.moduleLabel ?? item.ModuleLabel ?? ''),
      moduleDescription: String(item.moduleDescription ?? item.ModuleDescription ?? ''),
      departmentName: String(item.departmentName ?? item.DepartmentName ?? ''),
      isActive,
    };
  }
  return result.data as ModuleMaster;
}
class ModuleMasterService {
  getModuleMasters = cache(async (): Promise<ApiResponse<ModuleMaster[]>> => {
    try {
      const allItems: unknown[] = [];
      // 1. Fetch first page
      const firstResponse = await apiClient.get<unknown[] | ModuleMasterResponse>(
        `${ENDPOINTS.list}?pageSize=${MAX_PAGE_SIZE}&pageNumber=1`,
        { cache: 'no-store' }
      );

      if (!firstResponse.success || !firstResponse.data) {
        return {
          success: false,
          data: [],
          message: firstResponse.error || 'Failed to fetch modules',
          error: firstResponse.error,
        };
      }

      const firstRawData = firstResponse.data;
      let firstItems: unknown[] = [];
      if (Array.isArray(firstRawData)) {
        firstItems = firstRawData;
      } else if (firstRawData && typeof firstRawData === 'object') {
        const data = firstRawData as unknown as Record<string, unknown>;
        const itemsList = data['items'] ?? data['Items'];
        if (Array.isArray(itemsList)) firstItems = itemsList as unknown[];
      }
      allItems.push(...firstItems);

      const meta = Array.isArray(firstRawData) ? null : (firstRawData as unknown as Record<string, unknown>);
      const totalPages = Number((meta?.totalPages as number | undefined) ?? (meta?.TotalPages as number | undefined));

      // 2. Fetch subsequent pages sequentially to avoid rate limits (Critical Fix)
      if (Number.isFinite(totalPages) && totalPages > 1) {
        for (let page = 2; page <= Math.min(totalPages, MAX_PAGES); page++) {
          const res = await apiClient.get<unknown[] | ModuleMasterResponse>(
            `${ENDPOINTS.list}?pageSize=${MAX_PAGE_SIZE}&pageNumber=${page}`,
            { cache: 'no-store' }
          );

          if (res.success && res.data) {
            let pItems: unknown[] = [];
            if (Array.isArray(res.data)) {
              pItems = res.data;
            } else if (res.data && typeof res.data === 'object') {
              const data = res.data as unknown as Record<string, unknown>;
              const itemsList = data['items'] ?? data['Items'];
              if (Array.isArray(itemsList)) pItems = itemsList as unknown[];
            }
            allItems.push(...pItems);
            if (pItems.length < MAX_PAGE_SIZE) break;
          } else {
            break;
          }
        }
      } else if (firstItems.length === MAX_PAGE_SIZE) {
        // Fallback for missing totalPages
        for (let pageNumber = 2; pageNumber <= MAX_PAGES; pageNumber += 1) {
          const res = await apiClient.get<unknown[] | ModuleMasterResponse>(
            `${ENDPOINTS.list}?pageSize=${MAX_PAGE_SIZE}&pageNumber=${pageNumber}`,
            { cache: 'no-store' }
          );
          if (!res.success || !res.data) break;
          
          let pItems: unknown[] = [];
          if (Array.isArray(res.data)) {
            pItems = res.data;
          } else if (res.data && typeof res.data === 'object') {
            const data = res.data as unknown as Record<string, unknown>;
            const itemsList = data['items'] ?? data['Items'];
            if (Array.isArray(itemsList)) pItems = itemsList as unknown[];
          }
          if (pItems.length === 0) break;
          allItems.push(...pItems);
          if (pItems.length < MAX_PAGE_SIZE) break;
        }
      }
      const deduped = allItems.map(normalizeModuleMaster).filter(
        (item, index, arr) => arr.findIndex((x) => x.moduleId === item.moduleId) === index
      );
      return {
        success: true,
        data: deduped,
      };
    } catch (error) {
      logError('moduleMasterService.getModuleMasters failed', { error: error instanceof Error ? error : undefined });
      return {
        success: false,
        data: [],
        message: 'An unexpected error occurred while fetching modules',
        error: 'An unexpected error occurred',
      };
    }
  });
  async createModuleMaster(payload: CreateModuleMasterRequest): Promise<ApiResponse<ModuleMaster>> {
    try {
      const response = await apiClient.post<unknown>(ENDPOINTS.list, payload);
      if (response.success && response.data) {
        // Check if response.data has an inner success field
        const hasInnerSuccess = typeof response.data === 'object' && response.data !== null && 'success' in response.data;
        if (hasInnerSuccess && !(response.data as Record<string, unknown>).success) {
          return {
            success: false,
            message: (response.data as Record<string, unknown>).message as string || 'Failed to create module',
            error: (response.data as Record<string, unknown>).error as string || (response.data as Record<string, unknown>).message as string,
          };
        }
        // The API returns a direct object if successful, or wrapped in result object
        const rawData = response.data;
        let finalData: unknown = rawData;
        // Handle common wrapping: { success: true, items: { ... }, ... }
        if (typeof rawData === 'object' && rawData !== null) {
          const items = (rawData as Record<string, unknown>).items;
          if (items) finalData = items;
        }
        return {
          success: true,
          data: normalizeModuleMaster(finalData),
          message: 'Module created successfully',
        };
      }
      return {
        success: false,
        message: response.error || 'Failed to create module',
        error: response.error,
      };
    } catch (error: unknown) {
      logError('moduleMasterService.createModuleMaster failed', { error: error instanceof Error ? error : undefined });
      return {
        success: false,
        message: 'An unexpected error occurred while creating the module',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
  async updateModule(
    id: number,
    payload: UpdateModuleMasterRequest
  ): Promise<ApiResponse<ModuleMaster>> {
    try {
      const response = await apiClient.put<unknown>(`${ENDPOINTS.list}/${id}`, payload);
      if (response.success && response.data) {
        // Check if response.data has an inner success field
        const hasInnerSuccess = typeof response.data === 'object' && response.data !== null && 'success' in response.data;
        if (hasInnerSuccess && !(response.data as Record<string, unknown>).success) {
          return {
            success: false,
            message: (response.data as Record<string, unknown>).message as string || 'Failed to update module',
            error: (response.data as Record<string, unknown>).error as string || (response.data as Record<string, unknown>).message as string,
          };
        }
        return {
          success: true,
          data: normalizeModuleMaster(response.data),
          message: 'Module updated successfully',
        };
      }
      return {
        success: false,
        message: response.error || 'Failed to update module',
        error: response.error,
      };
    } catch (error: unknown) {
      logError('moduleMasterService.updateModule failed', { error: error instanceof Error ? error : undefined, id });
      return {
        success: false,
        message: 'An unexpected error occurred while updating the module',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
  async deleteModule(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.delete<null>(`${ENDPOINTS.list}/${id}/purge`);
      if (response.success) {
        return {
          success: true,
          data: null,
          message: 'Module deleted successfully',
        };
      }
      return {
        success: false,
        message: response.error || 'Failed to delete module',
        error: response.error,
      };
    } catch (error: unknown) {
      logError('moduleMasterService.deleteModule failed', { error: error instanceof Error ? error : undefined, id });
      return {
        success: false,
        message: 'An unexpected error occurred while deleting the module',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
}
export const moduleMasterService = new ModuleMasterService();
