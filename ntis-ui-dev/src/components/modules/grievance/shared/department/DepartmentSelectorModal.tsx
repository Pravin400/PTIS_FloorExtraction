'use client';

/**
 * DepartmentSelectorModal
 * Symmetrical Layer: src/components/modules/grievance/shared/department/
 *
 * High-performance, mobile-optimized modal rendered via React portal at z-[160].
 * Sits cleanly above the fixed Global Header (z-[100]) with backdrop-blur,
 * full touch target accessibility, and smooth entrance animation.
 */

import { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations, useLocale } from 'next-intl';
import { Search, Loader2, X, Building2, Check } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import type { MunicipalDepartment } from '@/types/grievance';

import { useMunicipalDepartments } from '@/hooks/grievance/shared';
import { GrievanceModalShell } from '../GrievanceModalShell';

import { DepartmentCategoryPillBar } from './DepartmentCategoryPillBar';
import { formatDepartmentNavLabel } from '@/lib/utils/grievance';

const subscribe = () => () => { };

export interface DepartmentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDepartment: (dept: MunicipalDepartment) => void;
  selectedDeptName?: string;
}

export function DepartmentSelectorModal({
  isOpen,
  onClose,
  onSelectDepartment,
  selectedDeptName,
}: DepartmentSelectorModalProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { departments, loading } = useMunicipalDepartments();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const totalCount = departments.length;
  const modalTitle = formatDepartmentNavLabel(t('selectDepartmentModalTitle'), totalCount, locale);
  const modalSubtitle = formatDepartmentNavLabel(t('selectDepartmentModalSubtitle'), totalCount, locale);

  // Lock body scroll and attach ESC key listener when open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      if (selectedCategory !== 'all' && dept.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          dept.nameEn.toLowerCase().includes(q) ||
          dept.nameMr.toLowerCase().includes(q) ||
          dept.subOffices?.some((s) => s.toLowerCase().includes(q)) ||
          dept.grievanceTypes?.some((g) => g.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [departments, searchQuery, selectedCategory]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <GrievanceModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      zIndex="z-[160]"
      ariaLabelledBy="dept-modal-title"
    >
      {/* Sticky Header with Title, Badges & 44px Touch Target Close Button */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm shrink-0 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 id="dept-modal-title" className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate" suppressHydrationWarning>
              {modalTitle}
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5" suppressHydrationWarning>
            {modalSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0 cursor-pointer active:scale-95"
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-slate-50/60 custom-scrollbar">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchDeptsPlaceholder')}
            className="pl-9 pr-8 text-xs bg-white border-slate-200 focus:bg-white rounded-xl h-10 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <DepartmentCategoryPillBar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          variant="modal"
        />

        {/* Department List */}
        <div className="space-y-2">
          {loading && departments.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-semibold">
                {t('loadingDepartments')}
              </span>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-medium">
              {t('noDepartmentsFound')}
            </div>
          ) : (
            filteredDepartments.map((dept) => {
              const isSelected =
                selectedDeptName === dept.nameEn || selectedDeptName === dept.nameMr;
              const deptTitle = dept.nameEn;

              return (
                <Card
                  key={dept.id}
                  onClick={() => {
                    onSelectDepartment(dept);
                    onClose();
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex flex-row items-center justify-between gap-2.5 active:scale-[0.99] ${isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/20'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7.5 h-7.5 rounded-lg bg-slate-100/90 border border-slate-200/80 flex items-center justify-center text-sm shrink-0 shadow-2xs">
                      {dept.icon || <Building2 className="w-3.5 h-3.5 text-slate-600" />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {deptTitle}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[9.5px] font-bold border-0 flex items-center gap-1">
                        <span>{t('selected')}</span>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </Badge>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 hover:underline">
                        {t('select')}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </GrievanceModalShell>,
    document.body
  );
}


