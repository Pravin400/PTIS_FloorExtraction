'use client';

import { useState, useTransition, useMemo } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button, Drawer, useConfirm, useToast } from '@/components/common';
import {
  createConfigCategoryAction,
  updateConfigCategoryAction,
} from '@/app/[locale]/configuration-settings/config-master/actions';
import { useTranslations } from 'next-intl';
import type { ConfigCategory } from '@/types/configMaster.types';
import { CategoryFormFields } from './CategoryFormFields';
import { CreateConfigCategorySchema, UpdateConfigCategorySchema } from '@/lib/validations/config-master.schema';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: ConfigCategory | null;
  categories?: ConfigCategory[];
}

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  categories,
}: AddCategoryModalProps) {
  const t = useTranslations('configMaster');
  const [isPending, startTransition] = useTransition();
  const { success: toastSuccess, error: toastError } = useToast();
  const { confirm } = useConfirm();
  const isEdit = !!initialData;

  const autoDisplayOrder = useMemo(() => {
    if (initialData?.displayOrder != null) {
      return initialData.displayOrder.toString();
    }
    if (!categories || categories.length === 0) return '1';
    const orders = categories.map((c) => Number(c.displayOrder) || 0);
    const maxOrder = Math.max(...orders, 0);
    return (maxOrder + 1).toString();
  }, [categories, initialData]);

  const [formData, setFormData] = useState({
    categoryCode: (initialData?.code || '').toUpperCase(),
    categoryName: initialData?.name || '',
    displayOrder: autoDisplayOrder,
    isActive: initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = (): void => {
    setFormData({
      categoryCode: (initialData?.code || '').toUpperCase(),
      categoryName: initialData?.name || '',
      displayOrder: autoDisplayOrder,
      isActive: initialData?.isActive ?? true,
    });
    setErrors({});
  };

  const isDirty = useMemo(() => {
    return (
      formData.categoryCode !== (initialData?.code || '') ||
      formData.categoryName !== (initialData?.name || '') ||
      formData.displayOrder !== autoDisplayOrder ||
      formData.isActive !== (initialData?.isActive ?? true)
    );
  }, [formData, initialData, autoDisplayOrder]);

  const handleChange = (field: string, value: string | boolean): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const parsedDisplayOrder = parseInt(formData.displayOrder, 10);
    const validationData = {
      ...formData,
      displayOrder: isNaN(parsedDisplayOrder) ? 0 : parsedDisplayOrder,
    };
    const schema = isEdit ? UpdateConfigCategorySchema : CreateConfigCategorySchema;
    const validation = schema.safeParse(validationData);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const newErrors: Record<string, string> = {};
      Object.entries(fieldErrors).forEach(([key, msgs]) => {
        if (Array.isArray(msgs) && msgs.length > 0) {
          newErrors[key] = msgs[0].includes('.') ? t(msgs[0] as never) : msgs[0];
        }
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault();
    if (!validateForm()) return;

    // Prevent API call if no changes were made in edit mode
    if (isEdit && !isDirty) {
      onClose();
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => form.append(key, value.toString()));

      try {
        const result = isEdit && initialData?.id
          ? await updateConfigCategoryAction(parseInt(initialData.id), form)
          : await createConfigCategoryAction(form);

        if (result.success) {
          toastSuccess(isEdit ? t('messages.categoryUpdated') : t('messages.categoryCreated'));
          resetForm();
          onSuccess();
        } else {
          if (result.validationErrors) {
            const mappedErrors: Record<string, string> = {};
            Object.entries(result.validationErrors).forEach(([key, msgs]) => {
              if (Array.isArray(msgs) && msgs.length > 0) {
                mappedErrors[key] = msgs[0].includes('.') ? t(msgs[0] as never) : msgs[0];
              }
            });
            setErrors(mappedErrors);
          }
          toastError(result.error || result.message || t('messages.unexpectedError'));
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
        variant: 'warning',
        title: t('confirm.discard.title'),
        description: t('confirm.discard.description'),
        confirmText: t('confirm.discard.confirm'),
        cancelText: t('confirm.discard.cancel'),
        onConfirm: () => {
          resetForm();
          onClose();
        },
      });
      return;
    }
    resetForm();
    onClose();
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      width="sm"
      className="config-drawer"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm shrink-0">
            <FolderPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
              {isEdit ? t('modals.editCategory.title') : t('modals.addCategory.title')}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {isEdit ? t('modals.editCategory.subtitle') : t('modals.addCategory.subtitle')}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-row items-center justify-center gap-3 w-full border-t border-slate-100 p-4">
          <Button variant="secondary" onClick={handleClose} disabled={isPending} className="flex-1 sm:flex-none sm:px-6 cursor-pointer">
            {t('modals.addCategory.buttons.cancel')}
          </Button>
          <Button variant="primary" onClick={() => handleSubmit()} disabled={isPending || (isEdit && !isDirty)} isLoading={isPending} className="cursor-pointer">
            {isPending ? (isEdit ? t('modals.editCategory.buttons.saving') : t('modals.addCategory.buttons.creating')) : (isEdit ? t('modals.editCategory.buttons.save') : t('modals.addCategory.buttons.create'))}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="light">
        <CategoryFormFields formData={formData} errors={errors} isPending={isPending} isEdit={isEdit} onChange={handleChange} />
      </form>
    </Drawer>
  );
}
