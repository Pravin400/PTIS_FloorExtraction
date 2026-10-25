'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { SearchInput, Select } from '@/components/common';
import { useQueryTransition } from '@/hooks/useQueryTransition';
import { Filter } from 'lucide-react';
import type { GrievanceCategoryFilterProps } from '@/types/grievance-category-master/grievanceCategory.types';

export function GrievanceCategoryFilter({
  initialSearch = '',
  initialDepartment = 'all',
  initialStatus = 'all',
  departments = [],
}: GrievanceCategoryFilterProps) {
  const { updateQueries } = useQueryTransition();
  const [searchValue, setSearchValue] = useState(initialSearch);
  const isFirstRender = useRef(true);
  const t = useTranslations('grievanceCategory.filters');

  // Debounced search
  useEffect(() => {
    // Only trigger update if searchValue is different from initialSearch
    // AND we are not on the first render skip
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (searchValue === initialSearch) {
      return;
    }

    const timer = setTimeout(() => {
      updateQueries({ search: searchValue, page: 1 });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, initialSearch, updateQueries]);

  const handleFilterUpdate = (updates: Record<string, string | number | boolean | null>) => {
    updateQueries({ ...updates, page: 1 });
  };

  const departmentOptions = [
    { label: t('allDepartments'), value: 'all' },
    ...departments
      .filter((d) => d && d.departmentId)
      .map((d) => ({
        label: d.departmentName || `${t('allDepartments')} #${d.departmentId}`,
        value: String(d.departmentId),
      })),
  ];

  const statusOptions = [
    { label: t('allStatus'), value: 'all' },
    { label: t('active'), value: 'active' },
    { label: t('inactive'), value: 'inactive' },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full">
      {/* Search Section - Expands to fill available space */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow min-w-0">
        {/* Filter Indicator - Visible on Tablet+ */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100/80 rounded-xl text-slate-500 text-[10px] font-bold uppercase tracking-wider shrink-0 border border-slate-200/60 shadow-sm">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="whitespace-nowrap">{t('filterBy')}</span>
        </div>

        {/* Full-width Search Input Container */}
        <div className="relative flex-grow min-w-0">
          <SearchInput
            value={searchValue}
            onChange={(val) => setSearchValue(val)}
            placeholder={t('searchPlaceholder')}
            className="!w-full mb-0 h-10 border-slate-200 bg-white rounded-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 shadow-sm"
          />
        </div>
      </div>

      {/* Secondary Filters Section - Adaptive Grid/Flex */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-2.5 w-full lg:w-auto shrink-0">
        <div className="w-full lg:w-48 xl:w-60 min-w-0">
          <Select
            options={departmentOptions}
            value={String(initialDepartment ?? 'all')}
            onChange={(_, val) => handleFilterUpdate({ department: val === 'all' ? null : val })}
            className="h-10 bg-white border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:border-slate-300 transition-all duration-200 cursor-pointer [&_button]:cursor-pointer"
          />
        </div>
        <div className="w-full lg:w-36 xl:w-44 min-w-0">
          <Select
            options={statusOptions}
            value={String(initialStatus ?? 'all')}
            onChange={(_, val) => handleFilterUpdate({ status: val === 'all' ? null : val })}
            className="h-10 bg-white border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:border-slate-300 transition-all duration-200 cursor-pointer [&_button]:cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
