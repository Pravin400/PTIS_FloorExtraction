'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import type { GrievanceDepartment } from '@/types/grievance/department-master.types';

interface DepartmentDeleteDialogProps {
  isOpen: boolean;
  department: GrievanceDepartment | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DepartmentDeleteDialog({
  isOpen,
  department,
  isLoading,
  onClose,
  onConfirm,
}: DepartmentDeleteDialogProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  if (!isOpen || !department) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 id="delete-dialog-title" className="text-base sm:text-lg font-black text-slate-900 leading-snug">
            {t('confirmDeleteTitle')}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t('confirmDeleteMessage')}
          </p>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">{t('departmentCode')}:</span>
              <span className="font-mono font-black text-slate-900">{department.code || department.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">{t('department')}:</span>
              <span className="font-black text-slate-800 text-right truncate max-w-[200px]">
                {locale === 'mr' ? department.nameMr : department.nameEn}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 font-bold text-xs rounded-xl"
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            icon={Trash2}
            className="px-4 py-2 font-black text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
          >
            {t('deleteDepartment')}
          </Button>
        </div>
      </div>
    </div>
  );
}
