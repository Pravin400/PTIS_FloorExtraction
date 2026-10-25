'use client';

import { useState, useEffect } from 'react';
import { Label, Input, Button, Drawer, ToggleSwitch, ValidationMessage, Select } from '@/components/common';
import { useTranslations } from 'next-intl';
import { RoleFormProps, Department } from '@/types/user-management';
import { getDepartmentsAction } from '@/app/[locale]/configuration-settings/user-management/actions';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function RoleForm({
  isOpen,
  onClose,
  editingRole,
  formData,
  setFormData,
  onSubmit,
  departments,
  isSubmitting,
  errors,
}: RoleFormProps) {
  const t = useTranslations('userManagement');
  const roleLabel = useAliasLabel('Role', t('aliasFallback.role'));
  const departmentLabel = useAliasLabel('Department', t('aliasFallback.department'));
  const userLabel = useAliasLabel('User', t('aliasFallback.user'));
  const [fetchedDepts, setFetchedDepts] = useState<Department[]>([]);

  useEffect(() => {
    if (!departments || departments.length === 0) {
      let isMounted = true;
      getDepartmentsAction().then((res) => {
        if (isMounted && res.success && res.data) {
          setFetchedDepts(res.data);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [departments]);

  const activeDepts = departments && departments.length > 0 ? departments : fetchedDepts;

  const departmentOptions = activeDepts.map((d) => ({
    label: d.departmentName,
    value: String(d.id || d.departmentMasterId),
  }));

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      width="md"
      title={
        <div className="flex flex-col">
          <span className="font-semibold text-xl text-slate-700">
            {editingRole
              ? t('roles.editRole', { role: roleLabel })
              : t('roles.addRole', { role: roleLabel })}
          </span>
          <span className="text-sm text-slate-700 font-normal">
            {t('roles.subtitle', { role: roleLabel, user: userLabel })}
          </span>
        </div>
      }
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1 border-1">
            {t('actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="role-form"
            disabled={isSubmitting}
            className="flex-1 text-white"
          >
            {isSubmitting
              ? t('actions.saving')
              : editingRole
                ? t('actions.updateRole', { role: roleLabel })
                : t('actions.createRole', { role: roleLabel })}
          </Button>
        </div>
      }
    >
      <form id="role-form" onSubmit={onSubmit} className="space-y-6 p-6">
        <div className="space-y-2">
          <Label>{t('form.departments', { department: departmentLabel })} *</Label>
          <Select
            required
            options={departmentOptions}
            value={formData.departmentId ? String(formData.departmentId) : ''}
            onChange={(_e, val) => {
              const selectedDept = activeDepts.find(
                (d) => String(d.id || d.departmentMasterId) === String(val)
              );
              setFormData({
                ...formData,
                departmentId: val,
                departmentName: selectedDept?.departmentName || '',
              });
            }}
            placeholder={
              t('form.selectDeptPrompt', { department: departmentLabel }) ||
              `Select ${departmentLabel}`
            }
            className="h-10"
          />
          {errors?.departmentId && <ValidationMessage message={errors.departmentId} />}
        </div>

        <div className="space-y-2">
          <Label>{roleLabel} *</Label>
          <Input
            required
            maxLength={30}
            value={formData.name}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-Z\u0900-\u097F\s]/g, '');
              setFormData({ ...formData, name: val });
            }}
            placeholder={roleLabel}
            className="h-10"
          />
          {errors?.name && <ValidationMessage message={errors.name} />}
        </div>

        {editingRole && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">{t('filters.status')}</Label>
              <p className="text-xs text-slate-500">
                {formData.isActive ? t('filters.active') : t('filters.inactive')}
              </p>
            </div>
            <ToggleSwitch
              checked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
              showPopup={false}
            />
          </div>
        )}
      </form>
    </Drawer>
  );
}
