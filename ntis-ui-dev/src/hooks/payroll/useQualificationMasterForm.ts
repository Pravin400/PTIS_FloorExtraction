'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { QualificationMasterItem, QualificationMasterFormData } from '@/types/payroll/MasterModule';
import { createQualificationMasterSchemas } from '@/lib/validations/payroll/qualificationMaster.schema';
import { useTransliteration } from './useTransliteration';

const EMPTY_FORM: QualificationMasterFormData = {
  qualificationCode: '',
  qualificationName: '',
  qualificationNameRegional: '',
  sequenceNo: null,
  isActive: true,
};

export interface UseQualificationMasterFormOptions {
  isOpen: boolean;
  initialItem?: QualificationMasterItem | null;
  existingCodes?: Set<string>;
  onSave: (data: Omit<QualificationMasterItem, 'qualificationId'>) => Promise<boolean | void>;
  onClose: () => void;
}

export function useQualificationMasterForm({
  isOpen: _isOpen,
  initialItem,
  existingCodes,
  onSave,
  onClose,
}: UseQualificationMasterFormOptions) {
  const t = useTranslations('payrollQualificationMaster');

  const [form, setForm] = useState<QualificationMasterFormData>(() =>
    initialItem
      ? {
          qualificationCode: initialItem.qualificationCode,
          qualificationName: initialItem.qualificationName,
          qualificationNameRegional: initialItem.qualificationNameRegional || '',
          sequenceNo: initialItem.sequenceNo ?? null,
          isActive: initialItem.isActive,
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Partial<Record<keyof QualificationMasterFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Centralized setter that clears field error automatically
  const setField = <K extends keyof QualificationMasterFormData>(
    key: K,
    value: QualificationMasterFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  // Transliteration integration for regional/Marathi name
  const { scheduleAutoTransliterate, handleBlurTransliterate } = useTransliteration(
    'mr',
    form.qualificationNameRegional,
    (converted) => {
      setField('qualificationNameRegional', converted);
    }
  );

  const qualKeyMap: Record<string, string> = {
    codeRequired: 'form.validation.qualificationCodeRequired',
    codeMaxLength: 'form.validation.qualificationCodeMaxLength',
    codeFormat: 'form.validation.qualificationCodeFormat',
    nameRequired: 'form.validation.qualificationNameRequired',
    nameMinLength: 'form.validation.qualificationNameMinLength',
    nameMaxLength: 'form.validation.qualificationNameMaxLength',
    nameFormat: 'form.validation.qualificationNameFormat',
    nameRegionalRequired: 'form.validation.qualificationNameRegionalRequired',
    nameRegionalMinLength: 'form.validation.qualificationNameRegionalMinLength',
    nameRegionalMaxLength: 'form.validation.qualificationNameRegionalMaxLength',
    nameRegionalFormat: 'form.validation.qualificationNameRegionalFormat',
    nameMarathiRequired: 'form.validation.qualificationNameMarathiRequired',
    nameMarathiMinLength: 'form.validation.qualificationNameMarathiMinLength',
    nameMarathiMaxLength: 'form.validation.qualificationNameMarathiMaxLength',
    nameMarathiFormat: 'form.validation.qualificationNameMarathiFormat',
    descMaxLength: 'form.validation.descriptionMaxLength',
  };

  const getValidationSchemas = () => {
    return createQualificationMasterSchemas((key) => {
      const fullPath = qualKeyMap[key] || `form.validation.${key}`;
      return t(fullPath as never) || key;
    });
  };

  const validateField = (
    field: keyof QualificationMasterFormData,
    customVal?: unknown
  ): string | undefined => {
    const schemas = getValidationSchemas();
    const val = customVal !== undefined ? customVal : form[field];
    let fieldError: string | undefined;

    if (field === 'qualificationCode') {
      const parsed = schemas.qualificationCodeSchema.safeParse(val);
      if (!parsed.success) {
        fieldError = parsed.error.issues[0]?.message;
      } else {
        const code = String(val ?? '').trim().toUpperCase();
        if (
          code &&
          existingCodes &&
          existingCodes.has(code) &&
          (!initialItem || initialItem.qualificationCode.trim().toUpperCase() !== code)
        ) {
          const uniqueMsg = t('form.validation.codeUnique' as never);
          fieldError =
            !uniqueMsg ||
            uniqueMsg === 'form.validation.codeUnique' ||
            uniqueMsg.startsWith('form.validation.')
              ? 'This Qualification Code already exists. Codes must be unique.'
              : uniqueMsg;
        }
      }
    } else if (field === 'qualificationName') {
      const parsed = schemas.qualificationNameSchema.safeParse(val);
      if (!parsed.success) {
        fieldError = parsed.error.issues[0]?.message;
      }
    } else if (field === 'qualificationNameRegional') {
      const parsed = schemas.qualificationNameRegionalSchema.safeParse(val);
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

  const handleBlur = (field: keyof QualificationMasterFormData) => {
    validateField(field);
  };

  // Zod-based validation
  const validate = (): boolean => {
    const schemas = getValidationSchemas();

    const parsed = schemas.formSchema.safeParse(form);
    const newErrors: Partial<Record<keyof QualificationMasterFormData, string>> = {};

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof QualificationMasterFormData;
        if (field && !newErrors[field]) {
          newErrors[field] = issue.message;
        }
      }
    }

    // Code uniqueness check
    const code = form.qualificationCode.trim().toUpperCase();
    if (
      existingCodes &&
      existingCodes.has(code) &&
      (!initialItem || initialItem.qualificationCode.trim().toUpperCase() !== code)
    ) {
      const uniqueMsg = t('form.validation.codeUnique' as never);
      newErrors.qualificationCode =
        !uniqueMsg ||
        uniqueMsg === 'form.validation.codeUnique' ||
        uniqueMsg.startsWith('form.validation.')
          ? 'This Qualification Code already exists. Codes must be unique.'
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
        qualificationCode: form.qualificationCode.trim().toUpperCase(),
        qualificationName: form.qualificationName.trim(),
        qualificationNameRegional: form.qualificationNameRegional.trim(),
        sequenceNo: form.sequenceNo ?? undefined,
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
