'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { EmpStatusMasterItem, EmpStatusMasterPayload } from '@/types/payroll/MasterModule';
import {
  Drawer,
  Input,
  TextArea,
  Label,
  PTISTransliteratedInput,
  ToggleSwitch,
  RequiredFieldsNote,
  ValidationMessage,
  CancelButton,
  SaveButton,
} from '@/components/common';
import { UserCheck, Hash, Languages, FileText } from 'lucide-react';
import { useEmpStatusForm } from '@/hooks/payroll/emp-status-master';

export interface EmpStatusFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmpStatusMasterPayload) => Promise<boolean | void> | void;
  initialItem?: EmpStatusMasterItem | null;
  existingItems?: EmpStatusMasterItem[];
  existingCodes?: string[];
}

export function EmpStatusForm({
  isOpen,
  onClose,
  onSave,
  initialItem,
  existingItems,
  existingCodes,
}: EmpStatusFormProps): React.ReactElement | null {
  const tCommon = useTranslations('common');
  const {
    form,
    errors,
    isEdit,
    t,
    handleBlur,
    handleCodeChange,
    handleStatusChange,
    handleMarathiStatusChange,
    handleDescriptionChange,
    handleStatusToggle,
    handleSubmit,
    isSubmitting,
  } = useEmpStatusForm({
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
        <UserCheck size={20} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-blue-900 leading-tight">
            {isEdit ? t('editTitle') : t('addTitle')}
          </h2>
          {isEdit && (
            <span className="hidden xs:inline-block font-mono text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
              {initialItem?.employeeStatusCode}
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
        form="emp-status-form"
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
        id="emp-status-form"
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

        {/* Row 1 — Status Code + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div className="space-y-1.5">
            <Label
              htmlFor="emp-status-code"
              required
              className="block text-xs font-semibold text-black"
            >
              {t('labels.statusCode')}
            </Label>
            <div className="relative">
              <Hash
                size={14}
                className="absolute left-3 top-3 text-black/60 pointer-events-none z-10"
              />
              <Input
                naked
                id="emp-status-code"
                name="employeeStatusCode"
                type="text"
                value={form.employeeStatusCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onBlur={() => handleBlur('employeeStatusCode')}
                placeholder={t('placeholders.statusCode')}
                maxLength={20}
                className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 font-mono tracking-wider uppercase font-semibold ${
                  errors.employeeStatusCode
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20 text-black'
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 text-black'
                }`}
              />
            </div>
            <ValidationMessage
              message={errors.employeeStatusCode}
              visible={Boolean(errors.employeeStatusCode)}
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

        {/* Row 2 — Status Name (English) */}
        <div className="space-y-1.5">
          <Label
            htmlFor="emp-status-name"
            required
            className="block text-xs font-semibold text-black"
          >
            {t('labels.statusName')}
          </Label>
          <div className="relative">
            <UserCheck
              size={14}
              className="absolute left-3 top-3 text-black/60 pointer-events-none z-10"
            />
            <Input
              naked
              id="emp-status-name"
              name="employeeStatus"
              type="text"
              value={form.employeeStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              onBlur={() => handleBlur('employeeStatus')}
              placeholder={t('placeholders.statusName')}
              maxLength={100}
              className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 text-black ${
                errors.employeeStatus
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>
          <ValidationMessage
            message={errors.employeeStatus}
            visible={Boolean(errors.employeeStatus)}
            type="error"
          />
        </div>

        {/* Row 3 — Status Name (Marathi) */}
        <div className="space-y-1.5">
          <Label
            htmlFor="emp-status-marathi"
            required
            className="block text-xs font-semibold text-black"
          >
            {t('labels.statusNameMarathi')}
          </Label>
          <div className="relative">
            <Languages
              size={14}
              className="absolute left-3 top-3 text-black/60 pointer-events-none z-10"
            />
            <PTISTransliteratedInput
              id="emp-status-marathi"
              name="employeeStatusMarathi"
              type="text"
              value={form.employeeStatusMarathi}
              onChange={(e) => handleMarathiStatusChange(e.target.value)}
              onBlur={() => handleBlur('employeeStatusMarathi')}
              placeholder={t('placeholders.statusNameMarathi')}
              maxLength={100}
              className={`w-full h-[38px] py-2 text-xs rounded-xl border transition-all bg-white placeholder:text-black/40 focus:outline-none focus:ring-2 pl-9 text-black ${
                errors.employeeStatusMarathi
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-400/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>
          <ValidationMessage
            message={errors.employeeStatusMarathi}
            visible={Boolean(errors.employeeStatusMarathi)}
            type="error"
          />
        </div>

        {/* Row 4 — Description */}
        <div className="space-y-1.5">
          <Label
            htmlFor="emp-status-description"
            className="block text-xs font-semibold text-black"
          >
            {t('labels.description')}
          </Label>
          <div className="relative">
            <FileText
              size={14}
              className="absolute left-3 top-3 text-black/60 pointer-events-none z-10"
            />
            <TextArea
              id="emp-status-description"
              name="description"
              rows={3}
              value={form.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder={t('placeholders.description')}
              maxLength={250}
              showCharCount
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 pl-9 placeholder:text-black/40 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 text-black resize-none"
            />
          </div>
        </div>
      </form>
    </Drawer>
  );
}

export default EmpStatusForm;
export { EmpStatusForm as EmpStatusMasterFormDrawer };
export type { EmpStatusFormProps as EmpStatusMasterFormDrawerProps };
