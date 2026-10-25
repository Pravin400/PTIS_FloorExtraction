'use server';

import { revalidatePath } from 'next/cache';
import { configMasterService } from '@/lib/api/configuration-settings/config-master/configMaster.service';
import * as departmentMasterService from '@/lib/api/configuration-settings/department-master/departmentMaster.service';
import { moduleMasterService } from '@/lib/api/moduleMaster.service';
import { SaveDepartmentConfigurationSchema } from '@/lib/validations/config-master.schema';
import type { DepartmentApiResponse, ConfigValueMaster } from '@/types/configMaster.types';
import type { DepartmentMaster } from '@/types/departmentMaster.types';
import type { ModuleMaster } from '@/types/moduleMaster.types';
import {
  verifySession,
  processBatch,
  MAX_CONCURRENT_UPDATES,
  tConfigMessage,
  localizeBackendMessage,
} from './utils';
import type { ActionResult } from '@/types/common.types';
import { logError } from '@/lib/utils/logger';

/**
 * Get Department Configuration (for a specific Config Key)
 */
export async function getDepartmentConfigurationAction(
  configKeyId: number
): Promise<ActionResult<DepartmentApiResponse[]>> {
  try {
    await verifySession();
    const [deptRes, moduleRes, keyValues] = await Promise.all([
      departmentMasterService.getAllDepartmentMasters(),
      moduleMasterService.getModuleMasters(),
      configMasterService.getAllConfigValuesFull(configKeyId),
    ]);

    if (!deptRes.success || !deptRes.data) {
      return {
        success: false,
        error: await tConfigMessage('failedFetch', 'Failed to fetch departments'),
      };
    }
    if (!keyValues.success || !keyValues.data) {
      return {
        success: false,
        error:
          keyValues.error ||
          (await tConfigMessage('failedFetch', 'Failed to fetch configuration values')),
      };
    }

    let departments: DepartmentMaster[] = [];
    if (Array.isArray(deptRes.data)) {
      departments = deptRes.data;
    } else if (deptRes.data && typeof deptRes.data === 'object') {
      const data = deptRes.data as { items?: DepartmentMaster[]; Items?: DepartmentMaster[] };
      departments = data.items ?? data.Items ?? [];
    }

    const allModules = moduleRes.success && moduleRes.data ? moduleRes.data : [];
    const modulesByDeptId = new Map<number, typeof allModules>();
    allModules.forEach((m: ModuleMaster) => {
      if (m.departmentId && m.moduleName?.toLowerCase() !== 'string' && m.moduleId > 0) {
        const deptModules = modulesByDeptId.get(m.departmentId) || [];
        deptModules.push(m);
        modulesByDeptId.set(m.departmentId, deptModules);
      }
    });

    const deptSeen = new Set<number>();
    const activeDepartments = departments.filter((d) => {
      const isValid = d.departmentName?.toLowerCase() !== 'string' && d.departmentId > 0;
      if (isValid && !deptSeen.has(d.departmentId)) {
        deptSeen.add(d.departmentId);
        return true;
      }
      return false;
    });

    const items = transformDepartmentConfigs(activeDepartments, modulesByDeptId, keyValues.data);
    return { success: true, data: items };
  } catch (err) {
    logError('getDepartmentConfigurationAction failed', {
      error: err instanceof Error ? err : undefined,
      configKeyId,
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to load configuration',
    };
  }
}

function transformDepartmentConfigs(
  departments: DepartmentMaster[],
  modulesByDeptId: Map<number, ModuleMaster[]>,
  keyValues: ConfigValueMaster[]
): DepartmentApiResponse[] {
  // Pre-index keyValues for O(1) lookup instead of O(n) find operations
  const keyValueMap = new Map(
    keyValues.map((value) => [`${value.departmentId}_${value.moduleId ?? 0}`, value])
  );

  return departments.map((dept) => {
    const deptValueObj = keyValueMap.get(`${dept.departmentId}_0`);
    const submodules = (modulesByDeptId.get(dept.departmentId) || [])
      .filter((m, i, arr) => arr.findIndex((x) => x.moduleId === m.moduleId) === i)
      .map((mod) => {
        const modValueObj = keyValueMap.get(`${dept.departmentId}_${mod.moduleId}`);
        return {
          id: mod.moduleId,
          title: mod.moduleName || mod.moduleCode || '',
          code: mod.moduleCode || '',
          desc: mod.moduleDescription || '',
          isEnabled: !!modValueObj?.isActive,
          configValueId: modValueObj?.configValueId || 0,
          value: modValueObj?.value || '',
        };
      });

    const hasSubmodules = submodules.length > 0;

    return {
      id: dept.departmentId,
      name: dept.departmentName,
      code: dept.departmentCode,
      isEnabled: hasSubmodules
        ? submodules.some((sub) => sub.isEnabled)
        : !!deptValueObj?.isActive,
      configValueId: deptValueObj?.configValueId || 0,
      value: deptValueObj?.value || '',
      submoduleCount: submodules.length,
      submodules,
    };
  });
}

/**
 * Save Department Configuration (Bulk Update)
 */
import { locales } from '@/i18n/config';

export async function saveDepartmentConfigurationAction(rawData: unknown): Promise<ActionResult> {
  try {
    const userId = await verifySession();
    const validation = SaveDepartmentConfigurationSchema.safeParse(rawData);
    if (!validation.success)
      return {
        success: false,
        error: await tConfigMessage('saveFailed', 'Invalid data'),
        validationErrors: validation.error.flatten().fieldErrors,
      };

    const { configKeyId, updates } = validation.data;
    const keyId = Number(configKeyId);
    const currentValues = await configMasterService.getAllConfigValuesFull(keyId);
    if (!currentValues.success || !currentValues.data) {
      return {
        success: false,
        error:
          currentValues.error ||
          (await tConfigMessage('failedFetch', 'Failed to fetch current configuration values')),
      };
    }
    const valueMap = new Map(
      currentValues.data.map((v) => [`${v.departmentId || 0}_${v.moduleId || 0}`, v.configValueId])
    );

    const results = await processBatch(
      updates,
      async (u) => {
        const lookupKey = `${u.departmentId || 0}_${u.moduleId || 0}`;
        const effectiveId = u.configValueId || valueMap.get(lookupKey) || 0;

        if (effectiveId > 0) {
          return configMasterService.updateConfigValue(effectiveId, {
            configKeyId: keyId,
            departmentId: u.departmentId,
            moduleId: u.moduleId || null,
            value: u.value !== undefined ? String(u.value) : '',
            isActive: u.isEnabled,
            updatedBy: userId,
          });
        } else if (u.isEnabled) {
          return configMasterService.createConfigValue({
            configKeyId: keyId,
            departmentId: u.departmentId,
            moduleId: u.moduleId || null,
            value: u.value !== undefined ? String(u.value) : '',
            isActive: u.isEnabled,
            createdBy: userId,
          });
        }
        return { success: true };
      },
      MAX_CONCURRENT_UPDATES
    );

    const failedResults = results.filter((result) => !result.success);
    if (failedResults.length > 0) {
      logError('saveDepartmentConfigurationAction partial failure', {
        failedCount: failedResults.length,
        totalCount: results.length,
      });
      const representativeError = failedResults.find((r) => r.error)?.error;
      const defaultMsg = `Failed to save ${failedResults.length} of ${results.length} configuration updates`;
      return {
        success: false,
        error: await localizeBackendMessage(representativeError, 'saveFailed', defaultMsg),
      };
    }

    for (const locale of locales) {
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
    }
    return { success: true, message: await tConfigMessage('configSaved', 'Saved successfully') };
  } catch (err) {
    logError('saveDepartmentConfigurationAction failed', {
      error: err instanceof Error ? err : undefined,
    });
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: await localizeBackendMessage(errMsg, 'saveFailed', 'Failed to save') };
  }
}
