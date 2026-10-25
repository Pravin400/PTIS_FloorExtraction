'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { EmpTypeMasterItem, EmpTypeMasterPayload } from '@/types/payroll/MasterModule';
import {
  Drawer,
  Input,
  Label,
  PTISTransliteratedInput,
  ToggleSwitch,
  RequiredFieldsNote,
  ValidationMessage,
  CancelButton,
  SaveButton,
} from '@/components/common';
import { Briefcase, Hash, Languages } from 'lucide-react';
import { useEmpTypeForm } from '@/hooks/payroll/emp-type-master';

export interface EmpTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmpTypeMasterPayload) => Promise<boolean | void> | void;
  initialItem?: EmpTypeMasterItem | null;
  existingItems?: EmpTypeMasterItem[];
  existingCodes?: string[];
}

export function EmpTypeForm({
  isOpen,
  onClose,
  onSave,
  initialItem,
  existingItems,
  existingCodes,
}: EmpTypeFormProps): React.ReactElement | null {
  const tCommon = useTranslations('common');
  const {
    form,
    errors,
    isEdit,
    t,
    handleBlur,
    handleCodeChange,
    handleNameChange,
    handleMarathiNameChange,
    handleStatusToggle,
    handleSubmit,
    isSubmitting,
  } = useEmpTypeForm({
    isOpen,
    onClose,
    onSave,
    initialItem,
    existingItems,
    existingCodes,
  });

  const titleNode = (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center bg-blue-600 rounded-xl text-white shadow-sm shrink-0">
        <Briefcase size={20} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-blue-900 leading-tight">
            {isEdit ? t('editTitle') : t('addTitle')}
          </h2>
          {isEdit && (
            <span className="hidden xs:inline-block font-mono text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
              {initialItem?.employeeTypeCode}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          {isEdit ? t('editSubtitle') : t('addSubtitle')}
        </p>
      </div>
    </div>
  );

  const footerNode = (
    <>
      <CancelButton label={t('buttons.cancel')} onClick={onClose} />
      <SaveButton
        label={isEdit ? t('buttons.update') : t('buttons.create')}
        type="submit"
        form="emp-type-form"
        isLoading={isSubmitting}
        disabled={isSubmitting}
      />
    </>
  );

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      width="md"
      className="border-l-4 border-[#4F6A94]"
      title={titleNode}
      footer={footerNode}
    >
      <form
        id="emp-type-form"
        onSubmit={handleSubmit}
        className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 text-black"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-blue-600" />
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-black">
              {t('sectionTitle')}
            </h3>
          </div>
          <RequiredFieldsNote
            text={
              t('mandatoryFields') !== 'mandatoryFields'
                ? t('mandatoryFields')
                : tCommon('note.mandatory')
            }
          />
        </div>

        {/* Row 1 — Type Code + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div className="space-y-1.5">
            <Label
              htmlFor="emp-type-code"
              required
              className="block text-xs font-semibold text-black"
            >
              {t('labels.typeCode')}
            </Label>
            <div className="relative">
              <Hash
                size={14}
                className="absolute left-3 top-3 text-black/60 pointer-events-none z-10"
              />
              <Input
                naked
                id="emp-type-code"
                name="employeeTypeCode"
                type="text"
                value={form.employeeTypeCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onBlur={() => handleBlur('employeeTypeCode')}
                placeholder={t('placeholders.typeCode')}
                maxLength={20}
                className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 font-mono tracking-wider uppercase font-semibold ${
                  errors.employeeTypeCode
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20 text-black'
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 text-black'
                }`}
              />
            </div>
            <ValidationMessage
              message={errors.employeeTypeCode}
              visible={Boolean(errors.employeeTypeCode)}
              type="error"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="block text-xs font-semibold text-black">{t('labels.status')}</Label>
            <div
              className={`w-full h-[38px] flex items-center justify-between px-3.5 rounded-xl border transition-all ${
                form.isActive
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span
                className={`text-xs font-semibold ${form.isActive ? 'text-emerald-700' : 'text-black'}`}
              >
                {form.isActive ? tCommon('status.active') : tCommon('status.inactive')}
              </span>
              <ToggleSwitch
                checked={form.isActive}
                onChange={handleStatusToggle}
                showPopup={false}
              />
            </div>
          </div>
        </div>

        {/* Row 2 — Type Name (English) */}
        <div className="space-y-1.5">
          <Label
            htmlFor="emp-type-name"
            required
            className="block text-xs font-semibold text-black"
          >
            {t('labels.typeName')}
          </Label>
          <div className="relative">
            <Briefcase
              size={14}
              className="absolute left-3 top-3 text-black/60 pointer-events-none z-10"
            />
            <Input
              naked
              id="emp-type-name"
              name="employeeTypeName"
              type="text"
              value={form.employeeTypeName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => handleBlur('employeeTypeName')}
              placeholder={t('placeholders.typeName')}
              maxLength={100}
              className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 text-black ${
                errors.employeeTypeName
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>
          <ValidationMessage
            message={errors.employeeTypeName}
            visible={Boolean(errors.employeeTypeName)}
            type="error"
          />
        </div>

        {/* Row 3 — Type Name (Marathi) */}
        <div className="space-y-1.5">
          <Label
            htmlFor="emp-type-marathi"
            required
            className="block text-xs font-semibold text-black"
          >
            {t('labels.typeNameMarathi')}
          </Label>
          <div className="relative">
            <Languages
              size={14}
              className="absolute left-3 top-3 text-black/60 pointer-events-none z-10"
            />
            <PTISTransliteratedInput
              id="emp-type-marathi"
              name="employeeTypeNameMarathi"
              type="text"
              value={form.employeeTypeNameMarathi}
              onChange={(e) => handleMarathiNameChange(e.target.value)}
              onBlur={() => handleBlur('employeeTypeNameMarathi')}
              placeholder={t('placeholders.typeNameMarathi')}
              maxLength={100}
              className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 text-black ${
                errors.employeeTypeNameMarathi
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>
          <ValidationMessage
            message={errors.employeeTypeNameMarathi}
            visible={Boolean(errors.employeeTypeNameMarathi)}
            type="error"
          />
        </div>

      </form>
    </Drawer>
  );
}

export default EmpTypeForm;
export { EmpTypeForm as EmpTypeMasterFormDrawer };
export type { EmpTypeFormProps as EmpTypeMasterFormDrawerProps };
