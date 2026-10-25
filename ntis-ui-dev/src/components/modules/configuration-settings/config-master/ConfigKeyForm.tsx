'use client';

import { useState, useMemo, useTransition, forwardRef, useImperativeHandle } from 'react';
import { Button, useConfirm, useToast } from '@/components/common';
import {
  createConfigKeyAction,
  updateConfigKeyAction,
} from '@/app/[locale]/configuration-settings/config-master/actions';
import type { AddConfigKeyModalProps, FormState } from '@/types/configMaster.types';
import { useTranslations } from 'next-intl';
import { ConfigKeyFormFields } from './ConfigKeyFormFields';
import { CreateConfigKeySchema, UpdateConfigKeySchema } from '@/lib/validations/config-master.schema';

const getControlTypeFromDataType = (dataType: string): string => {
  const dt = dataType?.toLowerCase() || '';
  if (dt === 'int' || dt === 'decimal') return 'number';
  if (dt === 'boolean') return 'checkbox';
  if (dt === 'datetime') return 'calendar';
  return 'textbox';
};

const initialFormState: FormState = {
  categoryId: '',
  configCode: '',
  configName: '',
  description: '',
  dataType: 'string',
  controlType: 'textbox',
  defaultValue: '',
  isActive: true,
};

export interface ConfigKeyFormRef {
  handleClose: () => void;
}

export const ConfigKeyForm = forwardRef<ConfigKeyFormRef, Omit<AddConfigKeyModalProps, 'isOpen'> & { isEdit: boolean }>(
  ({
    initialData,
    categoryId,
    categories,
    onSuccess,
    onClose,
    isEdit,
  }, ref) => {
  const t = useTranslations('configMaster');
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const { confirm } = useConfirm();
  const { success: toastSuccess, error: toastError } = useToast();

  const derivedFormState = useMemo(() => {
    if (!isEdit || !initialData) {
      const dt = initialFormState.dataType || 'string';
      return {
        ...initialFormState,
        categoryId: categoryId?.toString() || '',
        controlType: getControlTypeFromDataType(dt),
      };
    }
    const dt = initialData.dataType || 'string';
    const initDefVal = (initialData.defaultValue !== undefined && initialData.defaultValue !== null && String(initialData.defaultValue).trim() !== '')
      ? String(initialData.defaultValue)
      : (initialData.value !== undefined && initialData.value !== null ? String(initialData.value) : '');

    return {
      categoryId: initialData.categoryId?.toString() || categoryId?.toString() || '',
      configCode: (initialData.configCode || '').replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '').toUpperCase(),
      configName: initialData.name || '',
      description: initialData.description || '',
      dataType: dt,
      controlType: getControlTypeFromDataType(dt),
      defaultValue: initDefVal,
      isActive: initialData.isEnabled ?? true,
    };
  }, [isEdit, initialData, categoryId]);

  const [formData, setFormData] = useState<FormState>(derivedFormState);

  const isDirty = useMemo(() => 
    JSON.stringify(formData) !== JSON.stringify(derivedFormState), 
  [formData, derivedFormState]);

  const handleDataTypeChange = (value: string): void => {
    setFormData((prev) => ({
      ...prev,
      dataType: value,
      controlType: getControlTypeFromDataType(value),
    }));
  };

  const handleClose = (): void => {
    if (isPending) return;
    if (isDirty) {
      confirm({
        variant: 'warning',
        title: t('confirm.discard.title'),
        description: t('confirm.discard.description'),
        confirmText: t('confirm.discard.confirm'),
        cancelText: t('confirm.discard.cancel'),
        onConfirm: onClose,
      });
      return;
    }
    onClose();
  };

  useImperativeHandle(ref, () => ({
    handleClose,
  }));

  const validateForm = (): boolean => {
    const parsedCategoryId = parseInt(formData.categoryId, 10);
    const validationData = {
      ...formData,
      categoryId: isNaN(parsedCategoryId) ? 0 : parsedCategoryId,
    };
    const schema = isEdit ? UpdateConfigKeySchema : CreateConfigKeySchema;
    const validation = schema.safeParse(validationData);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const newErrors: Partial<Record<keyof FormState, string>> = {};
      Object.entries(fieldErrors).forEach(([key, msgs]) => {
        if (Array.isArray(msgs) && msgs.length > 0) {
          newErrors[key as keyof FormState] = msgs[0].includes('.') ? t(msgs[0] as never) : msgs[0];
        }
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return;
    if (isEdit && !isDirty) {
      onClose();
      return;
    }
    
    startTransition(async () => {
      try {
        const parsedCategoryId = parseInt(formData.categoryId, 10);
        if (isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
          toastError(t('modals.addKey.form.validation.categoryRequired'));
          return;
        }
        
        const submitData = new FormData();
        Object.entries(formData).forEach(([k, v]) => submitData.append(k, v.toString()));

        const result = isEdit && initialData
          ? await updateConfigKeyAction(initialData.configKeyId, { 
              ...formData, 
              categoryId: parsedCategoryId 
            })
          : await createConfigKeyAction(submitData);

        if (result.success) {
          toastSuccess(isEdit ? t('messages.keyUpdated') : t('messages.keyCreated'));
          onSuccess?.();
        } else {
          if (result.validationErrors) {
            const mappedErrors: Partial<Record<keyof FormState, string>> = {};
            Object.entries(result.validationErrors).forEach(([key, msgs]) => {
              if (Array.isArray(msgs) && msgs.length > 0) {
                mappedErrors[key as keyof FormState] = msgs[0].includes('.') ? t(msgs[0] as never) : msgs[0];
              }
            });
            setErrors(mappedErrors);
          }
          toastError(result.error || result.message || (isEdit ? t('messages.keyUpdateFailed') : t('messages.keyCreateFailed')));
        }
      } catch {
        toastError(t('messages.unexpectedError'));
      }
    });
  };

  return (
    <div className="flex flex-col h-full light w-full">
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <ConfigKeyFormFields
            formData={formData}
            errors={errors}
            categoryOptions={(categories ?? []).map(c => ({ value: c.id, label: c.name }))}
            isPending={isPending}
            isEdit={isEdit}
            onFieldChange={(f, v) => setFormData(p => ({ ...p, [f]: v }))}
            onDataTypeChange={handleDataTypeChange}
          />
        </form>
      </div>
      <div className="border-t border-[#DCEAFF] px-6 py-4 flex items-center justify-end gap-3 bg-[#ffffff] shrink-0">
        <Button variant="secondary" onClick={handleClose} disabled={isPending} className="cursor-pointer">
          {t('modals.addKey.buttons.cancel')}
        </Button>
        <Button 
          variant="success" 
          onClick={handleSubmit} 
          disabled={isPending || (isEdit && !isDirty)} 
          isLoading={isPending} 
          className="cursor-pointer"
        >
          {isPending 
            ? (isEdit ? t('modals.editKey.buttons.saving') : t('modals.addKey.buttons.creating')) 
            : (isEdit ? t('modals.editKey.buttons.save') : t('modals.addKey.buttons.create'))}
        </Button>
      </div>
    </div>
  );
});

ConfigKeyForm.displayName = 'ConfigKeyForm';
