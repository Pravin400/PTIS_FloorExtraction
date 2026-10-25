import { apiClient } from '@/services/api.service';
import type { ModuleMaster, ModuleMasterFormData } from '@/types/moduleMaster.types';
import type { PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { parseBoolean } from '@/lib/utils/type-guards';
import { normalizeModuleData } from './module-master.validator';

function buildModuleQuery(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): string {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });

  if (searchTerm) params.append('SearchTerm', searchTerm);
  if (sortBy) params.append('SortBy', sortBy);
  if (sortOrder) params.append('SortOrder', sortOrder);

  return `/ModuleMaster?${params.toString()}`;
}

export function normalizeModuleMasterFromApi(item: Record<string, unknown>): ModuleMaster {
  if (!item) return {} as ModuleMaster;

  const getProp = (keys: string[], fallback: unknown = undefined) => {
    for (const key of keys) {
      if (item[key] !== undefined) return item[key];
    }
    return fallback;
  };

  const getStringProp = (keys: string[], fallback = ''): string => {
    const val = getProp(keys);
    return val === null || val === undefined ? fallback : String(val);
  };

  return {
    moduleId: Number(getProp(['moduleId', 'ModuleId', 'id', 'Id'], 0)),
    departmentId: Number(getProp(['departmentId', 'DepartmentId', 'deptId'], 0)),
    moduleCode: getStringProp(['moduleCode', 'ModuleCode'], ''),
    moduleName: getStringProp(['moduleName', 'ModuleName', 'moduleNane', 'ModuleNane'], ''),
    moduleNameLocal: getStringProp(['moduleNameLocal', 'ModuleNameLocal'], ''),
    moduleIcon: getStringProp(['moduleIcon', 'ModuleIcon'], ''),
    moduleLabel: getStringProp(['moduleLabel', 'ModuleLabel'], ''),
    moduleDescription: getStringProp(['moduleDescription', 'ModuleDescription'], ''),
    departmentName: getStringProp(['departmentName', 'DepartmentName'], ''),
    isActive: parseBoolean(getProp(['isActive', 'IsActive'], true)),
  };
}

export async function getModuleMastersPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<ModuleMaster>> {
  const endpoint = buildModuleQuery(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
  const response = await apiClient.get<Record<string, unknown>>(endpoint);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch modules',
      'Get modules failed'
    );
  }

  const rawData = response.data;

  if (!rawData) {
    throw new ApiError(500, 'No data received from server', 'Get modules — invalid response');
  }

  let items: Record<string, unknown>[] = [];
  let totalCount = 0;
  let totalPages = 0;

  if (Array.isArray(rawData)) {
    items = rawData as Record<string, unknown>[];
    totalCount = rawData.length;
    totalPages = 1;
  } else {
    items = (rawData.items ?? rawData.Items ?? []) as Record<string, unknown>[];
    totalCount = Number(rawData.totalCount ?? rawData.TotalCount ?? items.length);
    totalPages = Number(rawData.totalPages ?? rawData.TotalPages ?? 1);
  }

  return {
    items: items.map(normalizeModuleMasterFromApi),
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPrevious: pageNumber > 1,
    hasNext: pageNumber < totalPages,
  };
}

export async function getModuleMasterById(id: number): Promise<ModuleMaster> {
  const response = await apiClient.get<Record<string, unknown>>(`/ModuleMaster/${id}`);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch module',
      `Get module ${id} failed`
    );
  }

  if (!response.data) {
    throw new ApiError(500, 'No data received from server', `Get module ${id} — invalid response`);
  }

  return normalizeModuleMasterFromApi(response.data);
}

export async function createModuleMaster(
  data: ModuleMasterFormData,
  userId: number
): Promise<void> {
  const normalized = normalizeModuleData(data);

  const payload = {
    moduleId: 0,
    departmentId: normalized.departmentId,
    moduleCode: normalized.moduleCode,
    moduleName: normalized.moduleName,
    moduleNane: normalized.moduleName,
    moduleNameLocal: normalized.moduleNameLocal,
    moduleIcon: normalized.moduleIcon,
    moduleLabel: normalized.moduleLabel,
    moduleDescription: normalized.moduleDescription,
    isActive: normalized.isActive,
    IsActive: normalized.isActive,
    createdBy: userId,
  };

  const response = await apiClient.post<unknown>('/ModuleMaster', payload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to create module',
      'Create module failed'
    );
  }
}

/** Updates an existing module record by ID. */
export async function updateModuleMaster(
  id: number,
  data: ModuleMasterFormData,
  userId: number
): Promise<void> {
  const normalized = normalizeModuleData(data);

  const payload = {
    id,
    moduleId: id,
    departmentId: normalized.departmentId,
    moduleCode: normalized.moduleCode,
    moduleName: normalized.moduleName,
    moduleNane: normalized.moduleName,
    moduleNameLocal: normalized.moduleNameLocal,
    moduleIcon: normalized.moduleIcon,
    moduleLabel: normalized.moduleLabel,
    moduleDescription: normalized.moduleDescription,
    isActive: normalized.isActive,
    IsActive: normalized.isActive,
    updatedBy: userId,
  };

  const response = await apiClient.put<unknown>(`/ModuleMaster/${id}`, payload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to update module',
      `Update module ${id} failed`
    );
  }
}

export async function deleteModuleMaster(id: number): Promise<void> {
  const response = await apiClient.delete<void>(`/ModuleMaster/${id}`);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to delete module',
      `Delete module ${id} failed`
    );
  }
}

const SUMMARY_PAGE_SIZE = 500;
const MAX_SUMMARY_PAGES = 10;
const SUMMARY_FETCH_CONCURRENCY = 3;

async function fetchModuleSummaryPages(
  pageNumbers: number[]
): Promise<PagedResponse<ModuleMaster>[]> {
  const results: PagedResponse<ModuleMaster>[] = [];

  for (let i = 0; i < pageNumbers.length; i += SUMMARY_FETCH_CONCURRENCY) {
    const batch = pageNumbers.slice(i, i + SUMMARY_FETCH_CONCURRENCY);

    const pages = await Promise.all(
      batch.map((page) => getModuleMastersPaged(page, SUMMARY_PAGE_SIZE))
    );

    results.push(...pages);
  }

  return results;
}

export async function getModuleMastersSummary(): Promise<ModuleMaster[]> {
  const firstPage = await getModuleMastersPaged(1, SUMMARY_PAGE_SIZE);

  if (firstPage.items.length === 0) {
    return [];
  }

  const totalPages =
    Number.isInteger(firstPage.totalPages) && firstPage.totalPages > 0
      ? firstPage.totalPages
      : Number.isInteger(firstPage.totalCount) && firstPage.totalCount > 0
        ? Math.ceil(firstPage.totalCount / SUMMARY_PAGE_SIZE)
        : null;

  const pagesToFetch = totalPages !== null ? Math.min(totalPages, MAX_SUMMARY_PAGES) : 1;
  const remainingPages = Array.from({ length: pagesToFetch - 1 }, (_, index) => index + 2);

  const additionalPages = await fetchModuleSummaryPages(remainingPages);

  const modulesById = new Map<number, ModuleMaster>();

  const addModulesToMap = (modules: ModuleMaster[]) => {
    for (const item of modules) {
      if (item.moduleId) {
        modulesById.set(item.moduleId, item);
      }
    }
  };

  addModulesToMap(firstPage.items);

  for (const page of additionalPages) {
    addModulesToMap(page.items);
  }

  return Array.from(modulesById.values());
}
