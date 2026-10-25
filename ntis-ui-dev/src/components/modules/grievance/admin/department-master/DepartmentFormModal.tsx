'use client';

import React, { useState } from 'react';
import { X, Building2, Check, FileText, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Input, ToggleSwitch } from '@/components/common';
import type {
  GrievanceDepartment,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@/types/grievance/department-master.types';

interface DepartmentFormModalProps {
  isOpen: boolean;
  department: GrievanceDepartment | null; // null for Create, object for Edit
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateDepartmentDto | UpdateDepartmentDto) => void;
}

export function DepartmentFormModal({
  isOpen,
  department,
  isSaving,
  onClose,
  onSubmit,
}: DepartmentFormModalProps) {
  const t = useTranslations('grievance');
  const isEditMode = Boolean(department);

  const [nameEn, setNameEn] = useState('');
  const [nameMr, setNameMr] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [grievanceTypes, setGrievanceTypes] = useState<string[]>([]);
  const [newTypeInput, setNewTypeInput] = useState('');
  const [typeError, setTypeError] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form fields when modal opens or department changes
  const formKey = `${isOpen}-${department?.id || 'new'}-${department?.updatedAt || ''}`;
  const [prevFormKey, setPrevFormKey] = useState(formKey);
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey);
    setNameEn(department?.nameEn || '');
    setNameMr(department?.nameMr || '');
    setIsActive(department?.isActive !== false);
    setGrievanceTypes(Array.isArray(department?.grievanceTypes) ? [...department.grievanceTypes] : []);
    setNewTypeInput('');
    setTypeError('');
    setErrors({});
  }

  const handleAddType = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTypeInput.trim();
    if (!trimmed) return;
    if (grievanceTypes.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTypeError(t('duplicateTypeWarning'));
      return;
    }
    setGrievanceTypes((prev) => [...prev, trimmed]);
    setNewTypeInput('');
    setTypeError('');
  };

  const handleRemoveType = (idxToRemove: number) => {
    setGrievanceTypes((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!nameEn.trim()) errs.nameEn = t('validationNameEnRequired');
    if (!nameMr.trim()) errs.nameMr = t('validationNameMrRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;

    // Auto-commit any non-empty buffer from newTypeInput
    const finalTypes = [...grievanceTypes];
    const pending = newTypeInput.trim();
    if (pending && !finalTypes.some((t) => t.toLowerCase() === pending.toLowerCase())) {
      finalTypes.push(pending);
    }

    onSubmit({
      ...(isEditMode && department ? { id: department.id } : {}),
      nameEn: nameEn.trim(),
      nameMr: nameMr.trim(),
      grievanceTypes: finalTypes,
      isActive,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl my-6 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="form-dialog-title" className="text-base font-black text-slate-900 leading-snug">
                {isEditMode ? t('editDepartment') : t('addDepartment')}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isEditMode
                  ? t('updateDeptSubtitle', { code: department?.nameEn || `#${department?.id}` })
                  : t('registerNewDeptSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - 100% SQL Server Schema Compliant */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Row 2: English Name & Marathi Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('departmentNameEn')} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={nameEn}
                onChange={(e) => {
                  setNameEn(e.target.value);
                  if (errors.nameEn) setErrors((prev) => ({ ...prev, nameEn: '' }));
                }}
                placeholder={t('deptNameEnPlaceholder')}
                className={`text-xs h-9 ${errors.nameEn ? 'border-rose-500' : ''}`}
              />
              {errors.nameEn && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.nameEn}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('departmentNameMr')} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={nameMr}
                onChange={(e) => {
                  setNameMr(e.target.value);
                  if (errors.nameMr) setErrors((prev) => ({ ...prev, nameMr: '' }));
                }}
                placeholder={t('deptNameMrPlaceholder')}
                className={`text-xs h-9 font-devanagari ${errors.nameMr ? 'border-rose-500' : ''}`}
              />
              {errors.nameMr && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.nameMr}</p>}
            </div>
          </div>

          {/* Row 3: Associated Grievance Types (Type of Use) Tag Manager */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
            <div>
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('modalGrievanceTypesLabel')}</span>
                {grievanceTypes.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {grievanceTypes.length}
                  </span>
                )}
              </label>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {t('modalGrievanceTypesSubtitle')}
              </p>
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newTypeInput}
                  onChange={(e) => {
                    setNewTypeInput(e.target.value);
                    if (typeError) setTypeError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddType(e);
                    }
                  }}
                  placeholder={t('addTypePlaceholder')}
                  className="w-full text-xs h-9 px-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={handleAddType}
                disabled={!newTypeInput.trim()}
                className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('addTypeBtn')}</span>
              </button>
            </div>
            {typeError && <p className="text-[10px] font-bold text-rose-500">{typeError}</p>}

            {/* Chips Container */}
            {grievanceTypes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {grievanceTypes.map((type, index) => (
                  <span
                    key={`${type}-${index}`}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-emerald-950 shadow-2xs group hover:border-emerald-300 transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{type}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveType(index)}
                      className="w-4 h-4 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      title={t('removeType')}
                      aria-label={`${t('removeType')} ${type}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                {t('noTypesAddedNote')}
              </p>
            )}
          </div>

          {/* Row 4: Status Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-800 block">{t('deptActiveStatus')}</span>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {t('deptActiveStatusNote')}
              </p>
            </div>
            <ToggleSwitch
              checked={isActive}
              onChange={setIsActive}
              activeLabel={t('active')}
              inactiveLabel={t('inactive')}
              showPopup={false}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 font-bold text-xs rounded-xl"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              disabled={isSaving}
              icon={Check}
              className="px-5 py-2 font-black text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              {isEditMode ? t('saveChanges') : t('save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
