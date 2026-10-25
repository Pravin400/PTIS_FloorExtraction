'use client';

import { useState } from 'react';
import { Role, RoleFormData } from '@/types/user-management';
import {
  createUserRoleAction,
  updateUserRoleAction,
} from '@/app/[locale]/configuration-settings/user-management/actions.mutations';
import { getUserRolesAction } from '@/app/[locale]/configuration-settings/user-management/actions';
import { userManagementValidations } from '@/lib/utils/user-management-validation';
import { toast } from 'sonner';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { useTranslations } from 'next-intl';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function useRoleForm(onSuccess: (role: Role) => void, initialData?: Role) {
  const t = useTranslations('userManagement');
  const roleLabel = useAliasLabel('Role', t('aliasFallback.role'));
  const departmentLabel = useAliasLabel('Department', t('aliasFallback.department'));

  const [editingRole, setEditingRole] = useState<Role | null>(initialData || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roleFormData, setRoleFormData] = useState<RoleFormData>({
    departmentId: initialData?.departmentId || '',
    departmentName: initialData?.departmentName || '',
    name: initialData?.name || '',
    isActive: initialData ? !!initialData.isActive : true,
  });

  const resetRoleForm = () => {
    setRoleFormData({
      departmentId: '',
      departmentName: '',
      name: '',
      isActive: true,
    });
    setEditingRole(null);
    setErrors({});
  };

  const handleRoleEdit = (role: Role) => {
    setEditingRole(role);
    setRoleFormData({
      departmentId: role.departmentId || '',
      departmentName: role.departmentName || '',
      name: role.name,
      isActive: !!role.isActive,
    });
    setErrors({});
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validationErrors = userManagementValidations.validateRole(roleFormData, t, {
      role: roleLabel,
      department: departmentLabel,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      // Fetch latest roles to verify duplicate names
      const rolesRes = await getUserRolesAction();
      if (rolesRes.success && rolesRes.data) {
        const roleNameNormalized = roleFormData.name.trim().toLowerCase();
        const isDuplicate = rolesRes.data.some((role) => {
          if (
            editingRole &&
            (String(role.id) === String(editingRole.id) ||
              Number(role.userRoleId) === Number(editingRole.userRoleId))
          ) {
            return false;
          }
          return role.name.trim().toLowerCase() === roleNameNormalized;
        });

        if (isDuplicate) {
          const duplicateMsg =
            t('form.errors.duplicateRoleName', { role: roleLabel }) || `${roleLabel} already exists`;
          setErrors({ name: duplicateMsg });
          toast.error(duplicateMsg);
          setIsSubmitting(false);
          return;
        }
      }

      const rolePayload: Partial<Role> = {
        name: roleFormData.name,
        departmentId: roleFormData.departmentId ? Number(roleFormData.departmentId) : undefined,
        departmentName: roleFormData.departmentName,
        isActive: roleFormData.isActive,
      };

      if (editingRole) {
        const updatedRole: Role = {
          ...editingRole,
          ...rolePayload,
        };
        const res = await updateUserRoleAction(updatedRole);
        if (res.success) {
          onSuccess(updatedRole);
          toast.success(t('messages.roleUpdateSuccess', { role: roleLabel }));
          resetRoleForm();
        } else {
          setErrors(res.validationErrors || {});
          let errorMsg =
            res.message || t('messages.roleUpdateError', { role: roleLabel });
          if (res.message) {
            if (res.message.startsWith('messages.') || res.message.startsWith('errors.')) {
              errorMsg = t(res.message, { role: roleLabel });
            } else {
              errorMsg = getCleanErrorMessage(res.message);
            }
          }
          toast.error(errorMsg);
        }
      } else {
        const res = await createUserRoleAction(rolePayload);
        if (res.success && res.data) {
          onSuccess(res.data);
          toast.success(t('messages.roleCreateSuccess', { role: roleLabel }));
          resetRoleForm();
        } else {
          setErrors(res.validationErrors || {});
          let errorMsg =
            res.message || t('messages.roleCreateError', { role: roleLabel });
          if (res.message) {
            if (res.message.startsWith('messages.') || res.message.startsWith('errors.')) {
              errorMsg = t(res.message, { role: roleLabel });
            } else {
              errorMsg = getCleanErrorMessage(res.message);
            }
          }
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error during role submission:', error);
      toast.error(getCleanErrorMessage(error, t('messages.unknownError')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    roleFormData,
    setRoleFormData,
    editingRole,
    handleRoleEdit,
    handleRoleSubmit,
    resetRoleForm,
    isSubmitting,
    errors,
  };
}
