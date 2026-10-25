'use client';

/**
 * Workbench Header & Common KPI Cards Component
 * Path: src/components/modules/grievance/admin/workbench/WorkbenchHeader.tsx
 *
 * Renders the top title and interactive common KPI Cards using @/components/common/DashboardCard.
 * Line ceiling: <= 160 lines.
 */

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import type { WorkbenchTab } from '@/hooks/grievance/admin/useWorkbench';

interface WorkbenchHeaderProps {
  activeTab: WorkbenchTab;
  onTabChange: (tab: WorkbenchTab) => void;
  totalCount: number;
  unassignedCount: number;
  assignedCount: number;
}

export function WorkbenchHeader({
  activeTab,
  onTabChange,
  totalCount,
  unassignedCount,
  assignedCount,
}: WorkbenchHeaderProps) {
  const t = useTranslations('grievance');

  return (
    <div className="space-y-4">
      {/* Top Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t('workbenchTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          {t('workbenchSubtitle')}
        </p>
      </div>

      {/* Option 1: Sleek Segmented Metric Pill Tabs matching Image 1 */}
      <div className="flex items-center gap-2.5 sm:gap-3 select-none overflow-x-auto pt-1 pb-0.5">
        {/* 1. All Complaints */}
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={cn(
            'inline-flex items-center gap-2 px-3.5 sm:px-4.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer border shadow-2xs',
            activeTab === 'all'
              ? 'bg-[#005B41] text-white border-[#005B41]'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
          )}
        >
          <span>{t('tabAll')}</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-black transition-colors',
              activeTab === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-[#EAF2FF] text-[#1A86E8]'
            )}
          >
            {totalCount}
          </span>
        </button>

        {/* 2. Unassigned Queue */}
        <button
          type="button"
          onClick={() => onTabChange('unassigned')}
          className={cn(
            'inline-flex items-center gap-2 px-3.5 sm:px-4.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer border shadow-2xs',
            activeTab === 'unassigned'
              ? 'bg-[#005B41] text-white border-[#005B41]'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
          )}
        >
          <span>{t('tabUnassigned')}</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-black transition-colors',
              activeTab === 'unassigned'
                ? 'bg-white/20 text-white'
                : 'bg-[#EAF2FF] text-[#1A86E8]'
            )}
          >
            {unassignedCount}
          </span>
        </button>

        {/* 3. Assigned In-Progress */}
        <button
          type="button"
          onClick={() => onTabChange('assigned')}
          className={cn(
            'inline-flex items-center gap-2 px-3.5 sm:px-4.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer border shadow-2xs',
            activeTab === 'assigned'
              ? 'bg-[#005B41] text-white border-[#005B41]'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
          )}
        >
          <span>{t('tabAssigned')}</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-black transition-colors',
              activeTab === 'assigned'
                ? 'bg-white/20 text-white'
                : 'bg-[#EAF2FF] text-[#1A86E8]'
            )}
          >
            {assignedCount}
          </span>
        </button>
      </div>
    </div>
  );
}
