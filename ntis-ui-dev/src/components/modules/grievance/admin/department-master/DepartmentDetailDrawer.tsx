'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Building2,
  FileText,
  Calendar,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Button } from '@/components/common';
import type { GrievanceDepartment } from '@/types/grievance/department-master.types';

interface DepartmentDetailDrawerProps {
  isOpen: boolean;
  department: GrievanceDepartment | null;
  onClose: () => void;
  onEditClick: (dept: GrievanceDepartment) => void;
  onAddGrievanceType?: (departmentId: string, typeName: string) => Promise<void> | void;
  onRemoveGrievanceType?: (departmentId: string, typeName: string) => Promise<void> | void;
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const ts = new Date(dateStr).getTime();
  return !isNaN(ts) && ts > 0 ? new Date(ts).toLocaleDateString() : '-';
}

export function DepartmentDetailDrawer({
  isOpen,
  department,
  onClose,
  onEditClick,
  onAddGrievanceType,
  onRemoveGrievanceType,
}: DepartmentDetailDrawerProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [isSubmittingType, setIsSubmittingType] = useState(false);

  // Reset inline-add form when selected department changes or drawer opens/closes
  const deptDrawerKey = `${isOpen}-${department?.id || ''}`;
  const [prevDeptDrawerKey, setPrevDeptDrawerKey] = useState(deptDrawerKey);
  if (prevDeptDrawerKey !== deptDrawerKey) {
    setPrevDeptDrawerKey(deptDrawerKey);
    setIsAddingType(false);
    setNewTypeName('');
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !department) return null;

  const createdDate = formatDisplayDate(department.createdAt);
  const updatedDate = formatDisplayDate(department.updatedAt);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-250"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-black text-emerald-700 uppercase tracking-wider block">
                #{department.code || department.id}
              </span>
              <h3 id="drawer-title" className="text-base font-black text-slate-900 truncate">
                {locale === 'mr' ? department.nameMr : department.nameEn}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Pencil}
              onClick={() => {
                onClose();
                onEditClick(department);
              }}
              className="text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-50"
            >
              {t('editDepartment')}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Status & ID Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                {t('departmentCode')}
              </span>
              <span className="text-xs font-black text-slate-800 font-mono">
                {department.code || department.id}
              </span>
            </div>
            <Badge
              variant={department.isActive ? 'success' : 'default'}
              className={`text-xs font-bold px-2.5 py-1 ${
                department.isActive
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {department.isActive ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {t('active')}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-slate-500" />
                  {t('inactive')}
                </span>
              )}
            </Badge>
          </div>

          {/* Bilingual Names */}
          <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5 bg-white shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              {t('departmentOverview')}
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">{t('departmentNameEn')}:</span>
                <span className="font-bold text-slate-900">{department.nameEn}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">{t('departmentNameMr')}:</span>
                <span className="font-black text-slate-900 font-devanagari">{department.nameMr}</span>
              </div>
            </div>
            {department.description && (
              <p className="text-xs text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
                {locale === 'mr' && department.descriptionMr ? department.descriptionMr : department.description}
              </p>
            )}
          </div>

          {/* Associated Grievance Types (Pattern 1) */}
          <div className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-white shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {t('associatedGrievanceTypes')} ({(department.grievanceTypes || []).length})
                </span>
              </span>
              {!isAddingType && onAddGrievanceType && Boolean(department?.id && Number(department.id) > 0) && (
                <button
                  type="button"
                  onClick={() => setIsAddingType(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-200/80 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>{t('addGrievanceType')}</span>
                </button>
              )}
            </div>

            {/* Inline Add Form */}
            {isAddingType && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newTypeName.trim() || isSubmittingType || !department?.id || Number(department.id) <= 0) return;
                  setIsSubmittingType(true);
                  try {
                    await onAddGrievanceType?.(department.id, newTypeName.trim());
                    setNewTypeName('');
                    setIsAddingType(false);
                  } finally {
                    setIsSubmittingType(false);
                  }
                }}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-emerald-200 animate-in fade-in duration-150"
              >
                <input
                  type="text"
                  autoFocus
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder={t('grievanceTypePlaceholder')}
                  disabled={isSubmittingType}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
                <button
                  type="submit"
                  disabled={!newTypeName.trim() || isSubmittingType || !department?.id || Number(department.id) <= 0}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title={t('save')}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{t('save')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingType(false);
                    setNewTypeName('');
                  }}
                  disabled={isSubmittingType}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                  title={t('cancel')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Grievance Types Chips */}
            <div className="flex flex-wrap gap-1.5">
              {department.grievanceTypes && department.grievanceTypes.length > 0 ? (
                department.grievanceTypes.map((type, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-xs font-bold text-emerald-900 group hover:border-emerald-300 transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{type}</span>
                    {onRemoveGrievanceType && (
                      <button
                        type="button"
                        onClick={() => onRemoveGrievanceType(department.id, type)}
                        className="text-emerald-400 hover:text-rose-600 hover:bg-rose-50 rounded-md p-0.5 transition-colors cursor-pointer ml-0.5"
                        title={t('removeType')}
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">{t('noSpecificTypes')}</span>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{t('createdDate', { date: createdDate })}</span>
            </span>
            <span>{t('updatedDate', { date: updatedDate })}</span>
          </div>
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} className="font-bold text-xs rounded-xl px-4 py-2">
            {t('close')}
          </Button>
        </div>
      </aside>
    </>
  );
}
