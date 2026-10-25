'use server';

import { revalidatePath } from 'next/cache';
import { configMasterService } from '@/lib/api/configuration-settings/config-master/configMaster.service';
import type {
  CreateConfigValueRequest,
  UpdateConfigValueRequest,
  UpdateConfigKeyRequest,
  BackendMutationResponse,
  ConfigValueMaster,
  ConfigKeyMaster,
} from '@/types/configMaster.types';
import { verifySession, getLocaleFromHeaders, tConfigMessage, localizeConfigError, localizeBackendMessage } from './utils';
import type { ActionResult } from '@/types/common.types';
import { CreateConfigValueSchema } from '@/lib/validations/config-master.schema';
import { logError } from '@/lib/utils/logger';

/**
 * Create Config Value
 */
export async function createConfigValueAction(formData: FormData): Promise<ActionResult> {
  try {
    const userId = await verifySession();

    const rawData = {
      configKeyId: formData.get('configKeyId'),
      departmentId: formData.get('departmentId'),
      moduleId: formData.get('moduleId'),
      value: formData.get('value'),
      isEnabled: formData.get('isEnabled'),
    };

    const validation = CreateConfigValueSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: await tConfigMessage('unexpectedError', 'Validation failed'),
        validationErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { isEnabled, ...validatedData } = validation.data;

    const payload: CreateConfigValueRequest = {
      ...validatedData,
      isActive: isEnabled,
      createdBy: userId,
    };

    const result = await configMasterService.createConfigValue(payload);

    if (result.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
      return {
        success: true,
        message: await tConfigMessage('valueSaved', 'Config Value saved successfully'),
      };
    }

    return {
      success: false,
      error: await localizeBackendMessage(
        result.error || (result.data as BackendMutationResponse<ConfigValueMaster>)?.message,
        'configValueCreateFailed',
        'Failed to save config value'
      ),
    };
  } catch (err) {
    logError('createConfigValueAction failed', { error: err instanceof Error ? err : undefined });
    const errorMessage = await localizeConfigError(err, 'configValueCreateFailed', 'Failed to create config value');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update Config Item (Toggle or Value)
 */
export async function updateConfigItemAction(data: {
  id: string;
  configKeyId: number;
  value: boolean | string | number;
  isKey?: boolean;
}): Promise<ActionResult> {
  try {
    const userId = await verifySession();

    const isValueId =
      data.isKey === true ? false : !data.id.startsWith('key_') && !isNaN(parseInt(data.id));
    const isToggle = typeof data.value === 'boolean';

    if (isValueId) {
      const valId = parseInt(data.id);
      const valRes = await configMasterService.getConfigValueById(valId);
      if (!valRes.success || !valRes.data) {
        return { success: false, error: await tConfigMessage('failedFetch', 'Value not found') };
      }

      const existingVal = valRes.data;

      const updatePayload: UpdateConfigValueRequest = {
        configKeyId: existingVal.configKeyId,
        departmentId: existingVal.departmentId,
        moduleId: existingVal.moduleId,
        value: isToggle ? existingVal.value : String(data.value),
        isActive: isToggle ? Boolean(data.value) : existingVal.isActive,
        updatedBy: userId,
      };

      const result = await configMasterService.updateConfigValue(valId, updatePayload);
      if (result.success) {
        const locale = await getLocaleFromHeaders();
        revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
        return {
          success: true,
          message: await tConfigMessage('valueSaved', 'Updated'),
        };
      }
      return {
        success: false,
        error: await localizeBackendMessage(
          result.error || (result.data as BackendMutationResponse<ConfigValueMaster>)?.message,
          'saveFailed',
          'Failed to update configuration value'
        ),
      };
    } else {
      const keyId = data.configKeyId;
      const keyRes = await configMasterService.getConfigKeyById(keyId);
      if (!keyRes.success || !keyRes.data) {
        return { success: false, error: await tConfigMessage('failedFetch', 'Key not found') };
      }

      const key = keyRes.data;
      const updateKeyPayload: UpdateConfigKeyRequest = {
        categoryId: key.categoryId,
        configCode: key.configCode,
        configName: key.configName,
        description: key.description,
        dataType: key.dataType,
        controlType: key.controlType,
        defaultValue: key.defaultValue,
        isActive: Boolean(data.value),
        updatedBy: userId,
      };

      const result = await configMasterService.updateConfigKey(keyId, updateKeyPayload);
      if (result.success) {
        const locale = await getLocaleFromHeaders();
        revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
        return {
          success: true,
          message: await tConfigMessage('keyUpdated', 'Key updated'),
        };
      }
      return {
        success: false,
        error: await localizeBackendMessage(
          result.error || (result.data as BackendMutationResponse<ConfigKeyMaster>)?.message,
          'keyUpdateFailed',
          'Failed to update config key'
        ),
      };
    }
  } catch (err) {
    logError('updateConfigItemAction failed', {
      error: err instanceof Error ? err : undefined,
      data,
    });
    const errorMessage = await localizeConfigError(err, 'saveFailed', 'Failed to save configuration');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete Value
 */
export async function deleteConfigValueAction(id: number): Promise<ActionResult> {
  try {
    await verifySession();

    const res = await configMasterService.deleteConfigValue(id);
    if (res.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
    }
    return {
      success: res.success,
      error: res.success
        ? undefined
        : await localizeBackendMessage(res.error, 'deleteFailed', 'Failed to delete configuration value'),
      message: res.success
        ? await tConfigMessage('valueDeleted', 'Configuration value deleted successfully')
        : undefined,
    };
  } catch (err) {
    logError('deleteConfigValueAction failed', {
      error: err instanceof Error ? err : undefined,
      id,
    });
    const errorMessage = await localizeConfigError(err, 'deleteFailed', 'Failed to delete config value');
    return {
      success: false,
      error: errorMessage,
    };
  }
}
