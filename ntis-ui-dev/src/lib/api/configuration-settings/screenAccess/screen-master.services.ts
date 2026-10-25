import { apiClient } from '@/services/api.service';
import type { ScreenMasterData } from '@/types/screen-access.types';
import type { PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { logError } from '@/lib/utils/logger';
import { DEFAULT_SCREEN_ICON } from '@/lib/constants/screen-access.constants';
import { getModules } from './master-data.service';
import { getTranslations } from 'next-intl/server';
import { parseBoolean } from '@/lib/utils/type-guards';

export function normalizeScreen(data: Record<string, unknown>): ScreenMasterData {
  const screenMasterId = Number(
    data.screenMasterId ??
      data.screenId ??
      data.ScreenMasterId ??
      data.ScreenId ??
      data.id ??
      data.Id
  );

  const moduleId = Number(
    data.moduleMasterId ??
      data.ModuleMasterId ??
      data.moduleId ??
      data.ModuleId ??
      data.module_id ??
      0
  );

  const departmentMasterId = Number(
    data.departmentMasterId ??
      data.DepartmentMasterId ??
      data.departmentId ??
      data.DepartmentId ??
      data.deptId ??
      data.DeptId ??
      data.department_id ??
      0
  );

  const isGarbled = (str: string) => !str || /\?{2,}/.test(str);
  const screenNameStr = String(data.screenName ?? data.ScreenName ?? '');
  const screenNameLocalStr = String(
    data.screenNameLocal ?? data.ScreenNameLocal ?? data.screenName ?? data.ScreenName ?? ''
  );

  return {
    screenMasterId: screenMasterId > 0 ? screenMasterId : undefined,
    screenGroupId: Number(
      data.screenGroupId ?? data.ScreenGroupId ?? data.groupId ?? data.GroupId ?? 0
    ),
    screenGroupName: String(data.screenGroupName ?? data.ScreenGroupName ?? ''),
    moduleId: moduleId > 0 ? moduleId : null,
    moduleName:
      data.moduleName != null
        ? String(data.moduleName)
        : data.ModuleName != null
          ? String(data.ModuleName)
          : null,
    screenCode: String(data.screenCode ?? data.ScreenCode ?? ''),
    screenName: !isGarbled(screenNameStr)
      ? screenNameStr
      : !isGarbled(screenNameLocalStr)
        ? screenNameLocalStr
        : screenNameStr,
    screenNameLocal: screenNameLocalStr,
    screenIcon: String(data.screenIcon ?? data.ScreenIcon ?? ''),
    routePath: String(data.routePath ?? data.RoutePath ?? ''),
    isMenu: Boolean(data.isMenu ?? data.IsMenu),
    isAuthenticationRequired: Boolean(
      data.isAuthenticationRequired ?? data.IsAuthenticationRequired ?? true
    ),
    isActive: parseBoolean(data.isActive ?? data.IsActive ?? true),
    displayOrder: Number(data.displayOrder ?? data.DisplayOrder ?? 0),
    description: String(data.description ?? data.Description ?? ''),
    departmentMasterId: departmentMasterId > 0 ? departmentMasterId : null,
    createdDate:
      data.createdDate != null
        ? String(data.createdDate)
        : data.CreatedDate != null
          ? String(data.CreatedDate)
          : null,
    updatedDate:
      data.updatedDate != null
        ? String(data.updatedDate)
        : data.UpdatedDate != null
          ? String(data.UpdatedDate)
          : null,
    createdBy:
      data.createdBy != null
        ? Number(data.createdBy)
        : data.CreatedBy != null
          ? Number(data.CreatedBy)
          : null,
    updatedBy:
      data.updatedBy != null
        ? Number(data.updatedBy)
        : data.UpdatedBy != null
          ? Number(data.UpdatedBy)
          : null,
  };
}

export async function getScreens(
  params: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    screenGroupId?: number;
    isActive?: boolean;
  } = {}
): Promise<PagedResponse<ScreenMasterData>> {
  const queryParams = new URLSearchParams();
  if (params.pageNumber !== undefined) {
    queryParams.append('PageNumber', params.pageNumber.toString());
    queryParams.append('pageNumber', params.pageNumber.toString());
  }
  if (params.pageSize !== undefined) {
    queryParams.append('PageSize', params.pageSize.toString());
    queryParams.append('pageSize', params.pageSize.toString());
  }
  if (params.searchTerm) {
    queryParams.append('SearchTerm', params.searchTerm);
    queryParams.append('searchTerm', params.searchTerm);
  }
  if (params.isActive !== undefined) {
    queryParams.append('IsActive', params.isActive.toString());
    queryParams.append('isActive', params.isActive.toString());
  }
  if (params.screenGroupId !== undefined) {
    queryParams.append('ScreenGroupId', params.screenGroupId.toString());
    queryParams.append('screenGroupId', params.screenGroupId.toString());
  }

  const response = await apiClient.get<unknown>(
    `/ScreenMaster?${queryParams.toString()}`
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'errors.apiConnection.fetchScreensFailed',
      'Get screens failed'
    );
  }
  if (!response.data) {
    throw new ApiError(
      500,
      'errors.apiConnection.noDataReceived',
      'errors.apiConnection.invalidResponseFormat'
    );
  }
  const raw = response.data;
  let items: Record<string, unknown>[] = [];
  if (Array.isArray(raw)) {
    items = raw as Record<string, unknown>[];
  } else if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const candidate =
      r.items ?? r.Items ?? r.data ?? r.Data ?? r.result ?? r.Result ?? r.value ?? r.Value;
    if (Array.isArray(candidate)) {
      items = candidate as Record<string, unknown>[];
    } else if (candidate && typeof candidate === 'object') {
      const c = candidate as Record<string, unknown>;
      const nested = c.items ?? c.Items ?? c.data ?? c.Data;
      if (Array.isArray(nested)) {
        items = nested as Record<string, unknown>[];
      }
    }
  }
  const normalizedItems = items.map(normalizeScreen);

  const totalCount = Number(
    (raw as { totalCount?: number; TotalCount?: number })?.totalCount ??
      (raw as { totalCount?: number; TotalCount?: number })?.TotalCount ??
      items.length
  );
  const pageSize = Number(
    (raw as { pageSize?: number; PageSize?: number })?.pageSize ??
      (raw as { pageSize?: number; PageSize?: number })?.PageSize ??
      params.pageSize ??
      10
  );
  const calculatedTotalPages = Math.ceil(totalCount / (pageSize || 10));
  const rawTotalPages = Number(
    (raw as { totalPages?: number; TotalPages?: number })?.totalPages ??
      (raw as { totalPages?: number; TotalPages?: number })?.TotalPages ??
      0
  );
  const totalPages = rawTotalPages > 0 ? rawTotalPages : Math.max(1, calculatedTotalPages);

  return {
    items: normalizedItems,
    totalCount,
    pageNumber: params.pageNumber || 1,
    pageSize,
    totalPages,
    hasPrevious: (params.pageNumber || 1) > 1,
    hasNext: (params.pageNumber || 1) < totalPages,
  };
}

