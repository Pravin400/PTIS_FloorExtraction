'use client';

import React, { useCallback } from 'react';
import type { ModuleMaster, ModuleMasterFormData } from '@/types/moduleMaster.types';
import {
  ModuleMasterErrors,
  validateModuleMaster,
  normalizeModuleData,
  checkModuleDuplicates,
} from '@/lib/api/configuration-settings/module-master/module-master.validator';

import * as CONST from '@/lib/api/configuration-settings/module-master/module-master.constants';

interface UseModuleFormHandlersProps {
  formData: ModuleMasterFormData;
  setFormData: React.Dispatch<React.SetStateAction<ModuleMasterFormData>>;
  setErrors: React.Dispatch<React.SetStateAction<ModuleMasterErrors>>;
  existingModules: ModuleMaster[];
  isEdit: boolean;
  moduleId: number | null;
}

function validateField(
  formData: ModuleMasterFormData,
  existingModules: ModuleMaster[],
  isEdit: boolean,
  moduleId: number | null
): ModuleMasterErrors {
  const normalizedData = normalizeModuleData(formData);
  const validationErrors = validateModuleMaster(normalizedData);

  const { codeExists, nameExists } = checkModuleDuplicates({
    moduleCode: normalizedData.moduleCode,
    moduleName: normalizedData.moduleName,
    existingModules,
    isEdit,
    moduleId,
  });

  if (codeExists) {
    validationErrors.moduleCode = 'moduleCodeExists';
  }
  if (nameExists) {
    validationErrors.moduleName = 'moduleNameExists';
  }

  return validationErrors;
}

export function useModuleFormHandlers({
  formData,
  setFormData,
  setErrors,
  existingModules,
  isEdit,
  moduleId,
}: UseModuleFormHandlersProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      const { name } = e.target;
      let { value } = e.target;

      if (name === 'moduleCode') {
        // Module code allows alphanumeric characters and underscores (e.g., MOD_ADMIN)
        value = value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
        if (value.length > CONST.MODULE_CODE_MAX) {
          value = value.slice(0, CONST.MODULE_CODE_MAX);
        }
      } else if (name === 'moduleName') {
        value = value.replace(/[^\p{L}\p{M}\s]/gu, '');
        if (value.length > CONST.MODULE_NAME_MAX) {
          value = value.slice(0, CONST.MODULE_NAME_MAX);
        }
      } else if (name === 'moduleNameLocal') {
        value = value.replace(/[^\p{L}\p{M}\s_-]/gu, '');
        if (value.length > CONST.MODULE_NAME_LOCAL_MAX) {
          value = value.slice(0, CONST.MODULE_NAME_LOCAL_MAX);
        }
      } else if (name === 'moduleIcon') {
        if (value.length > CONST.MODULE_ICON_MAX) {
          value = value.slice(0, CONST.MODULE_ICON_MAX);
        }
      } else if (name === 'moduleLabel') {
        if (value.length > CONST.MODULE_LABEL_MAX) {
          value = value.slice(0, CONST.MODULE_LABEL_MAX);
        }
      } else if (name === 'moduleDescription') {
        if (value.length > CONST.MODULE_DESCRIPTION_MAX) {
          value = value.slice(0, CONST.MODULE_DESCRIPTION_MAX);
        }
      }

      setFormData((p) => ({
        ...p,
        [name]: value,
      }));

      // Instant inline validation check
      const updatedFormData = {
        ...formData,
        [name]: value,
      };

      setErrors(validateField(updatedFormData, existingModules, isEdit, moduleId));
    },
    [setFormData, setErrors, formData, existingModules, isEdit, moduleId]
  );

  const handleSelectChange = useCallback(
    (_e: React.ChangeEvent<HTMLSelectElement>, value: string): void => {
      setFormData((p) => ({
        ...p,
        departmentId: Number(value),
      }));
      setErrors((p) => ({
        ...p,
        departmentId: undefined,
      }));
    },
    [setFormData, setErrors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
      const { name, value } = e.target;

      const updatedFormData = {
        ...formData,
        [name]: value,
      };

      const normalizedData = normalizeModuleData(updatedFormData);

      setFormData(normalizedData);
      setErrors(validateField(normalizedData, existingModules, isEdit, moduleId));
    },
    [formData, setFormData, setErrors, existingModules, isEdit, moduleId]
  );

  const handleToggleStatus = useCallback((): void => {
    setFormData((p) => ({ ...p, isActive: !p.isActive }));
  }, [setFormData]);

  return {
    handleChange,
    handleSelectChange,
    handleBlur,
    handleToggleStatus,
  };
}
