'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  EmpStatusMasterItem,
  EmpStatusFormData,
  EmpStatusMasterPayload,
} from '@/types/payroll/MasterModule';
import { createEmpStatusSchema } from '@/lib/validations/payroll/empStatusMaster.schema';

const EMPTY_FORM: EmpStatusFormData = {
  employeeStatusCode: '',
  employeeStatus: '',
  employeeStatusMarathi: '',
  description: '',
  isActive: true,
};

export interface UseEmpStatusFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmpStatusMasterPayload) => Promise<boolean | void> | void;
  initialItem?: EmpStatusMasterItem | null;
  existingItems?: EmpStatusMasterItem[];
  existingCodes?: string[];
}

export function useEmpStatusForm({
  isOpen: _isOpen,
  onClose,
  onSave,
  initialItem,
  existingItems,
  existingCodes,
}: UseEmpStatusFormProps) {
  const t = useTranslations('payrollEmployeeStatusMaster');
  const tDrawer = useTranslations('payrollEmployeeStatusMaster.drawer');
  const isEdit = !!initialItem;

  const [form, setForm] = useState<EmpStatusFormData>(() =>
    initialItem
      ? {
          employeeStatusCode: initialItem.employeeStatusCode,
          employeeStatus: initialItem.employeeStatus,
          employeeStatusMarathi: initialItem.employeeStatusMarathi ?? '',
          description: initialItem.description ?? '',
          isActive: initialItem.isActive,
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Partial<Record<keyof EmpStatusFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof EmpStatusFormData>(key: K, value: EmpStatusFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleCodeChange = (raw: string) => {
    const formatted = raw
      .replace(/[^a-zA-Z_-]/g, '')
      .toUpperCase()
      .slice(0, 20);
    setField('employeeStatusCode', formatted);
  };

  const handleStatusChange = (raw: string) => {
    const formatted = raw.replace(/[0-9]/g, '').slice(0, 100);
    setField('employeeStatus', formatted);
  };

  const handleMarathiStatusChange = (raw: string) => {
    const formatted = raw.replace(/[0-9०-९]/g, '').slice(0, 100);
    setField('employeeStatusMarathi', formatted);
  };

  const handleDescriptionChange = (raw: string) => {
    setField('description', raw.slice(0, 250));
  };

  const handleStatusToggle = (val: boolean) => {
    setField('isActive', val);
  };

  const validateField = (
    field: keyof EmpStatusFormData,
    customVal?: unknown
  ): string | undefined => {
    const formData = customVal !== undefined ? { ...form, [field]: customVal } : form;
    const schema = createEmpStatusSchema({
      t: (k: string) => t(k as Parameters<typeof t>[0]),
      existingItems,
      existingCodes,
      initialItem,
    });

    const result = schema.safeParse(formData);
    let fieldError: string | undefined;

    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      if (issue) {
        fieldError = issue.message;
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

  const handleBlur = (field: keyof EmpStatusFormData) => {
    validateField(field);
  };

  const validate = (): boolean => {
    const schema = createEmpStatusSchema({
      t: (k: string) => t(k as Parameters<typeof t>[0]),
      existingItems,
      existingCodes,
      initialItem,
    });

    const result = schema.safeParse(form);
    if (!result.success) {
      const errMap: Partial<Record<keyof EmpStatusFormData, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof EmpStatusFormData;
        if (field && !errMap[field]) {
          errMap[field] = issue.message;
        }
      }
      setErrors(errMap);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await onSave({
        employeeStatusCode: form.employeeStatusCode.trim().toUpperCase(),
        employeeStatus: form.employeeStatus.trim(),
        employeeStatusMarathi: form.employeeStatusMarathi.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      });
      if (result !== false) {
        onClose();
      }
    } catch {
      // Error handled by onSave
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    errors,
    setErrors,
    isEdit,
    isSubmitting,
    t: tDrawer,
    handleBlur,
    validateField,
    handleCodeChange,
    handleStatusChange,
    handleMarathiStatusChange,
    handleDescriptionChange,
    handleStatusToggle,
    handleSubmit,
    validate,
  };
}
