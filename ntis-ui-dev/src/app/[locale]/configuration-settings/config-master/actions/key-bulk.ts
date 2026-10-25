'use server';

import { revalidatePath } from 'next/cache';
import { configMasterService } from '@/lib/api/configuration-settings/config-master/configMaster.service';
import type { ConfigItem, UpdateConfigKeyRequest } from '@/types/configMaster.types';
import {
  verifySession,
  getLocaleFromHeaders,
  processBatch,
  tConfigMessage,
  MAX_CONCURRENT_UPDATES,
  localizeConfigError,
  localizeBackendMessage,
} from './utils';
import type { ActionResult } from '@/types/common.types';
import { z } from 'zod';
import { logError } from '@/lib/utils/logger';

const BulkUpdateStatusSchema = z.object({
  categoryId: z.number().int().positive(),
  isActive: z.boolean(),
});

/**
 * Update All Config Keys Status By Category ID
 */
export async function updateAllConfigKeysStatusByCategoryIdAction(
  categoryId: number,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const userId = await verifySession();

    const validation = BulkUpdateStatusSchema.safeParse({ categoryId, isActive });
    if (!validation.success) {
      return {
        success: false,
        error: await tConfigMessage('unexpectedError', 'Invalid input parameters'),
      };
    }

    const res = await configMasterService.getAllConfigKeys({ pageNumber: 1, pageSize: 1000 });
    if (!res.success || !res.data) {
      return {
        success: false,
        error: await tConfigMessage('failedFetch', 'Failed to fetch configurations'),
      };
    }

    const items: ConfigItem[] = Array.isArray(res.data)
      ? res.data
      : ((res.data as { items?: ConfigItem[] } | null)?.items ?? []);
    const targetKeys = items.filter((k) => Number(k.categoryId) === categoryId);

    if (targetKeys.length === 0) {
      return {
        success: true,
        message: await tConfigMessage(
          'noConfigurationsFound',
          'No configurations found in this category'
        ),
      };
    }

    const keysToUpdate = targetKeys.filter((key) => Boolean(key.isEnabled) !== isActive);

    if (keysToUpdate.length === 0) {
      return {
        success: true,
        message: await tConfigMessage(
          'configAlreadyInDesiredState',
          'All configurations are already in the desired state'
        ),
      };
    }

    const results = await processBatch(
      keysToUpdate,
      async (key) => {
        const payload: UpdateConfigKeyRequest = {
          categoryId: Number(key.categoryId),
          configCode: String(key.configCode),
          configName: String(key.name),
          description: String(key.description || ''),
          dataType: String(key.dataType),
          controlType: String(key.controlType),
          defaultValue: String(key.defaultValue || ''),
          isActive: isActive,
          updatedBy: userId,
        };
        return configMasterService.updateConfigKey(Number(key.configKeyId), payload);
      },
      MAX_CONCURRENT_UPDATES
    );

    const failed = results.find((r) => !r.success);
    if (failed) {
      return {
        success: false,
        error: await localizeBackendMessage(failed.error, 'keyUpdateFailed', 'Failed to update some configurations'),
      };
    }

    const locale = await getLocaleFromHeaders();
    revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');

    const successMessage = await tConfigMessage(
      isActive ? 'configsEnabled' : 'configsDisabled',
      `Successfully ${isActive ? 'enabled' : 'disabled'} configurations`
    );

    return {
      success: true,
      message: successMessage,
    };
  } catch (err) {
    logError('updateAllConfigKeysStatusByCategoryIdAction failed', {
      error: err instanceof Error ? err : undefined,
      categoryId,
      isActive,
    });
    const errorMessage = await localizeConfigError(err, 'unexpectedError', 'An unexpected error occurred during bulk update');

    return {
      success: false,
      error: errorMessage,
    };
  }
}
