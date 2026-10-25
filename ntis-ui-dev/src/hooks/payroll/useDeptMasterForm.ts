'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeptMasterItem, DeptMasterFormData } from '@/types/payroll/MasterModule';
import { createDeptMasterSchemas } from '@/lib/validations/payroll/deptMaster.schema';
import { useTransliteration } from './useTransliteration';

const EMPTY_FORM: DeptMasterFormData = {
  departmentCode: '',
  departmentName: '',
  departmentNameMarathi: '',
  description: '',
  isActive: true,
};

export interface UseDeptMasterFormOptions {
  isOpen: boolean;
  initialItem?: DeptMasterItem | null;
  existingCodes?: Set<string>;
  onSave: (data: Omit<DeptMasterItem, 'departmentId'>) => Promise<boolean | void>;
  onClose: () => void;
}

export function useDeptMasterForm({
  isOpen: _isOpen,
  initialItem,
  existingCodes,
  onSave,
  onClose,
}: UseDeptMasterFormOptions) {
  const t = useTranslations('payrollDepartmentMaster');

  const [form, setForm] = useState<DeptMasterFormData>(() =>
    initialItem
      ? {
          departmentCode: initialItem.departmentCode,
          departmentName: initialItem.departmentName,
          departmentNameMarathi: initialItem.departmentNameMarathi,
          description: initialItem.description ?? '',
          isActive: initialItem.isActive,
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Partial<Record<keyof DeptMasterFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Centralized setter that clears field error automatically
  const setField = <K extends keyof DeptMasterFormData>(key: K, value: DeptMasterFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  // Transliteration integration for Marathi name
  const { scheduleAutoTransliterate, handleBlurTransliterate } = useTransliteration(
    'mr',
    form.departmentNameMarathi,
    (converted) => {
      setField('departmentNameMarathi', converted);
    }
  );

  const deptKeyMap: Record<string, string> = {
    codeRequired: 'form.validation.departmentCodeRequired',
    codeMaxLength: 'form.validation.departmentCodeMaxLength',
    codeFormat: 'form.validation.departmentCodeFormat',
    nameRequired: 'form.validation.departmentNameRequired',
    nameMinLength: 'form.validation.departmentNameMinLength',
    nameMaxLength: 'form.validation.departmentNameMaxLength',
    nameFormat: 'form.validation.departmentNameFormat',
    nameMarathiRequired: 'form.validation.departmentNameMarathiRequired',
    nameMarathiMinLength: 'form.validation.departmentNameMarathiMinLength',
    nameMarathiMaxLength: 'form.validation.departmentNameMarathiMaxLength',
    nameMarathiFormat: 'form.validation.departmentNameMarathiFormat',
    descMaxLength: 'form.validation.descriptionMaxLength',
  };

  const getValidationSchemas = () => {
    return createDeptMasterSchemas((key) => {
      const fullPath = deptKeyMap[key] || `form.validation.${key}`;
      return t(fullPath as never) || key;
    });
  };

  const validateField = (
    field: keyof DeptMasterFormData,
    customVal?: unknown
  ): string | undefined => {
    const schemas = getValidationSchemas();
    const val = customVal !== undefined ? customVal : form[field];
    let fieldError: string | undefined;

    if (field === 'departmentCode') {
      const parsed = schemas.departmentCodeSchema.safeParse(val);
      if (!parsed.success) {
        fieldError = parsed.error.issues[0]?.message;
      } else {
        const code = String(val ?? '').trim().toUpperCase();
        if (
          code &&
          existingCodes &&
          existingCodes.has(code) &&
          (!initialItem || initialItem.departmentCode.trim().toUpperCase() !== code)
        ) {
          const uniqueMsg = t('form.validation.codeUnique' as never);
          fieldError =
            !uniqueMsg ||
            uniqueMsg === 'form.validation.codeUnique' ||
            uniqueMsg.startsWith('form.validation.')
              ? 'This Department Code already exists. Codes must be unique.'
              : uniqueMsg;
        }
      }
    } else if (field === 'departmentName') {
      const parsed = schemas.departmentNameSchema.safeParse(val);
      if (!parsed.success) {
        fieldError = parsed.error.issues[0]?.message;
      }
    } else if (field === 'departmentNameMarathi') {
      const parsed = schemas.departmentNameMarathiSchema.safeParse(val);
      if (!parsed.success) {
        fieldError = parsed.error.issues[0]?.message;
      }
    } else if (field === 'description') {
      const parsed = schemas.descriptionSchema.safeParse(val);
      if (!parsed.success) {
        fieldError = parsed.error.issues[0]?.message;
      }
    }

    setErrors((prev) => {
      if (fieldError) {
        return { ...prev, [field]: fieldError };
      }
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });

    return fieldError;
  };

  const handleBlur = (field: keyof DeptMasterFormData) => {
    validateField(field);
  };

  // Zod-based validation
  const validate = (): boolean => {
    const schemas = getValidationSchemas();

    const parsed = schemas.formSchema.safeParse(form);
    const newErrors: Partial<Record<keyof DeptMasterFormData, string>> = {};

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof DeptMasterFormData;
        if (field && !newErrors[field]) {
          newErrors[field] = issue.message;
        }
      }
    }

    // Code uniqueness check
    const code = form.departmentCode.trim().toUpperCase();
    if (
      existingCodes &&
      existingCodes.has(code) &&
      (!initialItem || initialItem.departmentCode.trim().toUpperCase() !== code)
    ) {
      const uniqueMsg = t('form.validation.codeUnique' as never);
      newErrors.departmentCode =
        !uniqueMsg || uniqueMsg === 'form.validation.codeUnique' || uniqueMsg.startsWith('form.validation.')
          ? 'This Department Code already exists. Codes must be unique.'
          : uniqueMsg;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await onSave({
        departmentCode: form.departmentCode.trim().toUpperCase(),
        departmentName: form.departmentName.trim(),
        departmentNameMarathi: form.departmentNameMarathi.trim(),
        description: form.description?.trim() || undefined,
        isActive: form.isActive,
      });
      if (result !== false) {
        onClose();
      }
    } catch {
      // Error handled by onSave toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    errors,
    isSubmitting,
    isEdit: Boolean(initialItem),
    setField,
    scheduleAutoTransliterate,
    handleBlurTransliterate,
    handleBlur,
    validateField,
    handleSubmit,
  };
}
