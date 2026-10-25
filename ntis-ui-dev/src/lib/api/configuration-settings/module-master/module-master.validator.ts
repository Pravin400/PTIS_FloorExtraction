import { ModuleMaster, ModuleMasterFormData } from '@/types/moduleMaster.types';
import { ApiError } from '@/lib/utils/api';
import { parseBoolean } from '@/lib/utils/type-guards';
import * as CONST from './module-master.constants';

export type ModuleMasterValidationCode =
  | 'departmentIdRequired'
  | 'moduleCodeRequired'
  | 'moduleCodeLength'
  | 'moduleCodeFormat'
  | 'moduleNameRequired'
  | 'moduleNameLength'
  | 'moduleNameLocalLength'
  | 'moduleIconLength'
  | 'moduleLabelLength'
  | 'moduleDescriptionLength'
  | 'moduleCodeExists'
  | 'moduleNameExists';

export type ModuleMasterErrors = Partial<
  Record<keyof ModuleMasterFormData, ModuleMasterValidationCode>
>;

export function validateModuleMaster(data: ModuleMasterFormData): ModuleMasterErrors {
  const errors: ModuleMasterErrors = {};

  const departmentId = Number(data.departmentId);
  if (!departmentId || isNaN(departmentId) || departmentId <= 0) {
    errors.departmentId = 'departmentIdRequired';
  }

  const moduleCode = String(data.moduleCode ?? '').trim();
  if (!moduleCode) {
    errors.moduleCode = 'moduleCodeRequired';
  } else if (moduleCode.length > CONST.MODULE_CODE_MAX) {
    errors.moduleCode = 'moduleCodeLength';
  } else if (!/^[A-Za-z0-9_]+$/.test(moduleCode)) {
    errors.moduleCode = 'moduleCodeFormat';
  }

  const moduleName = String(data.moduleName ?? '').trim();
  if (!moduleName) {
    errors.moduleName = 'moduleNameRequired';
  } else if (moduleName.length > CONST.MODULE_NAME_MAX) {
    errors.moduleName = 'moduleNameLength';
  }

  const moduleNameLocal = String(data.moduleNameLocal ?? '').trim();
  if (moduleNameLocal.length > CONST.MODULE_NAME_LOCAL_MAX) {
    errors.moduleNameLocal = 'moduleNameLocalLength';
  }

  const moduleIcon = String(data.moduleIcon ?? '').trim();
  if (moduleIcon.length > CONST.MODULE_ICON_MAX) {
    errors.moduleIcon = 'moduleIconLength';
  }

  const moduleLabel = String(data.moduleLabel ?? '').trim();
  if (moduleLabel.length > CONST.MODULE_LABEL_MAX) {
    errors.moduleLabel = 'moduleLabelLength';
  }

  const moduleDescription = String(data.moduleDescription ?? '').trim();
  if (moduleDescription.length > CONST.MODULE_DESCRIPTION_MAX) {
    errors.moduleDescription = 'moduleDescriptionLength';
  }

  return errors;
}

export function validateModuleMasterDto(
  data: Partial<ModuleMaster | ModuleMasterFormData>
): ModuleMasterValidationCode | null {
  const normalized = normalizeModuleData(data);
  const errors = validateModuleMaster(normalized);

  const priorityOrder: (keyof ModuleMasterFormData)[] = [
    'departmentId',
    'moduleCode',
    'moduleName',
    'moduleNameLocal',
    'moduleIcon',
    'moduleLabel',
    'moduleDescription',
  ];

  for (const field of priorityOrder) {
    if (errors[field]) return errors[field] as ModuleMasterValidationCode;
  }

  return null;
}

