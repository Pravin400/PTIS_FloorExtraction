'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DesignationMasterItem, DesignationMasterFormData } from '@/types/payroll/MasterModule';
import { createDesignationMasterSchemas } from '@/lib/validations/payroll/designationMaster.schema';
import { useTransliteration } from './useTransliteration';

const EMPTY_FORM: DesignationMasterFormData = {
  designationCode: '',
  designationName: '',
  designationNameMarathi: '',
  departmentId: null,
  description: '',
  isActive: true,
};

export interface UseDesignationMasterFormOptions {
  isOpen: boolean;
  initialItem?: DesignationMasterItem | null;
  existingCodes?: string[];
  onSave: (data: Omit<DesignationMasterItem, 'designationId' | 'id'>) => Promise<boolean | void>;
  onClose: () => void;
}

export function useDesignationMasterForm({
  isOpen: _isOpen,
  initialItem,
  existingCodes = [],
  onSave,
  onClose,
}: UseDesignationMasterFormOptions) {
  const t = useTranslations('payrollDesignationMaster');

  const [form, setForm] = useState<DesignationMasterFormData>(() =>
    initialItem
      ? {
          designationCode: initialItem.designationCode,
          designationName: initialItem.designationName,
          designationNameMarathi: initialItem.designationNameMarathi,
          departmentId: initialItem.departmentId ?? null,
          description: initialItem.description ?? '',
          isActive: initialItem.isActive,
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Partial<Record<keyof DesignationMasterFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof DesignationMasterFormData>(key: K, value: DesignationMasterFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const { scheduleAutoTransliterate, handleBlurTransliterate } = useTransliteration(
    'mr',
    form.designationNameMarathi,
    (converted) => {
      setField('designationNameMarathi', converted);
    }
  );

  const designationKeyMap: Record<string, string> = {
    codeRequired: 'form.validation.designationCodeRequired',
    codeMaxLength: 'form.validation.designationCodeMaxLength',
    codeFormat: 'form.validation.designationCodeFormat',
    nameRequired: 'form.validation.designationNameRequired',
    nameMinLength: 'form.validation.designationNameMinLength',
    nameMaxLength: 'form.validation.designationNameMaxLength',
    nameFormat: 'form.validation.designationNameFormat',
    nameMarathiRequired: 'form.validation.designationLocalRequired',
    nameMarathiMinLength: 'form.validation.designationLocalMinLength',
    nameMarathiMaxLength: 'form.validation.designationLocalMaxLength',
    nameMarathiFormat: 'form.validation.designationLocalFormat',
    descMaxLength: 'form.validation.descriptionMaxLength',
  };

  const getValidationSchemas = () => {
    return createDesignationMasterSchemas((key) => {
      const fullPath = designationKeyMap[key] || `form.validation.${key}`;
      return t(fullPath as never) || key;
    });
  };

  const validateField = (
    field: keyof DesignationMasterFormData,
    customVal?: unknown
  ): string | undefined => {
    const schemas = getValidationSchemas();
    const val = customVal !== undefined ? customVal : form[field];
    let fieldError: string | undefined;

    if (field === 'designationCode') {
      const parsed = schemas.designationCodeSchema.safeParse(val);
      if (!parsed.success) {
        fieldError = parsed.error.issues[0]?.message;
      } else {
        const code = String(val ?? '').trim().toUpperCase();
        if (
          existingCodes &&
          existingCodes.some(
            (c) => c.toUpperCase() === code && c.toUpperCase() !== initialItem?.designationCode.toUpperCase()
          )
        ) {
          const uniqueMsg = t('form.validation.codeUnique' as never);
          fieldError =
            !uniqueMsg || uniqueMsg === 'form.validation.codeUnique' || uniqueMsg.startsWith('form.validation.')
              ? 'This Designation Code already exists. Codes must be unique.'
              : uniqueMsg;
        }
      }
    } else if (field === 'designationName') {
      const parsed = schemas.designationNameSchema.safeParse(val);
      if (!parsed.success) {
        fieldError = parsed.error.issues[0]?.message;
      }
    } else if (field === 'designationNameMarathi') {
      const parsed = schemas.designationNameMarathiSchema.safeParse(val);
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

  const handleBlur = (field: keyof DesignationMasterFormData) => {
    validateField(field);
  };

  const validate = (): boolean => {
    const schemas = getValidationSchemas();

    const parsed = schemas.formSchema.safeParse(form);
    const newErrors: Partial<Record<keyof DesignationMasterFormData, string>> = {};

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof DesignationMasterFormData;
        if (field && !newErrors[field]) {
          newErrors[field] = issue.message;
        }
      }
    }

    // Code uniqueness check
    const code = form.designationCode.trim().toUpperCase();
    if (
      existingCodes &&
      existingCodes.some(
        (c) => c.toUpperCase() === code && c.toUpperCase() !== initialItem?.designationCode.toUpperCase()
      )
    ) {
      const uniqueMsg = t('form.validation.codeUnique' as never);
      newErrors.designationCode =
        !uniqueMsg || uniqueMsg === 'form.validation.codeUnique' || uniqueMsg.startsWith('form.validation.')
          ? 'This Designation Code already exists. Codes must be unique.'
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
      const payload: Omit<DesignationMasterItem, 'designationId' | 'id'> = {
        designationCode: form.designationCode.trim().toUpperCase(),
        designationName: form.designationName.trim(),
        designationNameMarathi: form.designationNameMarathi.trim(),
        description: form.description?.trim() || undefined,
        isActive: form.isActive,
      };
      if (form.departmentId) {
        payload.departmentId = form.departmentId;
      }
      const result = await onSave(payload);
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
