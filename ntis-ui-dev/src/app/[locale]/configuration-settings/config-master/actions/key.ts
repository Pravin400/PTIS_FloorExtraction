'use server';

import { revalidatePath } from 'next/cache';
import { configMasterService } from '@/lib/api/configuration-settings/config-master/configMaster.service';
import {
  CreateConfigKeySchema,
  UpdateConfigKeySchema,
} from '@/lib/validations/config-master.schema';
import type {
  ConfigItem,
  UpdateConfigKeyRequest,
} from '@/types/configMaster.types';
import type { ActionResult } from '@/types/common.types';
import { verifySession, getLocaleFromHeaders, tConfigMessage, localizeConfigError, localizeBackendMessage } from './utils';
import { logError } from '@/lib/utils/logger';
import { sanitizeTextInput } from '@/lib/utils/input-sanitization';

/**
 * Fetch config items by category
 */
export async function getConfigItemsByCategoryAction(
  categoryId: string
): Promise<ActionResult<ConfigItem[]>> {
  try {
    await verifySession();
    const response = await configMasterService.getItemsByCategory(categoryId);
    if (response.success) {
      return { success: true, data: response.data };
    }
    return { success: false, error: response.error };
  } catch (err) {
    logError('getConfigItemsByCategoryAction failed', { error: err instanceof Error ? err : undefined, categoryId });
    const errorMessage = await localizeConfigError(err, 'failedFetch', 'Failed to fetch items');
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetch all config items (across all categories)
 */
export async function getAllConfigItemsAction(): Promise<ActionResult<ConfigItem[]>> {
  try {
    await verifySession();
    // Cap pageSize at a reasonable limit for performance (Section 10 Compliance)
    const response = await configMasterService.getAllConfigKeys({ pageNumber: 1, pageSize: 200 });
    
    if (response.success && response.data) {
      return { success: true, data: response.data };
    }
    return { success: false, error: response.error };
  } catch (error) {
    logError('getAllConfigItemsAction failed', { error: error instanceof Error ? error : undefined });
    const errorMessage = await localizeConfigError(error, 'failedFetch', 'Failed to search all items');
    return {
      success: false,
      error: errorMessage,
    };
  }
}


/**
 * Create a new Config Key
 */
export async function createConfigKeyAction(formData: FormData): Promise<ActionResult> {
  try {
    const userId = await verifySession();

    const rawData = {
      categoryId: parseInt(formData.get('categoryId') as string),
      configCode: (formData.get('configCode') as string || '').replace(/[^A-Za-z0-9_]/g, ''),
      configName: sanitizeTextInput(formData.get('configName') as string),
      description: sanitizeTextInput(formData.get('description') as string || ''),
      dataType: formData.get('dataType'),
      controlType: formData.get('controlType'),
      defaultValue: formData.get('defaultValue') as string,
      isActive: formData.get('isActive') === 'true',
    };

    const validation = CreateConfigKeySchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: await tConfigMessage('unexpectedError', 'Validation failed'),
        validationErrors: validation.error.flatten().fieldErrors,
      };
    }

    const result = await configMasterService.createConfigKey({
      ...validation.data,
      description: validation.data.description ?? '',
      defaultValue: validation.data.defaultValue ?? '',
      createdBy: userId,
    });

    if (result.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
      return { 
        success: true, 
        message: await tConfigMessage('keyCreated', 'Config Key created successfully') 
      };
    }

    return {
      success: false,
      error: await localizeBackendMessage(result.error, 'keyCreateFailed', 'Failed to create config key'),
    };
  } catch (err) {
    logError('createConfigKeyAction failed', { error: err instanceof Error ? err : undefined });
    const errorMessage = await localizeConfigError(err, 'keyCreateFailed', 'Failed to create config key');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update Config Key
 */
export async function updateConfigKeyAction(
  keyId: number,
  data: Partial<UpdateConfigKeyRequest>
): Promise<ActionResult> {
  try {
    const userId = await verifySession();

    const validation = UpdateConfigKeySchema.safeParse({
      ...data,
      configCode: data.configCode ? data.configCode.replace(/[^A-Za-z0-9_]/g, '') : undefined,
      configName: data.configName ? sanitizeTextInput(data.configName) : undefined,
      description: data.description !== undefined ? String(data.description).replace(/[<>]/g, '') : undefined,
      defaultValue: data.defaultValue !== undefined ? String(data.defaultValue) : undefined,
      updatedBy: userId,
    });

    if (!validation.success) {
      return {
        success: false,
        error: await tConfigMessage('unexpectedError', 'Validation failed'),
        validationErrors: validation.error.flatten().fieldErrors,
      };
    }

    const res = await configMasterService.updateConfigKey(keyId, {
      ...validation.data,
      description: validation.data.description ?? '',
      defaultValue: validation.data.defaultValue ?? '',
      updatedBy: userId,
    });

    if (res.success) {
      const newDefVal = validation.data.defaultValue ?? '';
      try {
        const valRes = await configMasterService.getAllConfigValuesFull(keyId);
        if (valRes.success && Array.isArray(valRes.data)) {
          const globalVal = valRes.data.find(
            (v) => (v.departmentId === null || v.departmentId === 0) && (v.moduleId === null || v.moduleId === 0)
          );
          if (globalVal) {
            await configMasterService.updateConfigValue(globalVal.configValueId, {
              configKeyId: keyId,
              departmentId: null,
              moduleId: null,
              value: newDefVal,
              isActive: globalVal.isActive,
              updatedBy: userId,
            });
          }
        }
      } catch {
        // Silently ignore background value sync issues
      }

      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
      return { 
        success: true, 
        message: await tConfigMessage('keyUpdated', 'Configuration key updated successfully') 
      };
    }

    return { success: false, error: await localizeBackendMessage(res.error, 'keyUpdateFailed', 'Failed to update config key') };
  } catch (err) {
    logError('updateConfigKeyAction failed', { error: err instanceof Error ? err : undefined, keyId });
    const errorMessage = await localizeConfigError(err, 'keyUpdateFailed', 'Failed to update config key');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete Key
 */
export async function deleteConfigKeyAction(id: number): Promise<ActionResult> {
  try {
    await verifySession();
    
    const res = await configMasterService.deleteConfigKey(id);
    if (res.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
    }
    return {
      success: res.success,
      error: res.success ? undefined : await localizeBackendMessage(res.error, 'deleteFailed', 'Failed to delete config key'),
      message: res.success ? await tConfigMessage('keyDeleted', 'Configuration key deleted successfully') : undefined,
    };
  } catch (err) {
    logError('deleteConfigKeyAction failed', { error: err instanceof Error ? err : undefined, id });
    const errorMessage = await localizeConfigError(err, 'deleteFailed', 'Failed to delete config key');
    return {
      success: false,
      error: errorMessage,
    };
  }
}