export async function getAllScreens(): Promise<ScreenMasterData[]> {
  const allItems: ScreenMasterData[] = [];
  const maxPages = 100;
  let page = 1;
  let totalCount = Infinity;

  while (page <= maxPages && allItems.length < totalCount) {
    const pageRes = await getScreens({ pageNumber: page, pageSize: 100 });
    const items = pageRes.items || [];
    if (items.length === 0) break;

    // Detect if page returns duplicate items
    const beforeCount = allItems.length;
    items.forEach((item) => {
      if (item.screenMasterId && !allItems.some((x) => x.screenMasterId === item.screenMasterId)) {
        allItems.push(item);
      }
    });

    // If no new items were added on this page, avoid infinite loop
    if (allItems.length === beforeCount) {
      break;
    }

    if (pageRes.totalCount && pageRes.totalCount > 0) {
      totalCount = pageRes.totalCount;
    }

    if (allItems.length >= totalCount) {
      break;
    }

    page++;
  }

  return allItems;
}

export async function getScreenById(id: number): Promise<ScreenMasterData> {
  const response = await apiClient.get<unknown>(`/ScreenMaster/${encodeURIComponent(String(id))}`);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'errors.apiConnection.fetchScreenFailed',
      `Get screen ${id} failed`
    );
  }

  if (!response.data) {
    throw new ApiError(500, 'errors.apiConnection.unexpectedFormat', 'Data validation failed');
  }

  return normalizeScreen(response.data as Record<string, unknown>);
}

