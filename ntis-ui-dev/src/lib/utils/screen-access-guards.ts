import type {
  ScreenMasterData,
  ScreenGroupMasterData,
  DepartmentMasterData,
  ModuleMasterData,
} from '@/types/screen-access.types';

/**
 * Type guard for ScreenMasterData
 */
export function isScreenMasterData(data: unknown): data is Partial<ScreenMasterData> {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('screenMasterId' in data || 'screenId' in data) &&
    'screenName' in data
  );
}

/**
 * Type guard for ScreenGroupMasterData
 */
export function isScreenGroupMasterData(data: unknown): data is Partial<ScreenGroupMasterData> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'screenGroupId' in data &&
    'screenGroupName' in data
  );
}

/**
 * Type guard for DepartmentMasterData
 */
export function isDepartmentMasterData(data: unknown): data is Partial<DepartmentMasterData> {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('departmentMasterId' in data || 'departmentId' in data) &&
    'departmentName' in data
  );
}

/**
 * Type guard for ModuleMasterData
 */
export function isModuleMasterData(data: unknown): data is Partial<ModuleMasterData> {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('moduleMasterId' in data || 'moduleId' in data) &&
    'moduleName' in data
  );
}
