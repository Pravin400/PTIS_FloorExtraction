'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Plus } from 'lucide-react';

export interface BuildingPermissionEmptyStateProps {
  type: 'no-data' | 'filter-empty';
  onAddOrEdit?: () => void;
  onClearFilter?: () => void;
}

export const BuildingPermissionEmptyState: React.FC<BuildingPermissionEmptyStateProps> = ({
  type,
  onAddOrEdit,
  onClearFilter,
}) => {
  const t = useTranslations('ptisRedesign');

  if (type === 'no-data') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-300 gap-2">
        <AlertCircle className="w-8 h-8 text-slate-400" />
        <p className="text-xs font-bold text-slate-700">
          {t('buildingPermission.noDataAvailable') || 'No building permission or certificate records available'}
        </p>
        <p className="text-[11px] text-slate-500 max-w-md">
          {t('buildingPermission.noDataDescription') ||
            'No records have been filed yet for this apartment or wing. You can add building permissions and upload certificates through Quick Data Entry.'}
        </p>
        {onAddOrEdit && (
          <button
            type="button"
            onClick={onAddOrEdit}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0047cc] hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('buildingPermission.addPermission') || 'Add Building Permission'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-300 gap-2">
      <AlertCircle className="w-7 h-7 text-slate-400" />
      <p className="text-xs font-bold text-slate-700">
        {t('buildingPermission.noRecordsForFilter') || 'No records found for this certificate type'}
      </p>
      {onClearFilter && (
        <button
          type="button"
          onClick={onClearFilter}
          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
        >
          {t('buildingPermission.clearFilter') || 'Clear Filter'}
        </button>
      )}
    </div>
  );
};
