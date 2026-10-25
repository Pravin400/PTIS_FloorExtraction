'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Search,
  Building2,
  X,
  FilterX,
} from 'lucide-react';
import { Input } from '@/components/common/Input';
import type { MunicipalDepartment } from '@/types/grievance';

import { useMunicipalDepartments } from '@/hooks/grievance/shared';
import { DepartmentCard } from './DepartmentCard';

import { formatDepartmentNavLabel } from '@/lib/utils/grievance';

const CATEGORY_THEMES: Record<string, { icon: string; bg: string }> = {
  engineering: { icon: '🏗️', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  'health-sanitation': { icon: '🧹', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  'water-sewerage': { icon: '💧', bg: 'bg-sky-50 text-sky-800 border-sky-200' },
  electrical: { icon: '⚡', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  environment: { icon: '🌳', bg: 'bg-teal-50 text-teal-800 border-teal-200' },
  'revenue-tax': { icon: '💰', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  'town-planning': { icon: '📐', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
  'social-welfare': { icon: '🤝', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
  administration: { icon: '🏛️', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
  emergency: { icon: '🚒', bg: 'bg-red-50 text-red-800 border-red-200' },
  transport: { icon: '🚌', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
};

const getCategoryTheme = (cat: string) =>
  CATEGORY_THEMES[cat] || { icon: '🏢', bg: 'bg-slate-100 text-slate-800 border-slate-200' };

interface MunicipalDepartmentsViewProps {
  onClose?: () => void;
  onSelectDepartment?: (dept: MunicipalDepartment) => void;
  onFileGrievanceForDept?: (dept: MunicipalDepartment) => void;
  className?: string;
  hideHeader?: boolean;
}

export function MunicipalDepartmentsView({
  onClose,
  onSelectDepartment,
  onFileGrievanceForDept,
  className = '',
  hideHeader = false,
}: MunicipalDepartmentsViewProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const { departments } = useMunicipalDepartments();
  const [searchQuery, setSearchQuery] = useState('');

  const totalCount = departments.length;
  const directoryTitle = formatDepartmentNavLabel(t('deptsDirectoryTitle'), totalCount, locale);

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter((dept) => {
      const matchEn = dept.nameEn.toLowerCase().includes(q);
      const matchMr = dept.nameMr ? dept.nameMr.toLowerCase().includes(q) : false;
      const matchSub = dept.subOffices.some((s) => s.toLowerCase().includes(q));
      const matchGrievance = dept.grievanceTypes.some((g) => g.toLowerCase().includes(q));
      const matchFields = dept.fields.some(
        (f) => f.key.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)
      );
      return matchEn || matchMr || matchSub || matchGrievance || matchFields;
    });
  }, [departments, searchQuery]);

  const handleDepartmentAction = (dept: MunicipalDepartment) => {
    if (onFileGrievanceForDept) {
      onFileGrievanceForDept(dept);
    } else if (onSelectDepartment) {
      onSelectDepartment(dept);
    }
  };

  return (
    <div
      className={`flex flex-col h-full w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden select-none font-sans ${className}`}
    >
      {/* 1. COMPACT HEADER */}
      <div className="shrink-0 p-3 sm:p-4 bg-white border-b border-slate-200/80 space-y-3">
        {!hideHeader && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate" suppressHydrationWarning>
                    {directoryTitle}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate hidden sm:block">
                  {t('allDeptsDescription', { count: departments.length })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer shrink-0 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchDeptsPlaceholder')}
            className="pl-9 pr-8 text-xs bg-slate-50 focus:bg-white border-slate-200 focus:border-emerald-500 rounded-xl h-9 transition-colors shadow-2xs"
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
      </div>

      {/* 2. MAIN CONTENT AREA (Scrollable Grid) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 pb-20 min-h-0 bg-slate-50/50">
        {/* Count Bar */}
        <div className="flex items-center justify-between text-[11.5px] text-slate-500 font-semibold px-0.5 mb-3">
          <span>
            {t('showingCountOfTotalDepts', {
              filtered: filteredDepartments.length,
              total: departments.length,
            })}
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer font-bold text-xs"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>{t('showAll')}</span>
            </button>
          )}
        </div>

        {filteredDepartments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
            <Building2 className="w-10 h-10 mx-auto opacity-30 text-slate-500" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">{t('noDeptsMatchSearch')}</p>
              <p className="text-xs text-slate-500">{t('tryDifferentKeywords')}</p>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors"
            >
              {t('resetSearch')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-2.5">
            {filteredDepartments.map((dept) => {
              const theme = getCategoryTheme(dept.category);
              return (
                <DepartmentCard
                  key={dept.id}
                  dept={dept}
                  theme={theme}
                  onSelect={handleDepartmentAction}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
