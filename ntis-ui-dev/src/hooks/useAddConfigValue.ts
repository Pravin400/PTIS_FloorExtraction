'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common';
import { useTranslations } from 'next-intl';
import { createConfigValueAction } from '@/app/[locale]/configuration-settings/config-master/actions';
import { useConfirm } from '@/components/common';
import type { AddConfigValueModalProps } from '@/types/configMaster.types';

import { DateUtils } from '@/lib/utils/date-helpers';

const initialFormData = {
  configKeyId: '',
  departmentId: '',
  moduleId: '',
  value: '',
  isEnabled: true,
};

export function useAddConfigValue({
  onClose,
  onSuccess,
  categories,
  configItems,
}: Pick<AddConfigValueModalProps, 'onClose' | 'onSuccess' | 'categories' | 'configItems'>) {
  const t = useTranslations('configMaster');
  const router = useRouter();
  const { confirm } = useConfirm();
  const { success: toastSuccess, error: toastError } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const isDirty = useMemo(() => {
    return (
      formData.configKeyId !== '' ||
      formData.departmentId !== '' ||
      formData.moduleId !== '' ||
      formData.value !== '' ||
      !formData.isEnabled
    );
  }, [formData]);

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: t('modals.addValue.form.placeholders.filterCategory') },
      ...categories.map((cat) => ({
        value: cat.id,
        label: `${cat.name} (${cat.code})`,
      })),
    ],
    [categories, t]
  );

  const filteredConfigItems = useMemo(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      return configItems.filter((item) => item.category === selectedCategory);
    }
    return configItems;
  }, [selectedCategory, configItems]);

  const configKeyOptions = useMemo(
    () =>
      filteredConfigItems.map((item) => ({
        value: item.configKeyId.toString(),
        label: `${item.name}${item.configCode ? ` (${item.configCode})` : ''}`,
      })),
    [filteredConfigItems]
  );

  const selectedConfigKey = useMemo(
    () => configItems.find((item) => item.configKeyId.toString() === formData.configKeyId),
    [configItems, formData.configKeyId]
  );

  const handleCategoryChange = (newCategory: string): void => {
    setSelectedCategory(newCategory);
    if (newCategory && newCategory !== 'all' && formData.configKeyId) {
      const filtered = configItems.filter((item) => item.category === newCategory);
      if (!filtered.find((item) => item.configKeyId.toString() === formData.configKeyId)) {
        setFormData((prev) => ({ ...prev, configKeyId: '' }));
      }
    }
  };

  const handleChange = (field: string, value: string | boolean): void => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === 'configKeyId' && value) {
        const selectedKey = configItems.find((k) => k.configKeyId.toString() === value);
        // Use explicit check for null/undefined to allow falsy values like 0, false, empty string
        if (selectedKey && selectedKey.defaultValue != null && !prev.value) {
          newData.value = String(selectedKey.defaultValue);
        }
      }
      return newData;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.configKeyId) newErrors.configKeyId = t('modals.addValue.form.validation.keyRequired');
    if (!formData.value.trim()) newErrors.value = t('modals.addValue.form.validation.valueRequired');
    if (formData.departmentId && isNaN(parseInt(formData.departmentId))) {
      newErrors.departmentId = t('modals.addValue.form.validation.deptIdRequired');
    }
    if (formData.moduleId && isNaN(parseInt(formData.moduleId))) {
      newErrors.moduleId = t('modals.addValue.form.validation.moduleIdRequired');
    }

    if (selectedConfigKey && formData.value.trim()) {
      const normDataType = (selectedConfigKey.dataType || '').toLowerCase();
      const normControlType = (selectedConfigKey.controlType || '').toLowerCase();
      const trimmed = formData.value.trim();

      const isIntegerType = normControlType === 'number' || normDataType === 'int' || normDataType === 'integer';
      const isDecimalType = normDataType === 'decimal' || normDataType === 'float' || normDataType === 'double' || normDataType === 'number';
      const isDateTimeType = normDataType === 'datetime' || normDataType === 'date' || normDataType === 'timestamp' || normControlType === 'calendar' || normControlType === 'date';
      const isBooleanType = normControlType === 'checkbox' || normControlType === 'toggle' || normDataType === 'boolean' || normDataType === 'bool';

      if (isIntegerType && !/^-?\d+$/.test(trimmed)) {
        newErrors.value = t('messages.invalidInteger') || 'Please enter a valid integer';
      } else if (isDecimalType && (isNaN(Number(trimmed)) || !/^-?\d+(\.\d+)?$/.test(trimmed))) {
        newErrors.value = t('messages.invalidDecimal') || 'Please enter a valid decimal number';
      } else if (isDateTimeType && !DateUtils.isValidDateTime(trimmed)) {
        newErrors.value =
          t('messages.invalidDateTime') ||
          'Please enter a valid date and time (year from current year onwards)';
      } else if (isBooleanType && trimmed !== 'true' && trimmed !== 'false') {
        newErrors.value = t('messages.invalidBoolean') || 'Please select a valid boolean (True/False)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault();
    if (!validateForm()) return;

    const submitData = new FormData();
    submitData.append('configKeyId', formData.configKeyId);
    submitData.append('departmentId', formData.departmentId);
    submitData.append('moduleId', formData.moduleId);
    submitData.append('value', formData.value.trim());
    submitData.append('isEnabled', String(formData.isEnabled));

    startTransition(async () => {
      try {
        const result = await createConfigValueAction(submitData);
        if (result.success) {
          toastSuccess(t('messages.valueCreated') || 'Config Value created successfully');
          router.refresh();
          setFormData(initialFormData);
          setSelectedCategory('all');
          onSuccess?.();
          onClose();
        } else {
          toastError(result.error || t('messages.configValueCreateFailed'));
        }
      } catch {
        toastError(t('messages.unexpectedError'));
      }
    });
  };

  const handleClose = (): void => {
    if (isPending) return;
    if (isDirty) {
      confirm({
        title: t('confirm.discard.title'),
        description: t('confirm.discard.description'),
        confirmText: t('confirm.discard.confirm'),
        cancelText: t('confirm.discard.cancel'),
        onConfirm: () => {
          setFormData(initialFormData);
          setSelectedCategory('all');
          setErrors({});
          onClose();
        },
      });
      return;
    }
    setFormData(initialFormData);
    setSelectedCategory('all');
    setErrors({});
    onClose();
  };

  return {
    formData,
    errors,
    isPending,
    isDirty,
    selectedCategory,
    categoryOptions,
    configKeyOptions,
    selectedConfigKey,
    handleCategoryChange,
    handleChange,
    handleSubmit,
    handleClose,
  };
}
