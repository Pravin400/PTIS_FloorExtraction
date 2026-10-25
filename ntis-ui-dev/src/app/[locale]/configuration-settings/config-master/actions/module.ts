'use server';

import { revalidatePath } from 'next/cache';
import { moduleMasterService } from '@/lib/api/moduleMaster.service';
import { 
  CreateModuleMasterSchema, 
  UpdateModuleMasterSchema 
} from '@/lib/validations/config-master.schema';
import type { 
  CreateModuleMasterRequest, 
  UpdateModuleMasterRequest 
} from '@/types/moduleMaster.types';
import { verifySession, getLocaleFromHeaders, tConfigMessage, localizeConfigError, localizeBackendMessage } from './utils';
import type { ActionResult } from '@/types/common.types';
import { logError } from '@/lib/utils/logger';
import { sanitizeTextInput } from '@/lib/utils/input-sanitization';

/**
 * Fetch submodules (ModuleMaster) for a specific department
 */
export async function getModulesByDepartmentAction(departmentId: number) {
  try {
    await verifySession();
    const response = await moduleMasterService.getModuleMasters();
    if (!response.success || !response.data) return response;

    const modules = response.data.filter((m) => m.departmentId === departmentId);
    return { success: true, data: modules };
  } catch (err) {
    logError('getModulesByDepartmentAction failed', { error: err instanceof Error ? err : undefined, departmentId });
    const errorMessage = await localizeConfigError(err, 'failedFetch', 'Failed to fetch submodules');
    return {
      success: false,
      error: errorMessage,
    };
  }
}


/**
 * Create a new Module (Submodule)
 * Note: Accepts data without audit fields (createdBy) - added server-side for security
 */
export async function createModuleAction(data: Omit<CreateModuleMasterRequest, 'createdBy'>): Promise<ActionResult> {
  try {
    const userId = await verifySession();

    const validation = CreateModuleMasterSchema.safeParse({
      ...data,
      moduleCode: sanitizeTextInput(data.moduleCode),
      moduleName: sanitizeTextInput(data.moduleName),
      moduleDescription: data.moduleDescription ? sanitizeTextInput(data.moduleDescription) : data.moduleDescription,
    });
    if (!validation.success) {
      return {
        success: false,
        error: await tConfigMessage('unexpectedError', 'Validation failed'),
        validationErrors: validation.error.flatten().fieldErrors
      };
    }

    const result = await moduleMasterService.createModuleMaster({
      ...validation.data,
      moduleNameLocal: validation.data.moduleNameLocal ?? null,
      moduleIcon: validation.data.moduleIcon ?? null,
      moduleLabel: validation.data.moduleLabel ?? null,
      moduleDescription: validation.data.moduleDescription ?? null,
      createdBy: userId,
    });

    if (result.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
      return { success: true, message: await tConfigMessage('submoduleCreated', 'Submodule created successfully') };
    }
    return { success: false, error: await localizeBackendMessage(result.message || result.error, 'submoduleCreateFailed', 'Failed to create submodule') };
  } catch (err) {
    logError('createModuleAction failed', { error: err instanceof Error ? err : undefined });
    const errorMessage = await localizeConfigError(err, 'submoduleCreateFailed', 'Failed to create submodule');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update Module (Submodule)
 * Note: Accepts data without audit fields (moduleId, updatedBy) - added server-side for security
 */
export async function updateModuleAction(
  id: number,
  data: Omit<UpdateModuleMasterRequest, 'moduleId' | 'updatedBy'>
): Promise<ActionResult> {
  try {
    const userId = await verifySession();

    const validation = UpdateModuleMasterSchema.safeParse({
      ...data,
      moduleCode: data.moduleCode ? sanitizeTextInput(data.moduleCode) : data.moduleCode,
      moduleName: data.moduleName ? sanitizeTextInput(data.moduleName) : data.moduleName,
      moduleDescription: data.moduleDescription ? sanitizeTextInput(data.moduleDescription) : data.moduleDescription,
    });
    if (!validation.success) {
      return {
        success: false,
        error: await tConfigMessage('unexpectedError', 'Validation failed'),
        validationErrors: validation.error.flatten().fieldErrors
      };
    }

    const result = await moduleMasterService.updateModule(id, {
      ...validation.data,
      moduleId: id,
      moduleNameLocal: validation.data.moduleNameLocal ?? null,
      moduleIcon: validation.data.moduleIcon ?? null,
      moduleLabel: validation.data.moduleLabel ?? null,
      moduleDescription: validation.data.moduleDescription ?? null,
      updatedBy: userId,
    });

    if (result.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
      return { success: true, message: await tConfigMessage('submoduleUpdated', 'Submodule updated successfully') };
    }
    return { success: false, error: await localizeBackendMessage(result.message || result.error, 'submoduleUpdateFailed', 'Failed to update submodule') };
  } catch (err) {
    logError('updateModuleAction failed', { error: err instanceof Error ? err : undefined, id });
    const errorMessage = await localizeConfigError(err, 'submoduleUpdateFailed', 'Failed to update submodule');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete Module (Submodule)
 */
export async function deleteModuleAction(id: number): Promise<ActionResult> {
  try {
    await verifySession();
    
    const result = await moduleMasterService.deleteModule(id);
    if (result.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
      return { success: true, message: await tConfigMessage('submoduleDeleted', 'Submodule deleted') };
    }
    return { success: false, error: await localizeBackendMessage(result.error, 'deleteFailed', 'Failed to delete submodule') };
  } catch (err) {
    logError('deleteModuleAction failed', { error: err instanceof Error ? err : undefined, id });
    const errorMessage = await localizeConfigError(err, 'deleteFailed', 'Failed to delete submodule');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

