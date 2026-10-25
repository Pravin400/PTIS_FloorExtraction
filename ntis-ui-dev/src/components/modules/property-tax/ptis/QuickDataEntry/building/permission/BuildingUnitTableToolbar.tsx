import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge, Label, SearchInput, Select } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import type { UnitSelectionItem, WingOption } from '@/types/building-permission.types';

interface BuildingUnitTableToolbarProps {
  filteredUnits: UnitSelectionItem[];
  activeWings: WingOption[];
  selectedUnitIds: Set<number>;
  unitSearchQuery: string;
  setUnitSearchQuery: (val: string) => void;
  wingFilter: string;
  setWingFilter: (val: string) => void;
  statusFilter: 'all' | 'direct' | 'wing' | 'apartment' | 'none';
  setStatusFilter: (val: 'all' | 'direct' | 'wing' | 'apartment' | 'none') => void;
  appliedUnitsCount: number;
  handleClearSelection: () => void;
  setSelectedWingDetailId: (id: number | null) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function BuildingUnitTableToolbar({
  filteredUnits,
  activeWings,
  selectedUnitIds,
  unitSearchQuery,
  setUnitSearchQuery,
  wingFilter,
  setWingFilter,
  statusFilter,
  setStatusFilter,
  appliedUnitsCount,
  handleClearSelection,
  setSelectedWingDetailId,
  t,
}: BuildingUnitTableToolbarProps): React.ReactElement {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t('building.selectUnits') || 'SELECT UNITS'}
          </Label>
          <span className="text-[11px] text-slate-500">
            {t('building.unitsInWing', { count: filteredUnits.length })}
          </span>
          <span className="text-[11px] text-blue-600 font-medium italic">
            {t('building.clickRowToSelect')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {appliedUnitsCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'direct' ? 'all' : 'direct')}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer border transition-all',
                statusFilter === 'direct'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              )}
              title={t('building.filterAppliedTooltip')}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>{t('building.appliedSeparately', { count: appliedUnitsCount })}</span>
            </button>
          )}

          {selectedUnitIds.size > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer border border-slate-300 transition-all"
            >
              {t('building.clearSelectedCount', { count: selectedUnitIds.size })}
            </button>
          )}

          <Badge variant="secondary" size="sm" className="bg-white text-slate-700 font-bold border border-slate-200">
            {t('building.selectedRatio', { selected: selectedUnitIds.size, total: filteredUnits.length })}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <SearchInput
            placeholder={t('building.searchUnitPlaceholder') || 'Search unit...'}
            value={unitSearchQuery}
            onChange={setUnitSearchQuery}
            className="w-full mb-0 text-xs"
          />
        </div>
        <Select
          options={activeWings.map((w) => ({ label: w.wingName, value: String(w.wingDetailId) }))}
          value={wingFilter}
          onChange={(_, val) => {
            setWingFilter(val);
            const matchedWing = activeWings.find((w) => String(w.wingDetailId) === val || w.wingName === val);
            if (matchedWing) {
              setSelectedWingDetailId(matchedWing.wingDetailId);
              if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                params.set('wingDetailId', String(matchedWing.wingDetailId));
                window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
              }
            }
          }}
          selectSize="sm"
          className="text-xs"
        />
        <Select
          options={[
            { label: t('building.allStatus') || 'All Status', value: 'all' },
            { label: t('building.appliedOnly') || 'Applied (Direct)', value: 'direct' },
            { label: t('building.wingCoveredOnly') || 'Wing Covered', value: 'wing' },
            { label: t('building.apartmentCoveredOnly') || 'Apartment Covered', value: 'apartment' },
            { label: t('building.notAppliedOnly') || 'Not Applied', value: 'none' },
          ]}
          value={statusFilter}
          onChange={(_, val) => setStatusFilter(val as typeof statusFilter)}
          selectSize="sm"
          className="text-xs"
        />
      </div>
    </>
  );
}
