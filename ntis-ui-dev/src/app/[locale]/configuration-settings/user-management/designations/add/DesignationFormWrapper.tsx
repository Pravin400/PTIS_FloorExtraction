'use client';

import { DesignationForm } from '@/components/modules/configuration-settings/user-management/components/DesignationForm';
import { useDesignationForm } from '@/hooks/configuration-settings/user-management/useDesignationForm';
import { useRouter } from 'next/navigation';
import { Designation } from '@/types/user-management';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useTranslations } from 'next-intl';

interface DesignationFormWrapperProps {
  initialData?: Designation;
  isEdit?: boolean;
}

export function DesignationFormWrapper({ initialData, isEdit }: DesignationFormWrapperProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const tCommon = useTranslations('common');

  const {
    designationFormData,
    setDesignationFormData,
    handleDesignationSubmit,
    isSubmitting,
    errors,
  } = useDesignationForm(() => {
    router.back();
    router.refresh();
  }, initialData);

  const hasChanges = () => {
    const base = initialData
      ? {
          code: initialData.code || '',
          name: initialData.name || '',
          localName: initialData.localName || '',
          description: initialData.description || '',
          isActive: !!initialData.isActive,
        }
      : {
          code: '',
          name: '',
          localName: '',
          description: '',
          isActive: true,
        };

    return (
      designationFormData.code.trim() !== base.code.trim() ||
      designationFormData.name.trim() !== base.name.trim() ||
      designationFormData.localName.trim() !== base.localName.trim() ||
      designationFormData.description.trim() !== base.description.trim() ||
      Boolean(designationFormData.isActive) !== Boolean(base.isActive)
    );
  };

  const handleCancel = () => {
    if (hasChanges()) {
      confirm({
        variant: 'warning',
        title: tCommon('confirm.warning.title') || 'Warning',
        description: tCommon('messages.unsavedChanges') || 'You have unsaved changes',
        confirmText: tCommon('confirm.warning.confirm') || 'Proceed',
        cancelText: tCommon('confirm.cancel') || 'Cancel',
        onConfirm: () => {
          router.back();
        },
      });
    } else {
      router.back();
    }
  };

  return (
    <DesignationForm
      isOpen={true}
      onClose={handleCancel}
      editingDesignation={isEdit ? initialData || null : null}
      formData={designationFormData}
      setFormData={setDesignationFormData}
      onSubmit={handleDesignationSubmit}
      isSubmitting={isSubmitting}
      errors={errors}
    />
  );
}
