'use client';

import { Plus, ChevronUp, Layers } from 'lucide-react';
import type { UnitPoolPanelHeaderProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function UnitPoolPanelHeader({
  poolCount = 0,
  savedCount = 0,
  t,
  isUnitGenerationEnabled,
  onToggle,
}: UnitPoolPanelHeaderProps) {
  const title = t?.('floorDetails.unitManagementPool') || 'Sub-Units & Rooms Pool';
  const subtitle = t?.('floorDetails.generateUnitsSubtitle') || 'Manage individual sub-units, assignments, and area distribution';
  const generateLabel = t?.('floorDetails.generateUnits') || 'Generate Units';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>{title}</span>
          {poolCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Layers className="size-3" />
              {t?.('floorDetails.totalCount', { count: poolCount }) || `${poolCount} total`}
            </span>
          )}
          {savedCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {t?.('floorDetails.savedCount', { count: savedCount }) || `${savedCount} saved`}
            </span>
          )}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      {onToggle && (
        <button
          type="button"
          onClick={() => onToggle((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
            isUnitGenerationEnabled
              ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
              : 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent'
          }`}
        >
          {isUnitGenerationEnabled ? (
            <>
              <ChevronUp className="size-3.5" />
              <span>{t?.('floorDetails.hideGenerator') || 'Hide Generator'}</span>
            </>
          ) : (
            <>
              <Plus className="size-3.5" />
              <span>{generateLabel}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
