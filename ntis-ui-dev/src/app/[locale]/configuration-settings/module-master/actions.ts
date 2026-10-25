'use server';

import type { ModuleMaster, ModuleMasterFormData } from '@/types/moduleMaster.types';
import type { ApiResponse, PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { verifyServerActionAccess } from '@/lib/utils/server-access-guard';
import {
  getModuleMastersPaged,
  getModuleMasterById,
  getModuleMastersSummary,
  createModuleMaster,
  updateModuleMaster,
  deleteModuleMaster,
} from '@/lib/api/configuration-settings/module-master/module-master.services';
import { getAllDepartmentMasters } from '@/lib/api/configuration-settings/department-master/departmentMaster.service';
import type { DepartmentMaster } from '@/types/departmentMaster.types';
import {
  handleActionError,
  validateAndNormalize,
  revalidateModuleMaster,
  resolveUserId,
  parseApiError,
} from './actions.utils';
import {
  getCachedModuleMasterMetadata,
  getCachedModuleMastersSummary,
  type ModuleMasterMetadata,
} from './actions.cache';

export async function getModuleMastersAction(
  pageNumber: number = 1,
  pageSize: number = 10,
  searchTerm: string = '',
  sortBy?: string,
  sortOrder?: string
): Promise<ApiResponse<PagedResponse<ModuleMaster>>> {
  try {
    const data = await getModuleMastersPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
    return { success: true, data };
  } catch (error: unknown) {
    return handleActionError<PagedResponse<ModuleMaster>>(error, 'messages.fetchFailed');
  }
}

export async function createModuleMasterAction(
  data: ModuleMasterFormData
): Promise<ApiResponse<void>> {
  try {
    const hasAccess = await verifyServerActionAccess('MODULE_MASTER', 'edit');
    if (!hasAccess) {
      return { success: false, error: 'messages.unauthorized' };
    }

    const validationResult = validateAndNormalize(data);

    if (!validationResult.isValid) {
      return { success: false, error: `validation.${validationResult.validationCode}` };
    }

    const normalizedData = validationResult.normalizedData;
    const existing = await getModuleMastersSummary();

    // Check if code exists
    const codeExists = existing.some(
      (m) => m.moduleCode?.trim().toUpperCase() === normalizedData.moduleCode.trim().toUpperCase()
    );
    if (codeExists) {
      return { success: false, error: 'validation.moduleCodeExists' };
    }

    // Check if name exists
    const nameExists = existing.some(
      (m) => m.moduleName?.trim().toLowerCase() === normalizedData.moduleName.trim().toLowerCase()
    );
    if (nameExists) {
      return { success: false, error: 'validation.moduleNameExists' };
    }

    const userId = await resolveUserId();

    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    await createModuleMaster(normalizedData, userId);

    revalidateModuleMaster();

    return { success: true, message: 'messages.createSuccess' };
  } catch (error: unknown) {
    return handleActionError(error, 'messages.createFailed');
  }
}

export async function updateModuleMasterAction(
  id: number,
  data: ModuleMasterFormData
): Promise<ApiResponse<void>> {
  try {
    const hasAccess = await verifyServerActionAccess('MODULE_MASTER', 'edit');
    if (!hasAccess) {
      return { success: false, error: 'messages.unauthorized' };
    }

    const validationResult = validateAndNormalize(data);

    if (!validationResult.isValid) {
      return { success: false, error: `validation.${validationResult.validationCode}` };
    }

    const normalizedData = validationResult.normalizedData;
    const existing = await getModuleMastersSummary();

    // Check if code exists (excluding current module)
    const codeExists = existing.some(
      (m) =>
        m.moduleId !== id &&
        m.moduleCode?.trim().toUpperCase() === normalizedData.moduleCode.trim().toUpperCase()
    );
    if (codeExists) {
      return { success: false, error: 'validation.moduleCodeExists' };
    }

    // Check if name exists (excluding current module)
    const nameExists = existing.some(
      (m) =>
        m.moduleId !== id &&
        m.moduleName?.trim().toLowerCase() === normalizedData.moduleName.trim().toLowerCase()
    );
    if (nameExists) {
      return { success: false, error: 'validation.moduleNameExists' };
    }

    const userId = await resolveUserId();

    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    await updateModuleMaster(id, normalizedData, userId);

    revalidateModuleMaster();

    return { success: true, message: 'messages.updateSuccess' };
  } catch (error: unknown) {
    return handleActionError(error, 'messages.updateFailed');
  }
}

export async function deleteModuleMasterAction(id: number): Promise<ApiResponse<void>> {
  try {
    const hasAccess = await verifyServerActionAccess('MODULE_MASTER', 'delete');
    if (!hasAccess) {
      return { success: false, error: 'messages.unauthorized' };
    }

    await deleteModuleMaster(id);

    revalidateModuleMaster();

    return { success: true, message: 'messages.deleteSuccess' };
  } catch (error: unknown) {
    return handleActionError(error, 'messages.deleteFailed');
  }
}

export async function getModuleMastersSummaryAction(): Promise<ApiResponse<ModuleMaster[]>> {
  try {
    const data = await getCachedModuleMastersSummary();
    return { success: true, data };
  } catch (error: unknown) {
    return handleActionError<ModuleMaster[]>(error, 'messages.fetchFailed');
  }
}

export async function getModuleMasterMetadata(): Promise<ApiResponse<ModuleMasterMetadata>> {
  try {
    const data = await getCachedModuleMasterMetadata();
    return { success: true, data };
  } catch (error: unknown) {
    const fallback: ModuleMasterMetadata = { totalCount: 0, activeCount: 0, inactiveCount: 0 };

    if (error instanceof ApiError) {
      return {
        success: false,
        error: parseApiError(error.responseText, 'messages.fetchFailed'),
        statusCode: error.statusCode,
        data: fallback,
      };
    }

    return { success: false, error: 'messages.fetchFailed', data: fallback };
  }
}

export async function getModuleMasterByIdAction(id: number): Promise<ApiResponse<ModuleMaster>> {
  try {
    const data = await getModuleMasterById(id);
    return { success: true, data };
  } catch (error: unknown) {
    return handleActionError<ModuleMaster>(error, 'messages.fetchFailed');
  }
}

export async function getAllDepartmentMastersAction(): Promise<ApiResponse<DepartmentMaster[]>> {
  try {
    const result = await getAllDepartmentMasters();
    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'messages.fetchFailed' };
    }
    return { success: true, data: result.data };
  } catch (error: unknown) {
    return handleActionError<DepartmentMaster[]>(error, 'messages.fetchFailed');
  }
}
