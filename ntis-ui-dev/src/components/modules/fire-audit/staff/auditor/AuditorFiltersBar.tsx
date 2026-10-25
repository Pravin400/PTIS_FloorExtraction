"use client";

/**
 * Auditor Filters Bar Component
 * Path: src/components/modules/fire-audit/staff/auditor/AuditorFiltersBar.tsx
 *
 * Filter toolbar for fire audit applications dashboard.
 * Unifies search input to mount once in the DOM, with responsive desktop
 * inline filters panel and mobile bottom sheet modal.
 * Line ceiling: <= 300 lines.
 */

import { memo } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Button, Input } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import {
  AuditorDesktopFilters,
  AuditorMobileFiltersSheet,
  useAuditorFiltersBarState,
  type AuditorFiltersBarProps,
} from './filters';

export type { AuditorFiltersBarProps };

function AuditorFiltersBarComponent({
  filters,
  onApplyFilters,
  onResetFilters,
  lookups,
  className,
}: AuditorFiltersBarProps) {
  const state = useAuditorFiltersBarState({
    filters,
    onApplyFilters,
    onResetFilters,
    lookups,
  });

  const {
    t,
    searchTerm,
    setSearchTerm,
    activeCount,
    isDesktopExpanded,
    setIsDesktopExpanded,
    setIsMobileSheetOpen,
    handleApply,
  } = state;

  return (
    <>
      {/* Unified Toolbar Card: Single Input in DOM for both screen sizes */}
      <div
        className={cn(
          'w-full rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-3.5 shadow-2xs mb-2.5 animate-in fade-in slide-in-from-top-1 duration-150',
          className
        )}
      >
        {/* Desktop-only Header: Search & Filter Title + Desktop Filter Collapse Toggle */}
        <div className="hidden sm:flex items-center justify-between pb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>{t('title')}</span>
          </span>

          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsDesktopExpanded((prev) => !prev)}
            aria-expanded={isDesktopExpanded}
            aria-controls="auditor-desktop-filters-panel"
            className="inline-flex items-center !rounded-xl !border !border-sky-300 !bg-white hover:!bg-sky-50/70 !text-[#1A86E8] !px-2.5 !py-1 !text-xs !font-semibold transition-colors cursor-pointer !h-7.5 shadow-2xs whitespace-nowrap"
          >
            <span className="inline-flex flex-row items-center gap-1.5 whitespace-nowrap">
              <Filter className="h-3.5 w-3.5 text-[#1A86E8] shrink-0" />
              <span>{t('filterButton')}</span>
              {activeCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1A86E8] px-1 text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              )}
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-[#1A86E8] shrink-0 transition-transform duration-200',
                  isDesktopExpanded ? 'rotate-180' : ''
                )}
              />
            </span>
          </Button>
        </div>

        {/* Search Input Row - Exactly one Input element mounted in the DOM */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 z-10" />
            <Input
              fullWidth
              type="text"
              value={searchTerm}
              maxLength={100}
              onChange={(e) => setSearchTerm(e.target.value.slice(0, 100))}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              placeholder={t('placeholder')}
              className="h-9 sm:h-8.5 rounded-xl border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#1A86E8] focus:ring-1 focus:ring-[#1A86E8]"
            />
          </div>

          {/* Mobile-only Filter Button (triggers mobile bottom sheet) */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsMobileSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={state.isMobileSheetOpen}
            className="sm:hidden relative !h-9 inline-flex items-center !rounded-xl !border !border-sky-300 !bg-white hover:!bg-sky-50/70 !text-[#1A86E8] px-3 !text-xs !font-semibold shrink-0 cursor-pointer active:scale-95 transition-transform whitespace-nowrap shadow-2xs"
          >
            <span className="inline-flex flex-row items-center gap-1.5 whitespace-nowrap">
              <Filter className="h-3.5 w-3.5 text-[#1A86E8] shrink-0" />
              <span>{t('filterButton')}</span>
              {activeCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1A86E8] px-1 text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </span>
          </Button>
        </div>

        {/* Desktop Expanded Filters Row */}
        <AuditorDesktopFilters state={state} />
      </div>

      {/* Mobile Bottom Sheet Modal */}
      <AuditorMobileFiltersSheet state={state} />
    </>
  );
}

export const AuditorFiltersBar = memo(AuditorFiltersBarComponent);
