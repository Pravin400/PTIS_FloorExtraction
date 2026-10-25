'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Pencil, Filter, Layers, Home, Store, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Select, type Option } from '@/components/common';

export interface BuildingPermissionFilterBarProps {
  certificateTypeOptions: Option[];
  selectedCertTypeValue: string;
  selectedCertType: string;
  selectedLevel: string;
  levelCounts: { all: number; apartment: number; wing: number; unit: number; floor: number };
  hasFloorLevel: boolean;
  societyDetailId?: number | null;
  wingDetailsId?: number | null;
  isEditing?: boolean;
  onFilterSelect: (val: string) => void;
  onLevelSelect: (val: string) => void;
  onSetLevelAll: () => void;
  onClearAllFilters: () => void;
  onEditRecord: () => void;
}

export const BuildingPermissionFilterBar: React.FC<BuildingPermissionFilterBarProps> = ({
  certificateTypeOptions,
  selectedCertTypeValue,
  selectedCertType,
  selectedLevel,
  levelCounts,
  hasFloorLevel,
  societyDetailId,
  wingDetailsId,
  isEditing,
  onFilterSelect,
  onLevelSelect,
  onSetLevelAll,
  onClearAllFilters,
  onEditRecord,
}) => {
  const t = useTranslations('ptisRedesign');

  const renderScopeButton = (
    key: string,
    label: string,
    count: number,
    Icon: React.ComponentType<{ className?: string }>,
    onClick: () => void
  ) => {
    const isActive = key === 'ALL' ? selectedLevel === 'ALL' : selectedLevel.toLowerCase() === key.toLowerCase();
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex items-center gap-1.5 transition-all cursor-pointer select-none rounded-md px-3 py-1 text-xs',
          isActive
            ? 'bg-blue-600 text-white font-semibold shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
        )}
      >
        <Icon className={cn('w-3 h-3 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
        <span>{label}</span>
        <span
          className={cn(
            'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium leading-tight',
            isActive ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
          )}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-1.5 mb-2 flex items-center justify-between gap-3 flex-wrap">
      {/* Left: Certificate Type Filter Dropdown */}
      {certificateTypeOptions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {t('buildingPermission.filters') || 'FILTERS'}:
          </span>
          <div className="w-60 sm:w-68">
            <Select
              options={certificateTypeOptions}
              value={selectedCertTypeValue}
              onChange={(_, val) => onFilterSelect(val)}
              selectSize="sm"
              className="bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-xs hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20"
              placeholder={t('buildingPermission.selectCertificateType') || 'Select Certificate'}
              ariaLabel={t('buildingPermission.allCertificates') || 'All Certificates'}
            />
          </div>
        </div>
      )}

      {/* Right: Scope Filters & Actions */}
      <div className="flex items-center gap-2 ml-auto shrink-0 flex-wrap">
        {(selectedCertType !== 'ALL' || selectedLevel !== 'ALL') && (
          <button
            type="button"
            onClick={onClearAllFilters}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            {t('buildingPermission.clearFilter') || 'Clear Filter'}
          </button>
        )}

        {/* Scope Segmented Track */}
        <div className="bg-slate-200/60 p-1 rounded-lg flex items-center gap-1">
          {renderScopeButton(
            'ALL',
            t('buildingPermission.levels.allLevels') || t('buildingPermission.levels.all') || 'All Scopes',
            levelCounts.all,
            Layers,
            onSetLevelAll
          )}

          {(Boolean(societyDetailId && Number(societyDetailId) > 0) || levelCounts.apartment > 0) &&
            renderScopeButton(
              'Apartment',
              t('buildingPermission.levels.apartment') || 'Apartment Level',
              levelCounts.apartment,
              Building2,
              () => onLevelSelect('Apartment')
            )}

          {(Boolean(wingDetailsId && Number(wingDetailsId) > 0) || levelCounts.wing > 0 || Boolean(societyDetailId && Number(societyDetailId) > 0)) &&
            renderScopeButton(
              'Wing',
              t('buildingPermission.levels.wing') || 'Wing Level',
              levelCounts.wing,
              Home,
              () => onLevelSelect('Wing')
            )}

          {renderScopeButton(
            'Unit',
            t('buildingPermission.levels.unit') || 'Unit Level',
            levelCounts.unit,
            Store,
            () => onLevelSelect('Unit')
          )}

          {hasFloorLevel &&
            renderScopeButton(
              'Floor',
              t('buildingPermission.levels.floor') || 'Floor Level',
              levelCounts.floor,
              Layers,
              () => onLevelSelect('Floor')
            )}
        </div>

        {/* Edit Button */}
        <button
          type="button"
          onClick={onEditRecord}
          disabled={isEditing}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1 shadow-2xs shrink-0',
            isEditing
              ? 'bg-amber-500 text-white border-amber-500 cursor-wait'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 cursor-pointer'
          )}
          title={t('buildingPermission.actions.edit') || 'Edit'}
        >
          {isEditing ? (
            <Loader2 className="w-3 h-3 text-white animate-spin shrink-0" />
          ) : (
            <Pencil className="w-3 h-3 text-slate-400 group-hover:text-amber-600 shrink-0" />
          )}
          <span>{isEditing ? (t('buildingPermission.actions.editing') || 'Opening...') : (t('buildingPermission.actions.edit') || 'Edit')}</span>
        </button>
      </div>
    </div>
  );
};
