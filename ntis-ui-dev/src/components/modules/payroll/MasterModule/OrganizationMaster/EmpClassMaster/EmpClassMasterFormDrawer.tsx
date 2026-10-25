'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Layers, Hash, Languages } from 'lucide-react';
import type { EmpClassMasterFormDrawerProps } from '@/types/payroll/MasterModule';
import {
  Drawer,
  CancelButton,
  SaveButton,
  RequiredFieldsNote,
  ValidationMessage,
  ToggleSwitch,
  TextArea,
  Input,
  Label,
} from '@/components/common';
import { useEmpClassMasterForm } from '@/hooks/payroll';
import { cn } from '@/lib/utils/cn';
import { PAYROLL_LIMITS } from '@/lib/constants/payroll.constants';

export type { EmpClassMasterFormDrawerProps };

const inputCls = (err?: string) =>
  cn(
    'w-full text-xs rounded-xl border p-2.5 pl-9 placeholder:text-black/40 focus:outline-none focus:ring-2 text-black transition-all',
    err
      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20'
  );

export function EmpClassMasterFormDrawer({
  isOpen,
  onClose,
  onSave,
  initialItem,
  existingItems,
  existingCodes = [],
}: EmpClassMasterFormDrawerProps): React.ReactElement | null {
  const t = useTranslations('payrollEmployeeClassMaster');
  const tCommon = useTranslations('common');

  const codeSet = useMemo(
    () => new Set(existingCodes.map((c) => c.toUpperCase())),
    [existingCodes]
  );

  const {
    form, errors, showError, isSubmitting, isEdit, handleBlur,
    handleCodeChange, handleNameChange, handleMarathiNameChange,
    handleDescriptionChange, handleStatusToggle, handleBlurTransliterate, handleSubmit, resetForm,
  } = useEmpClassMasterForm({
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
    id: 'classCode' | 'className' | 'classNameMarathi',
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
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {isEdit ? t('drawer.editTitle') : t('drawer.addTitle')}
              </h2>
              {isEdit && initialItem && (
                <span className="hidden xs:inline-block font-mono text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                  {initialItem.classCode}
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
          <SaveButton label={isEdit ? t('drawer.buttons.update') : t('drawer.buttons.create')} type="submit" form="emp-class-form" disabled={isSubmitting} isLoading={isSubmitting} />
        </>
      }
    >
      <form id="emp-class-form" onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 text-black">
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
          {renderField('classCode', t('drawer.labels.classCode'), <Hash size={14} />, form.classCode, handleCodeChange, () => handleBlur('classCode'), {
            placeholder: t('drawer.placeholders.classCode'),
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

        {renderField('className', t('drawer.labels.className'), <Layers size={14} />, form.className, handleNameChange, () => handleBlur('className'), {
          placeholder: t('drawer.placeholders.className'),
          maxLength: PAYROLL_LIMITS.NAME_MAX_LENGTH,
        })}

        {renderField('classNameMarathi', t('drawer.labels.classNameLocal'), <Languages size={15} />, form.classNameMarathi, handleMarathiNameChange, () => {
          handleBlur('classNameMarathi');
          void handleBlurTransliterate(form.classNameMarathi);
        }, { placeholder: t('drawer.placeholders.classNameMarathi'), maxLength: PAYROLL_LIMITS.NAME_MAX_LENGTH })}

        <div className="space-y-1.5">
          <Label htmlFor="description" className="block text-xs font-semibold text-black">
            {t('drawer.labels.description')}
          </Label>
          <TextArea
            id="description"
            name="description"
            rows={3}
            maxLength={PAYROLL_LIMITS.DESCRIPTION_MAX_LENGTH}
            showCharCount
            value={form.description ?? ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder={t('drawer.placeholders.description')}
            error={Boolean(showError('description'))}
            errorMessage={showError('description') ? errors.description : undefined}
            className="text-xs rounded-xl border-slate-200 resize-none text-black placeholder:text-black/40"
          />
        </div>
      </form>
    </Drawer>
  );
}
