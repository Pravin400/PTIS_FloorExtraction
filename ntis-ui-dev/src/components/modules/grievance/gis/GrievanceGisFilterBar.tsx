'use client';

/**
 * Grievance GIS Filter Bar
 * Standard: Clean Architecture / ntis-ui
 * Dynamically renders Application search and cascading filter dropdowns.
 */

import { useMemo } from 'react';
import { Filter, RefreshCw, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
  GisGrievanceFilterGroupDto,
  GisGrievanceQueryParameters,
} from '@/types/grievance/grievance-gis.types';
import { GisSearchAutocomplete, GrievanceSummaryItem } from './GisSearchAutocomplete';

export type { GrievanceSummaryItem };

interface GrievanceGisFilterBarProps {
  filterGroups: GisGrievanceFilterGroupDto[];
  activeFilters: GisGrievanceQueryParameters;
  onFilterChange: (key: keyof GisGrievanceQueryParameters, value: number | string | undefined) => void;
  onResetFilters: () => void;
  onExportExcel: () => void;
  isExporting?: boolean;
  grievances?: GrievanceSummaryItem[];
  onSelectGrievance?: (grievanceId: number) => void;
}

export function GrievanceGisFilterBar({
  filterGroups,
  activeFilters,
  onFilterChange,
  onResetFilters,
  onExportExcel,
  isExporting = false,
  grievances = [],
  onSelectGrievance,
}: GrievanceGisFilterBarProps) {
  const t = useTranslations('grievance');

  const getMappedParamKey = (groupKey: string): keyof GisGrievanceQueryParameters => {
    switch (groupKey.toLowerCase()) {
      case 'zone':
      case 'zoneid':
        return 'zoneId';
      case 'ward':
      case 'wardid':
        return 'wardId';
      case 'department':
      case 'grievancedepartmentid':
        return 'grievanceDepartmentId';
      case 'type':
      case 'grievancetypeid':
        return 'grievanceTypeId';
      case 'state':
      case 'status':
      case 'currentstateid':
        return 'currentStateId';
      default:
        return groupKey as keyof GisGrievanceQueryParameters;
    }
  };

  const sortedFilterGroups = useMemo(() => {
    return [...filterGroups].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [filterGroups]);

  const isSearchFilter = (group: GisGrievanceFilterGroupDto) => {
    const key = group.filterKey?.toLowerCase() || '';
    const ctrl = group.controlType?.toUpperCase() || '';
    return key === 'searchterm' || key === 'grievanceno' || key.includes('search') || ctrl === 'SEARCH' || ctrl === 'TEXT';
  };

  const hasActiveFilters = Object.values(activeFilters).some(
    (v) => v !== undefined && v !== null && v !== ''
  );

  return (
    <div className="w-full relative z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 flex-wrap flex-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1 shrink-0">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>{t('gisFilters')}</span>
        </div>

        {/* Dynamic Filters rendered in DisplayOrder from DB */}
        {sortedFilterGroups.map((group) => {
          if (isSearchFilter(group)) {
            return (
              <GisSearchAutocomplete
                key={group.filterKey}
                placeholder={group.filterLabel ? `${group.filterLabel}...` : 'Search Application No...'}
                value={activeFilters.searchTerm}
                onChange={(val) => onFilterChange('searchTerm', val)}
                grievances={grievances}
                onSelectGrievance={onSelectGrievance}
              />
            );
          }

          const paramKey = getMappedParamKey(group.filterKey);
          const currentValue = activeFilters[paramKey];

          return (
            <div key={group.filterKey} className="relative min-w-[130px] max-w-[190px] flex-1">
              <select
                value={currentValue !== undefined && currentValue !== null ? String(currentValue) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onFilterChange(paramKey, val ? Number(val) : undefined);
                }}
                className="w-full text-xs font-medium bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors cursor-pointer truncate"
              >
                <option value="">{t('gisAllFilter', { label: group.filterLabel })}</option>
                {group.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                    {opt.count !== undefined && opt.count !== null ? ` (${opt.count})` : ''}
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            title="Reset all filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('gisReset')}</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onExportExcel}
        disabled={isExporting}
        className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50"
      >
        <Download className="w-3.5 h-3.5 text-emerald-600" />
        <span>{isExporting ? t('gisExporting') : t('gisExportExcel')}</span>
      </button>
    </div>
  );
}
