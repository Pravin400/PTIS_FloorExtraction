'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { UserForm } from '@/components/modules/configuration-settings/user-management/components/UserForm';
import { TwoFactorSetupWizard } from '@/components/modules/configuration-settings/user-management/components/TwoFactorSetupWizard';
import { useUserForm } from '@/hooks/configuration-settings/user-management/useUserForm';
import { useRouter } from 'next/navigation';
import { User, Role, Department, MasterModule } from '@/types/user-management';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useTranslations } from 'next-intl';
import { getInitialState } from '@/hooks/configuration-settings/user-management/userFormReducer';

interface UserFormWrapperProps {
  initialData?: User;
  isEdit?: boolean;
  roles: Role[];
  departments: Department[];
  modules: MasterModule[];
}

export function UserFormWrapper({
  initialData,
  isEdit,
  roles,
  departments,
  modules,
}: UserFormWrapperProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const tCommon = useTranslations('common');
  const t = useTranslations('userManagement');
  const [justCreatedUser, setJustCreatedUser] = useState<User | null>(null);

  const finishFlow = () => {
    router.back();
    router.refresh();
  };

  const {
    formData,
    setFormData,
    handleSubmit,
    currentTab,
    setCurrentTab,
    isSubmitting,
    handleNext,
    handlePrevious,
    isFirstStep,
    isLastStep,
    currentIndex,
    toggleDepartment,
    toggleModule,
    toggleRole,
    selectAllModules,
    deselectAllModules,
    errors,
  } = useUserForm((user) => {
    if (isEdit) {
      finishFlow();
    } else {
      // Newly created user — offer in-person 2FA enrollment before leaving the flow.
      setJustCreatedUser(user);
    }
  }, initialData);

  const hasChanges = () => {
    const base = getInitialState(initialData);

    const stringKeys = [
      'userName',
      'userCode',
      'firstName',
      'middleName',
      'lastName',
      'email',
      'mobileNo',
      'alternateMobileNo',
      'address',
      'remark',
    ] as const;

    for (const key of stringKeys) {
      const currentVal =
        formData[key] === undefined || formData[key] === null ? '' : String(formData[key]).trim();
      const initialVal =
        base[key] === undefined || base[key] === null ? '' : String(base[key]).trim();
      if (currentVal !== initialVal) {
        return true;
      }
    }

    if (Boolean(formData.isActive) !== Boolean(base.isActive)) {
      return true;
    }

    // Compare arrays
    if (formData.userRoleIds.length !== base.userRoleIds.length) return true;
    const initialRoleIdsSet = new Set(base.userRoleIds);
    for (const rId of formData.userRoleIds) {
      if (!initialRoleIdsSet.has(rId)) return true;
    }

    if (formData.departmentIds.length !== base.departmentIds.length) return true;
    const initialDeptIdsSet = new Set(base.departmentIds);
    for (const dId of formData.departmentIds) {
      if (!initialDeptIdsSet.has(dId)) return true;
    }

    // Compare moduleAccess (Record<string, string[]>)
    const currentDeptKeys = Object.keys(formData.moduleAccess);
    const initialDeptKeys = Object.keys(base.moduleAccess);
    const activeCurrentDepts = currentDeptKeys.filter((k) => formData.moduleAccess[k]?.length > 0);
    const activeInitialDepts = initialDeptKeys.filter((k) => base.moduleAccess[k]?.length > 0);

    if (activeCurrentDepts.length !== activeInitialDepts.length) return true;
    for (const deptId of activeCurrentDepts) {
      const currentModules = formData.moduleAccess[deptId] || [];
      const initialModules = base.moduleAccess[deptId] || [];
      if (currentModules.length !== initialModules.length) return true;
      const modSet = new Set(initialModules);
      for (const mId of currentModules) {
        if (!modSet.has(mId)) return true;
      }
    }

    // Compare roleAccess (Record<string, number[]>)
    const currentRoleDeptKeys = Object.keys(formData.roleAccess);
    const initialRoleDeptKeys = Object.keys(base.roleAccess);
    const activeCurrentRoleDepts = currentRoleDeptKeys.filter(
      (k) => formData.roleAccess[k]?.length > 0
    );
    const activeInitialRoleDepts = initialRoleDeptKeys.filter(
      (k) => base.roleAccess[k]?.length > 0
    );

    if (activeCurrentRoleDepts.length !== activeInitialRoleDepts.length) return true;
    for (const deptId of activeCurrentRoleDepts) {
      const currentRoles = formData.roleAccess[deptId] || [];
      const initialRoles = base.roleAccess[deptId] || [];
      if (currentRoles.length !== initialRoles.length) return true;
      const rSet = new Set(initialRoles);
      for (const rId of currentRoles) {
        if (!rSet.has(rId)) return true;
      }
    }

    return false;
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

  if (justCreatedUser) {
    return (
      <TwoFactorSetupWizard
        userId={justCreatedUser.userId}
        userName={justCreatedUser.userName}
        askFirst
        onCancel={finishFlow}
        onEnabled={() => {
          toast.success(t('twoFactorSetup.enabledSuccess'));
          finishFlow();
        }}
      />
    );
  }

  return (
    <UserForm
      isOpen={true}
      onClose={handleCancel}
      editingUser={isEdit ? initialData || null : null}
      formData={formData}
      setFormData={setFormData}
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      handleSubmit={handleSubmit}
      roles={roles}
      departments={departments}
      modules={modules}
      isSubmitting={isSubmitting}
      handleNext={handleNext}
      handlePrevious={handlePrevious}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      currentIndex={currentIndex}
      toggleDepartment={toggleDepartment}
      toggleModule={toggleModule}
      toggleRole={toggleRole}
      selectAllModules={selectAllModules}
      deselectAllModules={deselectAllModules}
      errors={errors}
    />
  );
}
