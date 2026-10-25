'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { EmpClassFormData, UseEmpClassMasterFormOptions } from '@/types/payroll/MasterModule';
import { createEmpClassMasterSchemas } from '@/lib/validations/payroll/empClassMaster.schema';
import { useTransliteration } from './useTransliteration';

export type { UseEmpClassMasterFormOptions };

const EMPTY_FORM: EmpClassFormData = {
  classCode: '', className: '', classNameMarathi: '', description: '', isActive: true,
};

const KEY_MAP: Record<string, string> = {
  codeRequired: 'drawer.validation.classCodeRequired',
  codeMinLength: 'drawer.validation.classCodeMinLength',
  codeMaxLength: 'drawer.validation.classCodeMaxLength',
  codeFormat: 'drawer.validation.classCodeFormat',
  nameRequired: 'drawer.validation.classNameRequired',
  nameMaxLength: 'drawer.validation.classNameMaxLength',
  nameMarathiRequired: 'drawer.validation.classNameMarathiRequired',
  nameMarathiMaxLength: 'drawer.validation.classNameMarathiMaxLength',
  descMaxLength: 'drawer.validation.descriptionMaxLength',
};

export function useEmpClassMasterForm({
  isOpen,
  initialItem,
  existingCodes,
  existingItems,
  onSave,
  onClose,
}: UseEmpClassMasterFormOptions) {
  const t = useTranslations('payrollEmployeeClassMaster');
  const tDrawer = useTranslations('payrollEmployeeClassMaster.drawer');

  const [form, setForm] = useState<EmpClassFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof EmpClassFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof EmpClassFormData, boolean>>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentKey = isOpen
    ? initialItem
      ? String(initialItem.employeeClassId ?? initialItem.id ?? initialItem.classCode)
      : '__new__'
    : null;
  const [prevKey, setPrevKey] = useState<string | null>(null);

  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setIsSubmitting(false);
    setSubmittedOnce(false);
    setTouched({});
    setErrors({});
    setForm(
      initialItem
        ? {
            classCode: initialItem.classCode,
            className: initialItem.className,
            classNameMarathi: initialItem.classNameMarathi ?? '',
            description: initialItem.description ?? '',
            isActive: initialItem.isActive,
          }
        : EMPTY_FORM
    );
  }

  const resetForm = useCallback(() => {
    setIsSubmitting(false);
    setSubmittedOnce(false);
    setTouched({});
    setErrors({});
    setForm(
      initialItem
        ? {
            classCode: initialItem.classCode,
            className: initialItem.className,
            classNameMarathi: initialItem.classNameMarathi ?? '',
            description: initialItem.description ?? '',
            isActive: initialItem.isActive,
          }
        : EMPTY_FORM
    );
  }, [initialItem]);

  const setField = <K extends keyof EmpClassFormData>(key: K, value: EmpClassFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validateFormState = useCallback(
    (formData: EmpClassFormData = form): Partial<Record<keyof EmpClassFormData, string>> => {
      const schemas = createEmpClassMasterSchemas((key) => {
        const mappedKey = KEY_MAP[key];
        return mappedKey ? t(mappedKey as never) || key : key;
      });

      const parsed = schemas.formSchema.safeParse(formData);
      const newErrors: Partial<Record<keyof EmpClassFormData, string>> = {};

      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const field = issue.path[0] as keyof EmpClassFormData;
          if (field && !newErrors[field]) newErrors[field] = issue.message;
        }
      }

      const code = formData.classCode.trim().toUpperCase();
      const name = formData.className.trim().toLowerCase();

      if (existingCodes?.has(code) && (!initialItem || initialItem.classCode.trim().toUpperCase() !== code)) {
        newErrors.classCode = t('drawer.validation.codeUnique');
      }

      if (existingItems && existingItems.length > 0 && code && name) {
        const isDuplicate = existingItems.some(
          (item) => item.classCode.toUpperCase() === code && item.className.trim().toLowerCase() === name && item.employeeClassId !== initialItem?.employeeClassId
        );
        if (isDuplicate) {
          newErrors.className = t('drawer.validation.classNameDuplicate');
        }
      }

      return newErrors;
    },
    [form, t, existingCodes, existingItems, initialItem]
  );

  const showError = useCallback(
    (field: keyof EmpClassFormData) => Boolean((submittedOnce || touched[field]) && errors[field]),
    [submittedOnce, touched, errors]
  );

  const { scheduleAutoTransliterate, handleBlurTransliterate } = useTransliteration(
    'mr',
    form.classNameMarathi,
    (converted) => setField('classNameMarathi', converted)
  );

  const handleCodeChange = (raw: string) => setField('classCode', raw.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase());
  const handleNameChange = (raw: string) => {
    setField('className', raw);
    scheduleAutoTransliterate(raw);
  };
  const handleMarathiNameChange = (raw: string) => setField('classNameMarathi', raw);
  const handleDescriptionChange = (raw: string) => setField('description', raw);
  const handleStatusToggle = (val: boolean) => setField('isActive', val);

  const handleBlur = (field: keyof EmpClassFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldErrors = validateFormState(form);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const validate = (): boolean => {
    const newErrors = validateFormState(form);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmittedOnce(true);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await onSave({
        classCode: form.classCode.trim().toUpperCase(),
        className: form.className.trim(),
        classNameMarathi: form.classNameMarathi.trim() || undefined,
        description: form.description?.trim() || undefined,
        isActive: form.isActive,
      });
      if (result) onClose();
    } catch (error) {
      console.error('Failed to submit employee class form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form, errors, touched, submittedOnce, isSubmitting,
    isEdit: Boolean(initialItem), t: tDrawer, showError, setField, setErrors,
    handleBlur, handleCodeChange, handleNameChange, handleMarathiNameChange,
    handleDescriptionChange, handleStatusToggle, handleBlurTransliterate,
    scheduleAutoTransliterate, handleSubmit, validate, resetForm,
  };
}
