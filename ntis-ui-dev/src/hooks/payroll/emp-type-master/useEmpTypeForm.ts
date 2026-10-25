'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  EmpTypeMasterItem,
  EmpTypeFormData,
  EmpTypeMasterPayload,
} from '@/types/payroll/MasterModule';
import { createEmpTypeSchema } from '@/lib/validations/payroll/empTypeMaster.schema';

const EMPTY_FORM: EmpTypeFormData = {
  employeeTypeCode: '',
  employeeTypeName: '',
  employeeTypeNameMarathi: '',
  sequenceNo: 1,
  isActive: true,
};

export interface UseEmpTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmpTypeMasterPayload) => Promise<boolean | void> | void;
  initialItem?: EmpTypeMasterItem | null;
  existingItems?: EmpTypeMasterItem[];
  existingCodes?: string[];
}

export function useEmpTypeForm({
  isOpen: _isOpen,
  onClose,
  onSave,
  initialItem,
  existingItems,
  existingCodes,
}: UseEmpTypeFormProps) {
  const t = useTranslations('payrollEmployeeTypeMaster');
  const tDrawer = useTranslations('payrollEmployeeTypeMaster.drawer');
  const defaultSeqNo =
    existingItems && existingItems.length > 0 ? existingItems.length + 1 : 1;
  const isEdit = !!initialItem;

  const [form, setForm] = useState<EmpTypeFormData>(() =>
    initialItem
      ? {
          employeeTypeCode: initialItem.employeeTypeCode,
          employeeTypeName: initialItem.employeeTypeName,
          employeeTypeNameMarathi: initialItem.employeeTypeNameMarathi,
          sequenceNo: initialItem.sequenceNo ?? 1,
          isActive: initialItem.isActive,
        }
      : {
          ...EMPTY_FORM,
          sequenceNo: defaultSeqNo,
        }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof EmpTypeFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof EmpTypeFormData>(key: K, value: EmpTypeFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleCodeChange = (raw: string) => {
    const formatted = raw
      .replace(/[^a-zA-Z_-]/g, '')
      .toUpperCase()
      .slice(0, 20);
    setField('employeeTypeCode', formatted);
  };

  const handleNameChange = (raw: string) => {
    const formatted = raw.replace(/[0-9]/g, '').slice(0, 100);
    setField('employeeTypeName', formatted);
  };

  const handleMarathiNameChange = (raw: string) => {
    const formatted = raw.replace(/[0-9०-९]/g, '').slice(0, 100);
    setField('employeeTypeNameMarathi', formatted);
  };

  const handleSequenceNoChange = (raw: string | number) => {
    const parsed = typeof raw === 'number' ? raw : parseInt(raw, 10);
    const val = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
    setField('sequenceNo', val);
  };

  const handleStatusToggle = (val: boolean) => {
    setField('isActive', val);
  };

  const validateField = (
    field: keyof EmpTypeFormData,
    customVal?: unknown
  ): string | undefined => {
    const formData = customVal !== undefined ? { ...form, [field]: customVal } : form;
    const schema = createEmpTypeSchema({
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

  const handleBlur = (field: keyof EmpTypeFormData) => {
    validateField(field);
  };

  const validate = (): boolean => {
    const schema = createEmpTypeSchema({
      t: (k: string) => t(k as Parameters<typeof t>[0]),
      existingItems,
      existingCodes,
      initialItem,
    });

    const result = schema.safeParse(form);
    if (!result.success) {
      const errMap: Partial<Record<keyof EmpTypeFormData, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof EmpTypeFormData;
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

    const sequenceNo = form.sequenceNo && form.sequenceNo >= 1 ? form.sequenceNo : 1;

    setIsSubmitting(true);
    try {
      const result = await onSave({
        employeeTypeCode: form.employeeTypeCode.trim().toUpperCase(),
        employeeTypeName: form.employeeTypeName.trim(),
        employeeTypeNameMarathi: form.employeeTypeNameMarathi.trim(),
        sequenceNo,
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
    handleNameChange,
    handleMarathiNameChange,
    handleSequenceNoChange,
    handleStatusToggle,
    handleSubmit,
    validate,
  };
}
