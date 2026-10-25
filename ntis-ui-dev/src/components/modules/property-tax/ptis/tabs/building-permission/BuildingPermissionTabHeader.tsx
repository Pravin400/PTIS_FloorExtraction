'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Filter, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Select, type Option } from '@/components/common';

export interface BuildingPermissionTabHeaderProps {
  certificateTypeOptions?: Option[];
  selectedCertType?: string;
  onFilterSelect?: (val: string) => void;
  onClearFilter?: () => void;
  onEdit?: () => void;
  isEditing?: boolean;
  filterMode?: 'all' | 'attached';
  totalCount?: number;
  attachedCount?: number;
  onFilterChange?: (mode: 'all' | 'attached') => void;
}

export const BuildingPermissionTabHeader: React.FC<BuildingPermissionTabHeaderProps> = ({
  certificateTypeOptions = [],
  selectedCertType = 'ALL',
  onFilterSelect,
  onClearFilter,
  onEdit,
  isEditing = false,
}) => {
  const t = useTranslations('ptis');

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-1.5 mb-2 flex items-center justify-between gap-3 flex-wrap">
      {/* Left: Certificate Type Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {certificateTypeOptions.length > 0 && (
          <>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {t('building.filters') || 'FILTERS'}:
            </span>
            <div className="w-56 sm:w-64">
              <Select
                options={certificateTypeOptions}
                value={selectedCertType}
                onChange={(_, val) => onFilterSelect?.(val)}
                selectSize="sm"
                className="bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-xs hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20"
                placeholder={t('building.allCertificates') || 'All Certificates'}
                ariaLabel={t('building.allCertificates') || 'All Certificates'}
              />
            </div>
            {selectedCertType !== 'ALL' && onClearFilter && (
              <button
                type="button"
                onClick={onClearFilter}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                {t('building.clearFilter') || 'Clear Filter'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Right: QDE Edit Button */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={isEditing}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 shadow-2xs shrink-0',
            isEditing
              ? 'bg-amber-500 text-white border-amber-500 cursor-wait'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 cursor-pointer'
          )}
          title={t('building.editBuildingPermission') || 'Edit Building Permission'}
          aria-label={t('building.editBuildingPermission') || 'Edit Building Permission'}
        >
          {isEditing ? (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
          ) : (
            <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0" />
          )}
          <span>{isEditing ? (t('building.editing') || 'Opening...') : (t('building.edit') || 'Edit')}</span>
        </button>
      )}
    </div>
  );
};
