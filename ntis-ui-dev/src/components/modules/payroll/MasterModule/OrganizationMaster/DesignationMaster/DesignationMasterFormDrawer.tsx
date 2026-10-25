'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { DesignationMasterItem } from '@/types/payroll/MasterModule';
import {
  Drawer,
  Input,
  Label,
  ToggleSwitch,
  ValidationMessage,
  RequiredFieldsNote,
  CancelButton,
  SaveButton,
  TextArea,
} from '@/components/common';
import { Award, Hash, Languages } from 'lucide-react';
import { useDesignationMasterForm } from '@/hooks/payroll/useDesignationMasterForm';

export interface DesignationMasterFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<DesignationMasterItem, 'designationId' | 'id'>
  ) => Promise<boolean | void> | void;
  initialItem?: DesignationMasterItem | null;
  existingCodes?: string[];
}

export function DesignationMasterFormDrawer({
  isOpen,
  onClose,
  onSave,
  initialItem,
  existingCodes = [],
}: DesignationMasterFormDrawerProps): React.ReactElement | null {
  const t = useTranslations('payrollDesignationMaster');
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
  } = useDesignationMasterForm({
    isOpen,
    initialItem,
    existingCodes,
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
            <Award size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-blue-900 leading-tight">
                {isEdit ? t('form.editTitle') : t('form.addTitle')}
              </h2>
              {isEdit && initialItem && (
                <span className="hidden xs:inline-block font-mono text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                  {initialItem.designationCode || initialItem.designationId}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit ? t('form.editSubtitle') : t('form.subtitle')}
            </p>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={tCommon('buttons.cancel')}
            onClick={onClose}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? tCommon('buttons.update') : tCommon('buttons.save')}
            type="submit"
            form="desig-form"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form
        id="desig-form"
        onSubmit={handleSubmit}
        className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 text-black"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-blue-600" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-black">
              {t('list.title')}
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
            <Label htmlFor="desig-code" required className="block text-xs font-semibold text-black">
              {t('form.fields.designationCode.label')}
            </Label>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-3 text-black/60 pointer-events-none z-10" />
              <Input
                naked
                id="desig-code"
                name="designationCode"
                type="text"
                value={form.designationCode}
                maxLength={20}
                onChange={(e) =>
                  setField(
                    'designationCode',
                    e.target.value
                      .replace(/[^a-zA-Z0-9_-]/g, '')
                      .toUpperCase()
                      .slice(0, 20)
                  )
                }
                onBlur={() => handleBlur('designationCode')}
                placeholder={
                  t('form.fields.designationCode.placeholder') !==
                  'form.fields.designationCode.placeholder'
                    ? t('form.fields.designationCode.placeholder')
                    : 'e.g. COMM / CLERK'
                }
                className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 font-mono tracking-wider uppercase font-semibold ${
                  errors.designationCode
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20 text-black'
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 text-black'
                }`}
              />
            </div>
            <ValidationMessage
              message={errors.designationCode}
              visible={Boolean(errors.designationCode)}
              type="error"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="block text-xs font-semibold text-black">
              {t('form.status.label')}
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

        {/* Row 2 — Designation Name (EN) */}
        <div className="space-y-1.5">
          <Label htmlFor="desig-name" required className="block text-xs font-semibold text-black">
            {t('form.fields.designationName.label')}
          </Label>
          <div className="relative">
            <Award size={14} className="absolute left-3 top-3 text-black/60 pointer-events-none z-10" />
            <Input
              naked
              id="desig-name"
              name="designationName"
              type="text"
              value={form.designationName}
              maxLength={100}
              onChange={(e) => {
                const val = e.target.value.replace(/[^A-Za-z\s.\-()\/&]/g, '').slice(0, 100);
                setField('designationName', val);
                scheduleAutoTransliterate(val);
              }}
              onBlur={(e) => {
                handleBlur('designationName');
                const val = e.target.value.trim();
                if (val && !form.designationNameMarathi) {
                  scheduleAutoTransliterate(val);
                }
              }}
              placeholder={
                t('form.fields.designationName.placeholder') !==
                'form.fields.designationName.placeholder'
                  ? t('form.fields.designationName.placeholder')
                  : 'e.g. Municipal Commissioner / Senior Clerk'
              }
              className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 text-black ${
                errors.designationName
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>
          <ValidationMessage
            message={errors.designationName}
            visible={Boolean(errors.designationName)}
            type="error"
          />
        </div>

        {/* Row 3 — Designation Name (Regional) */}
        <div className="space-y-1.5">
          <Label htmlFor="desig-name-mr" required className="block text-xs font-semibold text-black">
            {t('form.fields.designationLocal.label')}
          </Label>
          <div className="relative">
            <Languages size={15} className="absolute left-3 top-3 text-black/60 pointer-events-none z-10" />
            <Input
              naked
              id="desig-name-mr"
              name="designationNameMarathi"
              type="text"
              value={form.designationNameMarathi}
              maxLength={100}
              onChange={(e) =>
                setField(
                  'designationNameMarathi',
                  e.target.value
                    .replace(/[^A-Za-z\u0900-\u097F\s.\-()\/&]|[\d\u0966-\u096F]/g, '')
                    .slice(0, 100)
                )
              }
              onBlur={(e) => {
                handleBlur('designationNameMarathi');
                void handleBlurTransliterate(e.target.value);
              }}
              placeholder={
                t('form.fields.designationLocal.placeholder') !==
                'form.fields.designationLocal.placeholder'
                  ? t('form.fields.designationLocal.placeholder')
                  : 'उदा. महानगरपालिका आयुक्त'
              }
              className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 text-black font-medium ${
                errors.designationNameMarathi
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>
          <ValidationMessage
            message={errors.designationNameMarathi}
            visible={Boolean(errors.designationNameMarathi)}
            type="error"
          />
        </div>

        {/* Row 4 — Description */}
        <div className="space-y-1.5">
          <TextArea
            label={t('form.fields.designationDescription.label')}
            rows={3}
            maxLength={250}
            showCharCount
            value={form.description ?? ''}
            onChange={(e) => setField('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder={
              t('form.fields.designationDescription.placeholder') !==
              'form.fields.designationDescription.placeholder'
                ? t('form.fields.designationDescription.placeholder')
                : 'Brief description of the post responsibilities...'
            }
            error={Boolean(errors.description)}
            errorMessage={errors.description}
            className="text-xs rounded-xl border-slate-200 resize-none text-black placeholder:text-black/40"
          />
        </div>
      </form>
    </Drawer>
  );
}
