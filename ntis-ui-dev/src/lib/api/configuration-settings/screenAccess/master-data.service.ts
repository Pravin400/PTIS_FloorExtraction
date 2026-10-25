import { apiClient } from '@/services/api.service';
import type { DepartmentMasterData, ModuleMasterData } from '@/types/screen-access.types';
import { ApiError } from '@/lib/utils/api';
import { getMasterDataPageSize } from './screen-access.services';
import { parseBoolean } from '@/lib/utils/type-guards';
import { moduleMasterService } from '@/lib/api/moduleMaster.service';

function extractArrayFromResponse(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw as Record<string, unknown>[];
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const candidate =
      r.items ?? r.Items ?? r.data ?? r.Data ?? r.result ?? r.Result ?? r.value ?? r.Value;
    if (Array.isArray(candidate)) {
      return candidate as Record<string, unknown>[];
    }
    if (candidate && typeof candidate === 'object') {
      const c = candidate as Record<string, unknown>;
      const nested = c.items ?? c.Items ?? c.data ?? c.Data;
      if (Array.isArray(nested)) {
        return nested as Record<string, unknown>[];
      }
    }
  }
  return [];
}

export async function getDepartments(): Promise<DepartmentMasterData[]> {
  const url = `/user-department-allocations/my-allocations`;
  const response = await apiClient.get<unknown>(url);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'errors.apiConnection.fetchDepartmentsFailed',
      'Get departments failed'
    );
  }

  const items = extractArrayFromResponse(response.data);

  return items
    .filter((dept) => {
      const activeVal = dept.isActive ?? dept.IsActive ?? dept.status ?? dept.Status ?? true;
      if (typeof activeVal === 'string' && activeVal.toLowerCase() === 'inactive') return false;
      return parseBoolean(activeVal);
    })
    .map((dept) => {
      const id = Number(
        dept.departmentMasterId ??
          dept.DepartmentMasterId ??
          dept.departmentId ??
          dept.DepartmentId ??
          dept.deptId ??
          dept.DeptId ??
          dept.id ??
          dept.Id
      );
      return {
        departmentMasterId: id,
        departmentId: id,
        departmentName: String(dept.departmentName ?? dept.DepartmentName ?? ''),
        departmentCode: String(dept.departmentCode ?? dept.DepartmentCode ?? ''),
      };
    })
    .filter((dept) => dept.departmentMasterId > 0);
}

export async function getModules(): Promise<ModuleMasterData[]> {
  try {
    const res = await moduleMasterService.getModuleMasters();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((m) => ({
        moduleId: m.moduleId,
        moduleMasterId: m.moduleId,
        moduleName: m.moduleName || '',
        departmentId: m.departmentId,
        departmentMasterId: m.departmentId,
        isActive: m.isActive,
      }));
    }
  } catch {
    // Fallback to direct fetch
  }

  const url = `/ModuleMaster?PageSize=${getMasterDataPageSize()}`;
  const response = await apiClient.get<unknown>(url);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'errors.apiConnection.fetchModulesFailed',
      'Get modules failed'
    );
  }

  const items = extractArrayFromResponse(response.data);

  return items
    .map((module) => {
      const activeVal = module.isActive ?? module.IsActive ?? module.status ?? module.Status ?? true;
      const isActive =
        typeof activeVal === 'string' && activeVal.toLowerCase() === 'inactive'
          ? false
          : parseBoolean(activeVal);
      const id = Number(
        module.moduleMasterId ??
          module.ModuleMasterId ??
          module.moduleId ??
          module.ModuleId ??
          module.id ??
          module.Id
      );
      const deptId = Number(
        module.departmentMasterId ??
          module.DepartmentMasterId ??
          module.departmentId ??
          module.DepartmentId ??
          module.deptId ??
          module.DeptId ??
          0
      );
      return {
        moduleMasterId: id,
        moduleId: id,
        moduleName: String(
          module.moduleName ??
            module.ModuleName ??
            module.moduleNane ??
            module.ModuleNane ??
            ''
        ),
        departmentMasterId: deptId,
        departmentId: deptId,
        isActive,
      };
    })
    .filter((module) => module.moduleMasterId > 0);
}
