'use client';

import { useState } from 'react';
import { ModuleMaster, ModuleMasterFormData } from '@/types/moduleMaster.types';
import { ModuleMasterErrors } from '@/lib/api/configuration-settings/module-master/module-master.validator';

const INITIAL_FORM_DATA: ModuleMasterFormData = {
  departmentId: 0,
  moduleCode: '',
  moduleName: '',
  moduleNameLocal: '',
  moduleIcon: '',
  moduleLabel: '',
  moduleDescription: '',
  isActive: true,
};

export function useModuleFormState(initialData?: ModuleMaster) {
  const [formData, setFormData] = useState<ModuleMasterFormData>(
    initialData
      ? {
          departmentId: initialData.departmentId ?? 0,
          moduleCode: initialData.moduleCode ?? '',
          moduleName: initialData.moduleName ?? '',
          moduleNameLocal: initialData.moduleNameLocal ?? '',
          moduleIcon: initialData.moduleIcon ?? '',
          moduleLabel: initialData.moduleLabel ?? '',
          moduleDescription: initialData.moduleDescription ?? '',
          isActive: initialData.isActive,
        }
      : INITIAL_FORM_DATA
  );

  const [errors, setErrors] = useState<ModuleMasterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(true);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    open,
    setOpen,
  };
}
