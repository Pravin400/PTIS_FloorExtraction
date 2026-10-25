'use client';

import React from 'react';
import { SearchWingWiseFilters } from '@/types/property-tax/apartment';
import { PtisPaginationInfo } from '@/hooks/property-tax/apartment';
import { ChevronDown, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { WingWiseWingDetails } from '@/types/property-tax/apartment';
import { formatFloorLabel } from '@/lib/utils/ptis-floor.utils';
import { useTranslations, useLocale } from 'next-intl';

interface PtisSearchHeaderFiltersProps {
  filters: SearchWingWiseFilters;
  paginationInfo?: PtisPaginationInfo;
  onFilterChange: (filters: SearchWingWiseFilters) => void;
  onSearch: (updatedFilters?: SearchWingWiseFilters) => void;
  onRestoreAll?: () => void;
  hiddenPanelsCount?: number;
  wings?: WingWiseWingDetails[];
  availableFloors?: string[];
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const PtisSearchHeaderFilters: React.FC<PtisSearchHeaderFiltersProps> = ({
  filters,
  paginationInfo: _paginationInfo,
  onFilterChange,
  onSearch,
  onRestoreAll,
  hiddenPanelsCount = 0,
  wings = [],
  availableFloors = [],
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const t = useTranslations('ptisRedesign.headerFilters');
  const locale = useLocale();
  const floorList = availableFloors;

  const selectedWingIndex = React.useMemo(() => {
    if (!wings || wings.length === 0) return 0;
    const idx = wings.findIndex((w) => {
      if (filters.wingDetailId != null && w.wingDetailId != null && Number(w.wingDetailId) === Number(filters.wingDetailId)) {
        return true;
      }
      if (filters.wingId != null) {
        if (w.wingMasterId != null && Number(w.wingMasterId) === Number(filters.wingId)) return true;
        if (w.wingId != null && Number(w.wingId) === Number(filters.wingId)) return true;
      }
      if (filters.wingName && (w.wingName === filters.wingName || w.wingNo === filters.wingName)) {
        return true;
      }
      return false;
    });
    return idx >= 0 ? idx : 0;
  }, [wings, filters.wingDetailId, filters.wingId, filters.wingName]);

  return (
    <div className="px-6 py-2 flex items-center justify-between gap-4 flex-wrap bg-white">
      {/* Left: Filter Dropdowns */}
      <div className="flex items-center gap-3.5 flex-wrap">
        {/* Select Wing */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('selectWing') || 'SELECT WING'}</span>
          <div className="relative">
            <select
              value={selectedWingIndex}
              onChange={(e) => {
                const selectedIdx = Number(e.target.value);
                const matched = wings[selectedIdx];
                if (!matched) return;

                const wMasterId = matched.wingMasterId ?? (typeof matched.wingId === 'number' ? matched.wingId : null);
                const wDetailId = matched.wingDetailId ?? null;
                const socId = matched.societyId ?? filters.societyId ?? null;
                const wName = matched.wingName || matched.wingNo || null;

                const updatedFilters: SearchWingWiseFilters = {
                  ...filters,
                  wingId: wMasterId,
                  wingDetailId: wDetailId,
                  societyId: socId,
                  wingName: wName,
                  floor: null,
                  pageNumber: 1,
                  pageSize: 100,
                };
                onFilterChange(updatedFilters);
                onSearch(updatedFilters);
              }}
              className="appearance-none pl-3 pr-7 py-1 rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {wings.map((w, idx) => (
                <option key={w.wingDetailId ?? w.wingMasterId ?? idx} value={idx}>
                  {w.wingName || `${w.wingNo} Wing`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Select Floor */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('selectFloor') || 'SELECT FLOOR'}</span>
          <div className="relative">
            <select
              value={filters.floor ?? ''}
              onChange={(e) => {
                const val = e.target.value || null;
                const updatedFilters: SearchWingWiseFilters = {
                  ...filters,
                  floor: val,
                  pageNumber: 1,
                };
                onFilterChange(updatedFilters);
                onSearch(updatedFilters);
              }}
              className="appearance-none pl-3 pr-7 py-1 rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">{t('allFloors') || 'All Floors'}</option>
              {floorList.map((flr) => (
                <option key={flr} value={flr}>
                  {formatFloorLabel(flr, locale)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right: Quick Actions & Restore All Tables Button */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => onRestoreAll?.()}
          className={cn(
            'border rounded-full px-4 py-1 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer',
            hiddenPanelsCount > 0
              ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              : 'border-blue-600 text-blue-700 bg-white hover:bg-blue-50 active:bg-blue-100'
          )}
          title={t('restoreTooltip') || 'Restore all hidden / maximized comparison tables'}
        >
          <RotateCcw className={cn('w-3.5 h-3.5', hiddenPanelsCount > 0 ? 'text-white' : 'text-blue-700')} />
          <span>{t('restoreAllTables') || 'Restore All Tables'} {hiddenPanelsCount > 0 ? `(${hiddenPanelsCount})` : ''}</span>
        </button>

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={cn(
              'border rounded-full px-3.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer',
              isFullscreen
                ? 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900'
                : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200'
            )}
            title={isFullscreen ? (t('collapseTooltip') || 'Collapse / Exit Full Screen (Esc)') : (t('fullScreenTooltip') || 'Expand All Tables to Full Screen')}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white" />
                <span>{t('collapse') || 'Collapse'}</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                <span>{t('fullScreen') || 'Full Screen'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
