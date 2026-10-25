import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import type {
  Department,
  DepartmentUpdateRequest,
  Module,
  ModuleUpdateRequest,
  DepartmentListResponse,
} from '@/types/departmentActivation.types';
import type { ModuleMaster } from '@/types/moduleMaster.types';
import { getModuleMastersSummary } from '@/lib/api/configuration-settings/module-master/module-master.services';
import { normalizeDepartment } from './activation-types-guard';

function toActivationModule(module: ModuleMaster): Module {
  return {
    moduleId: module.moduleId,
    departmentId: module.departmentId ?? 0,
    departmentName: module.departmentName ?? '',
    moduleCode: module.moduleCode ?? '',
    moduleName: module.moduleName ?? '',
    moduleNameLocal: module.moduleNameLocal ?? null,
    moduleIcon: module.moduleIcon ?? null,
    moduleLabel: module.moduleLabel ?? null,
    moduleDescription: module.moduleDescription ?? '',
    isActive: module.isActive,
  };
}

const API_ENDPOINTS = {
  departmentMaster: {
    getAll: '/DepartmentMaster',
    update: (id: number) => `/DepartmentMaster/${id}`,
  },
  moduleMaster: {
    getAll: '/ModuleMaster',
    update: (id: number) => `/ModuleMaster/${id}`,
  }
};

class DepartmentActivationService {
  async getDepartments(pageNumber = 1, pageSize = 10): Promise<ApiResponse<Department[]>> {
    try {
      const response = await apiClient.get<DepartmentListResponse>(
        `${API_ENDPOINTS.departmentMaster.getAll}?PageNumber=${pageNumber}&PageSize=${pageSize}`
      );

      if (response.success && response.data) {
        const items = response.data.items || [];
        const normalized = items.map(normalizeDepartment);

        // Deduplicate departments by departmentId to prevent UI issues and duplicate keys
        const uniqueDepartments: Department[] = [];
        const seenIds = new Set<number>();
        
        normalized.forEach((dept: Department) => {
          if (dept.departmentId > 0 && !seenIds.has(dept.departmentId)) {
            seenIds.add(dept.departmentId);
            uniqueDepartments.push(dept);
          }
        });

        return { success: true, data: uniqueDepartments };
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch departments',
        message: response.message,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Failed to fetch departments',
      };
    }
  }

  async updateDepartmentStatus(
    data: DepartmentUpdateRequest,
    userId: number
  ): Promise<ApiResponse<Department>> {
    try {
      const payload = { ...data, updatedBy: userId };
      const response = await apiClient.put<Department>(
        API_ENDPOINTS.departmentMaster.update(data.departmentId),
        payload
      );

      if (response.success) {
        return { success: true, data: response.data };
      }

      return {
        success: false,
        error: response.error || 'Failed to update department',
        message: response.message,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Failed to update department',
      };
    }
  }

  async getModulesByDepartment(departmentId: number): Promise<ApiResponse<Module[]>> {
    try {
      // Fetch via the same paginated summary used by Module Master, then filter
      // client-side. The filtered API query (departmentId + isActive) can miss
      // newly created modules while still returning updates to existing ones.
      const allModules = await getModuleMastersSummary();
      const modules = allModules
        .filter((module) => module.departmentId === departmentId)
        .map(toActivationModule);

      return { success: true, data: modules };
    } catch (error: unknown) {
      return {
        success: false,
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Failed to fetch modules',
      };
    }
  }

  async updateModuleStatus(
    data: ModuleUpdateRequest,
    userId: number
  ): Promise<ApiResponse<Module>> {
    try {
      const payload = {
        id: data.moduleId,
        moduleId: data.moduleId,
        departmentId: data.departmentId,
        moduleCode: data.moduleCode,
        moduleName: data.moduleName,
        moduleNane: data.moduleName,
        moduleNameLocal: data.moduleNameLocal,
        moduleIcon: data.moduleIcon,
        moduleLabel: data.moduleLabel,
        moduleDescription: data.moduleDescription,
        isActive: data.isActive,
        IsActive: data.isActive,
        updatedBy: userId,
      };
      const response = await apiClient.put<Module>(
        API_ENDPOINTS.moduleMaster.update(data.moduleId),
        payload
      );

      if (response.success) {
        return { success: true, data: response.data };
      }

      return {
        success: false,
        error: response.error || 'Failed to update module',
        message: response.message,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Failed to update module',
      };
    }
  }
}

export const departmentActivationService = new DepartmentActivationService();
