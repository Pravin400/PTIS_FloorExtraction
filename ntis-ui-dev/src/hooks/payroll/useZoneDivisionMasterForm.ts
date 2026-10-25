'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { ZoneDivisionFormData, UseZoneDivisionMasterFormOptions } from '@/types/payroll/MasterModule';
import { createZoneDivisionMasterSchemas } from '@/lib/validations/payroll/zoneDivisionMaster.schema';
import { useTransliteration } from './useTransliteration';

export type { UseZoneDivisionMasterFormOptions };

const EMPTY_FORM: ZoneDivisionFormData = {
  zoneDivisionCode: '', zoneDivisionName: '', zoneDivisionNameRegional: '', address: '', isActive: true,
};

const KEY_MAP: Record<string, string> = {
  codeRequired: 'drawer.validation.officeCodeRequired',
  codeMinLength: 'drawer.validation.officeCodeMinLength',
  codeMaxLength: 'drawer.validation.officeCodeMaxLength',
  codeFormat: 'drawer.validation.officeCodeFormat',
  nameRequired: 'drawer.validation.officeNameRequired',
  nameMinLength: 'drawer.validation.officeNameMinLength',
  nameMaxLength: 'drawer.validation.officeNameMaxLength',
  nameFormat: 'drawer.validation.officeNameFormat',
  nameRegionalRequired: 'drawer.validation.officeNameRegionalRequired',
  nameRegionalMinLength: 'drawer.validation.officeNameRegionalMinLength',
  nameRegionalMaxLength: 'drawer.validation.officeNameRegionalMaxLength',
  nameRegionalFormat: 'drawer.validation.officeNameRegionalFormat',
  addressRequired: 'drawer.validation.addressRequired',
  addressMinLength: 'drawer.validation.addressMinLength',
  addressMaxLength: 'drawer.validation.addressMaxLength',
};

export function useZoneDivisionMasterForm({
  isOpen,
  initialItem,
  existingCodes,
  existingItems,
  onSave,
  onClose,
}: UseZoneDivisionMasterFormOptions) {
  const t = useTranslations('payrollZoneDivisionMaster');
  const tDrawer = useTranslations('payrollZoneDivisionMaster.drawer');

  const [form, setForm] = useState<ZoneDivisionFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ZoneDivisionFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ZoneDivisionFormData, boolean>>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentKey = isOpen
    ? initialItem
      ? String(initialItem.zoneDivisionId ?? initialItem.id ?? initialItem.zoneDivisionCode)
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
            zoneDivisionCode: initialItem.zoneDivisionCode,
            zoneDivisionName: initialItem.zoneDivisionName,
            zoneDivisionNameRegional: initialItem.zoneDivisionNameRegional ?? '',
            address: initialItem.address,
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
            zoneDivisionCode: initialItem.zoneDivisionCode,
            zoneDivisionName: initialItem.zoneDivisionName,
            zoneDivisionNameRegional: initialItem.zoneDivisionNameRegional ?? '',
            address: initialItem.address,
            isActive: initialItem.isActive,
          }
        : EMPTY_FORM
    );
  }, [initialItem]);

  const setField = <K extends keyof ZoneDivisionFormData>(key: K, value: ZoneDivisionFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validateFormState = useCallback(
    (formData: ZoneDivisionFormData = form): Partial<Record<keyof ZoneDivisionFormData, string>> => {
      const schemas = createZoneDivisionMasterSchemas((key) => {
        const mappedKey = KEY_MAP[key];
        return mappedKey ? t(mappedKey as never) || key : key;
      });

      const parsed = schemas.formSchema.safeParse(formData);
      const newErrors: Partial<Record<keyof ZoneDivisionFormData, string>> = {};

      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const field = issue.path[0] as keyof ZoneDivisionFormData;
          if (field && !newErrors[field]) newErrors[field] = issue.message;
        }
      }

      const code = formData.zoneDivisionCode.trim().toUpperCase();
      const name = formData.zoneDivisionName.trim().toLowerCase();

      if (existingCodes?.has(code) && (!initialItem || initialItem.zoneDivisionCode.trim().toUpperCase() !== code)) {
        newErrors.zoneDivisionCode = t('drawer.validation.codeUnique');
      }

      if (existingItems && existingItems.length > 0 && code && name) {
        const isDuplicate = existingItems.some(
          (item) =>
            item.zoneDivisionCode.toUpperCase() === code &&
            item.zoneDivisionName.trim().toLowerCase() === name &&
            item.zoneDivisionId !== initialItem?.zoneDivisionId
        );
        if (isDuplicate) {
          newErrors.zoneDivisionName = t('drawer.validation.officeNameDuplicate');
        }
      }

      return newErrors;
    },
    [form, t, existingCodes, existingItems, initialItem]
  );

  const showError = useCallback(
    (field: keyof ZoneDivisionFormData) => Boolean((submittedOnce || touched[field]) && errors[field]),
    [submittedOnce, touched, errors]
  );

  const { scheduleAutoTransliterate, handleBlurTransliterate } = useTransliteration(
    'mr',
    form.zoneDivisionNameRegional,
    (converted) => setField('zoneDivisionNameRegional', converted)
  );

  const handleCodeChange = (raw: string) => setField('zoneDivisionCode', raw.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase());
  const handleNameChange = (raw: string) => {
    setField('zoneDivisionName', raw);
    scheduleAutoTransliterate(raw);
  };
  const handleRegionalNameChange = (raw: string) => setField('zoneDivisionNameRegional', raw);
  const handleAddressChange = (raw: string) => setField('address', raw);
  const handleStatusToggle = (val: boolean) => setField('isActive', val);

  const handleBlur = (field: keyof ZoneDivisionFormData) => {
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
        zoneDivisionCode: form.zoneDivisionCode.trim().toUpperCase(),
        zoneDivisionName: form.zoneDivisionName.trim(),
        zoneDivisionNameRegional: form.zoneDivisionNameRegional.trim() || undefined,
        address: form.address.trim(),
        isActive: form.isActive,
      });
      if (result) onClose();
    } catch (error) {
      console.error('Failed to submit zone division form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form, errors, touched, submittedOnce, isSubmitting,
    isEdit: Boolean(initialItem), t: tDrawer, showError, setField, setErrors,
    handleBlur, handleCodeChange, handleNameChange, handleRegionalNameChange,
    handleAddressChange, handleStatusToggle, handleBlurTransliterate,
    scheduleAutoTransliterate, handleSubmit, validate, resetForm,
  };
}