export async function createScreen(
  data: Partial<ScreenMasterData>,
  userId?: number
): Promise<void> {
  let validModuleId = data.moduleId;
  if (!validModuleId && data.departmentMasterId) {
    try {
      const allModules = await getModules();
      const firstMod = allModules.find((m) => m.departmentMasterId === data.departmentMasterId);
      if (firstMod) validModuleId = firstMod.moduleId;
    } catch (e) {
      const t = await getTranslations('screenAccess');
      logError(t('screenManagement.screens.messages.fetchModulesError'), {
        error: e instanceof Error ? e : undefined,
      });
    }
  }

  const payload = {
    isMenu: true,
    isAuthenticationRequired: true,
    isActive: true,
    screenIcon: DEFAULT_SCREEN_ICON,
    ...data,
    moduleId: validModuleId ?? 0,
    moduleMasterId: validModuleId ?? 0,
    departmentMasterId: data.departmentMasterId ?? 0,
    departmentId: data.departmentMasterId ?? 0,
    displayOrder: Number(data.displayOrder ?? 0),
    screenNameLocal: data.screenNameLocal || data.screenName,
    createdBy: userId,
  };

  const response = await apiClient.post<unknown>('/ScreenMaster', payload);
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      'screenManagement.screens.messages.createError',
      'Create screen failed'
    );
  }
}

export async function updateScreen(
  id: number,
  data: Partial<ScreenMasterData>,
  userId?: number
): Promise<void> {
  let validModuleId = data.moduleId;
  if (!validModuleId && data.departmentMasterId) {
    try {
      const allModules = await getModules();
      const firstMod = allModules.find((m) => m.departmentMasterId === data.departmentMasterId);
      if (firstMod) validModuleId = firstMod.moduleId;
    } catch (e) {
      const t = await getTranslations('screenAccess');
      logError(t('screenManagement.screens.messages.fetchModulesError'), {
        error: e instanceof Error ? e : undefined,
      });
    }
  }

  const payload = {
    ...data,
    screenMasterId: id,
    screenId: id,
    id: id,
    moduleId: validModuleId ?? 0,
    moduleMasterId: validModuleId ?? 0,
    departmentMasterId: data.departmentMasterId ?? 0,
    departmentId: data.departmentMasterId ?? 0,
    displayOrder: Number(data.displayOrder ?? 0),
    screenNameLocal: data.screenName || data.screenNameLocal,
    isActive: data.isActive,
    IsActive: data.isActive,
    isStatus: data.isActive,
    status: data.isActive ? 'Active' : 'Inactive',
    Status: data.isActive ? 'Active' : 'Inactive',
    isMenu: data.isMenu,
    IsMenu: data.isMenu,
    updatedBy: userId,
  };

  const response = await apiClient.put<unknown>(
    `/ScreenMaster/${encodeURIComponent(String(id))}`,
    payload
  );
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      'screenManagement.screens.messages.updateError',
      'Update screen failed'
    );
  }
}

export async function deleteScreen(id: number): Promise<string> {
  const response = await apiClient.delete<Record<string, unknown>>(
    `/ScreenMaster/${encodeURIComponent(String(id))}`
  );
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      'screenManagement.screens.messages.deleteError',
      'Delete screen failed'
    );
  }
  return String(response.data?.message || '');
}