export function normalizeModuleData(
  data: Partial<ModuleMaster | ModuleMasterFormData>
): ModuleMasterFormData {
  let moduleCode = (data.moduleCode ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '');
  if (moduleCode.length > CONST.MODULE_CODE_MAX) {
    moduleCode = moduleCode.slice(0, CONST.MODULE_CODE_MAX);
  }

  let moduleName = (data.moduleName ?? '').replace(/[^\p{L}\p{M}\s]/gu, '').trim();
  if (moduleName.length > CONST.MODULE_NAME_MAX) {
    moduleName = moduleName.slice(0, CONST.MODULE_NAME_MAX);
  }

  let moduleNameLocal = (data.moduleNameLocal ?? '').replace(/[^\p{L}\p{M}\s_-]/gu, '').trim();
  if (moduleNameLocal.length > CONST.MODULE_NAME_LOCAL_MAX) {
    moduleNameLocal = moduleNameLocal.slice(0, CONST.MODULE_NAME_LOCAL_MAX);
  }

  let moduleIcon = (data.moduleIcon ?? '').trim();
  if (moduleIcon.length > CONST.MODULE_ICON_MAX) {
    moduleIcon = moduleIcon.slice(0, CONST.MODULE_ICON_MAX);
  }

  let moduleLabel = (data.moduleLabel ?? '').trim();
  if (moduleLabel.length > CONST.MODULE_LABEL_MAX) {
    moduleLabel = moduleLabel.slice(0, CONST.MODULE_LABEL_MAX);
  }

  let moduleDescription = (data.moduleDescription ?? '').trim();
  if (moduleDescription.length > CONST.MODULE_DESCRIPTION_MAX) {
    moduleDescription = moduleDescription.slice(0, CONST.MODULE_DESCRIPTION_MAX);
  }

  return {
    departmentId: Number(data.departmentId ?? 0),
    moduleCode,
    moduleName,
    moduleNameLocal,
    moduleIcon,
    moduleLabel,
    moduleDescription,
    isActive: parseBoolean(data.isActive ?? true),
  };
}

export function assertModuleFormData(data: ModuleMasterFormData): void {
  const error = validateModuleMasterDto(data);
  if (error) {
    throw new ApiError(400, `Validation failed: ${error}`, 'Module form validation');
  }
}

export function assertModuleDto(data: Partial<ModuleMaster>): void {
  assertModuleFormData(normalizeModuleData(data));
}

export function checkBackendResponseErrors(
  responseData: Record<string, unknown> | null,
  _operation: string
): void {
  if (!responseData || typeof responseData !== 'object') return;

  const { message: rawMessage, error: rawError } = responseData as {
    message?: unknown;
    error?: unknown;
  };
  const messageValue = rawMessage ?? rawError;

  if (typeof messageValue === 'string' && messageValue) {
    const message = messageValue;
    const lowerMsg = message.toLowerCase();

    const isErrorMessage =
      lowerMsg.includes('error') ||
      lowerMsg.includes('failed') ||
      lowerMsg.includes('invalid') ||
      lowerMsg.includes('duplicate') ||
      lowerMsg.includes('already exists');

    const isSuccessMessage =
      lowerMsg.includes('success') || lowerMsg.includes('created') || lowerMsg.includes('updated');

    if (isErrorMessage && !isSuccessMessage) {
      const isDuplicate = lowerMsg.includes('already exists') || lowerMsg.includes('duplicate');
      throw new ApiError(
        isDuplicate ? 409 : 400,
        message,
        `checkBackendResponseErrors: ${_operation}`
      );
    }
  }
}

export const getValidationCount = (errorMsg?: string) => {
  if (!errorMsg) return 0;
  const errorMapping: Record<string, number> = {
    moduleCode: CONST.MODULE_CODE_MAX,
    moduleName: CONST.MODULE_NAME_MAX,
    moduleNameLocal: CONST.MODULE_NAME_LOCAL_MAX,
    moduleIcon: CONST.MODULE_ICON_MAX,
    moduleLabel: CONST.MODULE_LABEL_MAX,
    moduleDescription: CONST.MODULE_DESCRIPTION_MAX,
  };

  const matchedKey = Object.keys(errorMapping)
    .sort((a, b) => b.length - a.length)
    .find((k) => errorMsg.includes(k));

  return matchedKey ? errorMapping[matchedKey] : 0;
};

export interface DuplicateCheckParams {
  moduleCode?: string;
  moduleName?: string;
  existingModules: ModuleMaster[];
  isEdit: boolean;
  moduleId: number | null;
}

export function checkModuleDuplicates(params: DuplicateCheckParams): {
  codeExists: boolean;
  nameExists: boolean;
} {
  const { moduleCode, moduleName, existingModules, isEdit, moduleId } = params;

  let codeExists = false;
  if (moduleCode) {
    codeExists = existingModules.some(
      (m) =>
        (!isEdit || m.moduleId !== moduleId) &&
        m.moduleCode?.trim().toUpperCase() === moduleCode.trim().toUpperCase()
    );
  }

  let nameExists = false;
  if (moduleName) {
    nameExists = existingModules.some(
      (m) =>
        (!isEdit || m.moduleId !== moduleId) &&
        m.moduleName?.trim().toLowerCase() === moduleName.trim().toLowerCase()
    );
  }

  return { codeExists, nameExists };
}
