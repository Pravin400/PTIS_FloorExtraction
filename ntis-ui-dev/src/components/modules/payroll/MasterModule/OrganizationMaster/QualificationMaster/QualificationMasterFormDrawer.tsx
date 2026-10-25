'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { QualificationMasterItem } from '@/types/payroll/MasterModule';
import {
  Drawer,
  Input,
  Label,
  ToggleSwitch,
  ValidationMessage,
  RequiredFieldsNote,
  CancelButton,
  SaveButton,
} from '@/components/common';
import { GraduationCap, Hash, Languages } from 'lucide-react';
import { useQualificationMasterForm } from '@/hooks/payroll/useQualificationMasterForm';

export interface QualificationMasterFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<QualificationMasterItem, 'qualificationId'>) => Promise<boolean | void> | void;
  initialItem?: QualificationMasterItem | null;
  existingCodes?: string[];
}

export function QualificationMasterFormDrawer({
  isOpen,
  onClose,
  onSave,
  initialItem,
  existingCodes = [],
}: QualificationMasterFormDrawerProps): React.ReactElement | null {
  const t = useTranslations('payrollQualificationMaster');
  const tCommon = useTranslations('common');

  const {
    form,
    errors,
    isSubmitting,
    isEdit,
    setField,
    scheduleAutoTransliterate,
    handleBlurTransliterate,
    handleBlur,
    handleSubmit,
  } = useQualificationMasterForm({
    isOpen,
    initialItem,
    existingCodes: new Set(existingCodes.map((c) => c.toUpperCase())),
    onSave: async (data) => await onSave(data),
    onClose,
  });

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      width="md"
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white shadow-sm shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-blue-900 leading-tight">
                {isEdit ? t('form.title.edit') : t('form.title.add')}
              </h2>
              {isEdit && initialItem && (
                <span className="hidden xs:inline-block font-mono text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                  {initialItem.qualificationCode}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit ? t('form.subtitle.edit') : t('form.subtitle.add')}
            </p>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={t('form.buttons.cancel')}
            onClick={onClose}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? t('form.buttons.update') : t('form.buttons.save')}
            type="submit"
            form="qualification-form"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form
        id="qualification-form"
        onSubmit={handleSubmit}
        className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 text-black"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-blue-600" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-black">
              {t('title')}
            </h3>
          </div>
          <RequiredFieldsNote
            text={
              t('form.mandatoryFields') !== 'form.mandatoryFields'
                ? t('form.mandatoryFields')
                : tCommon('note.mandatory')
            }
          />
        </div>

        {/* Row 1 — Code + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="qualification-code" required className="block text-xs font-semibold text-black">
              {t('form.fields.qualificationCode')}
            </Label>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-3 text-black/60 pointer-events-none z-10" />
              <Input
                naked
                id="qualification-code"
                aria-invalid={Boolean(errors.qualificationCode)}
                aria-describedby={errors.qualificationCode ? "qualification-code-error" : undefined}
                name="qualificationCode"
                type="text"
                value={form.qualificationCode}
                maxLength={30}
                onChange={(e) =>
                  setField(
                    'qualificationCode',
                    e.target.value
                      .replace(/[^a-zA-Z0-9_-]/g, '')
                      .toUpperCase()
                      .slice(0, 30)
                  )
                }
                onBlur={() => handleBlur('qualificationCode')}
                placeholder={t('form.fields.qualificationCodePlaceholder')}
                className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 font-mono tracking-wider uppercase font-semibold ${
                  errors.qualificationCode
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20 text-black'
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 text-black'
                }`}
              />
            </div>
            <ValidationMessage
              message={errors.qualificationCode}
              visible={Boolean(errors.qualificationCode)}
              type="error"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="block text-xs font-semibold text-black">
              {t('form.fields.status')}
            </Label>
            <div
              className={`w-full h-[38px] flex items-center justify-between px-3.5 rounded-xl border transition-all ${
                form.isActive
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  form.isActive ? 'text-emerald-700' : 'text-slate-600'
                }`}
              >
                {form.isActive ? tCommon('status.active') : tCommon('status.inactive')}
              </span>
              <ToggleSwitch
                checked={form.isActive}
                onChange={(val) => setField('isActive', val)}
                showPopup={false}
                activeLabel={tCommon('status.active')}
                inactiveLabel={tCommon('status.inactive')}
              />
            </div>
          </div>
        </div>

        {/* Row 2 — Qualification Name */}
        <div className="space-y-1.5">
          <Label htmlFor="qualification-name" required className="block text-xs font-semibold text-black">
            {t('form.fields.qualificationName')}
          </Label>
          <div className="relative">
            <GraduationCap size={14} className="absolute left-3 top-3 text-black/60 pointer-events-none z-10" />
            <Input
              naked
              id="qualification-name"
              aria-invalid={Boolean(errors.qualificationName)}
              aria-describedby={errors.qualificationName ? "qualification-name-error" : undefined}
              name="qualificationName"
              type="text"
              value={form.qualificationName}
              maxLength={100}
              onChange={(e) => {
                const val = e.target.value.replace(/[^A-Za-z0-9\s.,\-()\/&+]/g, '').slice(0, 100);
                setField('qualificationName', val);
                scheduleAutoTransliterate(val);
              }}
              onBlur={(e) => {
                handleBlur('qualificationName');
                const val = e.target.value.trim();
                if (val && !form.qualificationNameRegional) {
                  scheduleAutoTransliterate(val);
                }
              }}
              placeholder={t('form.fields.qualificationNamePlaceholder')}
              className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 text-black ${
                errors.qualificationName
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>
          <ValidationMessage
            message={errors.qualificationName}
            visible={Boolean(errors.qualificationName)}
            type="error"
          />
        </div>

        {/* Row 3 — Qualification Name (Regional) */}
        <div className="space-y-1.5">
          <Label htmlFor="qualification-name-regional" required className="block text-xs font-semibold text-black">
            {t('form.fields.qualificationNameLocal')}
          </Label>
          <div className="relative">
            <Languages size={15} className="absolute left-3 top-3 text-black/60 pointer-events-none z-10" />
            <Input
              naked
              id="qualification-name-regional"
              aria-invalid={Boolean(errors.qualificationNameRegional)}
              aria-describedby={errors.qualificationNameRegional ? "qualification-name-regional-error" : undefined}
              name="qualificationNameRegional"
              type="text"
              value={form.qualificationNameRegional}
              maxLength={150}
              onChange={(e) =>
                setField(
                  'qualificationNameRegional',
                  e.target.value
                    .replace(/[^A-Za-z0-9\u0900-\u097F\s.,\-()\/&+]/g, '')
                    .slice(0, 150)
                )
              }
              onBlur={(e) => {
                handleBlur('qualificationNameRegional');
                void handleBlurTransliterate(e.target.value);
              }}
              placeholder={t('form.fields.qualificationNameLocalPlaceholder')}
              className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 text-black font-medium ${
                errors.qualificationNameRegional
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>
          <ValidationMessage
            message={errors.qualificationNameRegional}
            visible={Boolean(errors.qualificationNameRegional)}
            type="error"
          />
        </div>
      </form>
    </Drawer>
  );
}
