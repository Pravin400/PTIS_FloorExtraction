'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Landmark, Hash, Building2, Languages } from 'lucide-react';
import type { ZoneDivisionMasterFormDrawerProps } from '@/types/payroll/MasterModule';
import {
  Drawer,
  CancelButton,
  SaveButton,
  RequiredFieldsNote,
  ValidationMessage,
  ToggleSwitch,
  Input,
  Label,
  TextArea,
} from '@/components/common';
import { useZoneDivisionMasterForm } from '@/hooks/payroll';
import { cn } from '@/lib/utils/cn';
import { PAYROLL_LIMITS } from '@/lib/constants/payroll.constants';

export type { ZoneDivisionMasterFormDrawerProps };

const inputCls = (err?: string) =>
  cn(
    'w-full text-xs rounded-xl border p-2.5 pl-9 placeholder:text-black/40 focus:outline-none focus:ring-2 text-black transition-all',
    err
      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20'
  );

export function ZoneDivisionMasterFormDrawer({
  isOpen,
  onClose,
  onSave,
  initialItem,
  existingItems,
  existingCodes = [],
}: ZoneDivisionMasterFormDrawerProps): React.ReactElement | null {
  const t = useTranslations('payrollZoneDivisionMaster');
  const tCommon = useTranslations('common');

  const codeSet = useMemo(
    () => new Set(existingCodes.map((c) => c.toUpperCase())),
    [existingCodes]
  );

  const {
    form, errors, showError, isSubmitting, isEdit, handleBlur,
    handleCodeChange, handleNameChange, handleRegionalNameChange,
    handleAddressChange, handleStatusToggle, handleBlurTransliterate, handleSubmit, resetForm,
  } = useZoneDivisionMasterForm({
    isOpen,
    initialItem,
    existingCodes: codeSet,
    existingItems,
    onSave: async (data) => await onSave(data),
    onClose,
  });

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const renderField = (
    id: 'zoneDivisionCode' | 'zoneDivisionName' | 'zoneDivisionNameRegional',
    label: string,
    icon: React.ReactNode,
    value: string,
    onChange: (val: string) => void,
    onBlur?: () => void,
    opts?: { placeholder?: string; maxLength?: number; className?: string }
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="block text-xs font-semibold text-black">
        {label} <span className="text-rose-500">*</span>
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-3 text-black/60 pointer-events-none z-10">{icon}</span>
        <Input
          id={id}
          name={id}
          naked
          value={value}
          maxLength={opts?.maxLength ?? 100}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur || (() => handleBlur(id))}
          placeholder={opts?.placeholder}
          aria-invalid={showError(id)}
          aria-describedby={showError(id) ? `${id}-error` : undefined}
          className={cn(inputCls(showError(id) ? errors[id] : undefined), opts?.className)}
        />
      </div>
      <ValidationMessage id={`${id}-error`} message={showError(id) ? errors[id] : undefined} visible={Boolean(showError(id))} type="error" />
    </div>
  );

  return (
    <Drawer
      open={isOpen}
      onClose={handleCancel}
      width="md"
      className="border-l-4 border-slate-600"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-blue-600 rounded-lg text-white shadow-sm shrink-0">
            <Landmark size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {isEdit ? t('drawer.editTitle') : t('drawer.addTitle')}
              </h2>
              {isEdit && initialItem && (
                <span className="hidden xs:inline-block font-mono text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                  {initialItem.zoneDivisionCode}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{isEdit ? t('drawer.editSubtitle') : t('drawer.addSubtitle')}</p>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton label={t('drawer.buttons.cancel')} onClick={handleCancel} disabled={isSubmitting} />
          <SaveButton label={isEdit ? t('drawer.buttons.update') : t('drawer.buttons.create')} type="submit" form="zone-division-form" disabled={isSubmitting} isLoading={isSubmitting} />
        </>
      }
    >
      <form id="zone-division-form" onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 text-black">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-blue-600" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-black">
              {t('drawer.sectionTitle')}
            </h3>
          </div>
          <RequiredFieldsNote text={t('drawer.mandatoryFields') || tCommon('note.mandatory')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderField('zoneDivisionCode', t('drawer.labels.officeCode'), <Hash size={14} />, form.zoneDivisionCode, handleCodeChange, () => handleBlur('zoneDivisionCode'), {
            placeholder: t('drawer.placeholders.officeCode'),
            maxLength: PAYROLL_LIMITS.CODE_MAX_LENGTH,
            className: 'font-mono uppercase font-semibold tracking-wider',
          })}

          <div className="space-y-1.5">
            <Label className="block text-xs font-semibold text-black">{t('drawer.labels.status')}</Label>
            <div className={cn('w-full h-[38px] flex items-center justify-between px-3.5 rounded-xl border transition-all', form.isActive ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-slate-50')}>
              <span className={cn('text-xs font-semibold', form.isActive ? 'text-emerald-700' : 'text-slate-600')}>
                {form.isActive ? tCommon('status.active') : tCommon('status.inactive')}
              </span>
              <ToggleSwitch checked={form.isActive} onChange={handleStatusToggle} showPopup={false} activeLabel={tCommon('status.active')} inactiveLabel={tCommon('status.inactive')} />
            </div>
          </div>
        </div>

        {renderField('zoneDivisionName', t('drawer.labels.officeName'), <Building2 size={14} />, form.zoneDivisionName, handleNameChange, () => handleBlur('zoneDivisionName'), {
          placeholder: t('drawer.placeholders.officeName'),
          maxLength: PAYROLL_LIMITS.NAME_MAX_LENGTH,
        })}

        {renderField('zoneDivisionNameRegional', t('drawer.labels.officeNameRegional'), <Languages size={15} />, form.zoneDivisionNameRegional, handleRegionalNameChange, () => {
          handleBlur('zoneDivisionNameRegional');
          void handleBlurTransliterate(form.zoneDivisionNameRegional);
        }, { placeholder: t('drawer.placeholders.officeNameRegional'), maxLength: PAYROLL_LIMITS.NAME_MAX_LENGTH })}

        <div className="space-y-1.5">
          <Label htmlFor="address" className="block text-xs font-semibold text-black">
            {t('drawer.labels.address')} <span className="text-rose-500">*</span>
          </Label>
          <TextArea
            id="address"
            name="address"
            rows={3}
            maxLength={PAYROLL_LIMITS.ADDRESS_MAX_LENGTH}
            showCharCount
            value={form.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onBlur={() => handleBlur('address')}
            placeholder={t('drawer.placeholders.address')}
            error={Boolean(showError('address'))}
            errorMessage={showError('address') ? errors.address : undefined}
            className="text-xs rounded-xl border-slate-200 resize-none text-black placeholder:text-black/40"
          />
        </div>
      </form>
    </Drawer>
  );
}

export default ZoneDivisionMasterFormDrawer;
