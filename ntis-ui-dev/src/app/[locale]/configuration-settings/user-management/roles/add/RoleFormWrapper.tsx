'use client';

import { RoleForm } from '@/components/modules/configuration-settings/user-management/components/RoleForm';
import { useRoleForm } from '@/hooks/configuration-settings/user-management/useRoleForm';
import { useRouter } from 'next/navigation';
import { Role, Department } from '@/types/user-management';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useTranslations } from 'next-intl';

interface RoleFormWrapperProps {
  initialData?: Role;
  isEdit?: boolean;
  departments?: Department[];
}

export function RoleFormWrapper({ initialData, isEdit, departments }: RoleFormWrapperProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const tCommon = useTranslations('common');

  const { roleFormData, setRoleFormData, handleRoleSubmit, isSubmitting, errors } = useRoleForm(
    () => {
      router.back();
      router.refresh();
    },
    initialData
  );

  const hasChanges = () => {
    const base = initialData
      ? {
          departmentId: initialData.departmentId || '',
          name: initialData.name || '',
          isActive: !!initialData.isActive,
        }
      : {
          departmentId: '',
          name: '',
          isActive: true,
        };

    return (
      String(roleFormData.departmentId) !== String(base.departmentId) ||
      roleFormData.name.trim() !== base.name.trim() ||
      Boolean(roleFormData.isActive) !== Boolean(base.isActive)
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
    <RoleForm
      isOpen={true}
      onClose={handleCancel}
      editingRole={isEdit ? initialData || null : null}
      formData={roleFormData}
      setFormData={setRoleFormData}
      onSubmit={handleRoleSubmit}
      departments={departments}
      isSubmitting={isSubmitting}
      errors={errors}
    />
  );
}
