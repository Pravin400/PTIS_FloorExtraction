'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MasterTable, Column } from '@/components/common/MasterTable';
import type { OldFloorDetailsData, OldDetailsData } from '@/types/ptis.types';
import { Loader2 } from 'lucide-react';

export interface IndividualOldFloorDetailsTableProps {
  showOldFloorInfo: boolean;
  oldFloorTableData?: OldFloorDetailsData[];
  currentDetails?: OldDetailsData | null;
  isLoading?: boolean;
}

export const IndividualOldFloorDetailsTable: React.FC<IndividualOldFloorDetailsTableProps> = ({
  showOldFloorInfo,
  oldFloorTableData = [],
  currentDetails,
  isLoading = false,
}) => {
  const t = useTranslations('ptis');
  const tInd = useTranslations('individual');

  const title =
    (typeof tInd?.has === 'function' && tInd.has('oldDetails.oldFloorDetails')
      ? tInd('oldDetails.oldFloorDetails')
      : '') || 'Old Floor Details';

  // Fallback data for old floor details table if list is empty but summary has data
  const tableData = useMemo(() => {
    const floors = Array.isArray(oldFloorTableData) ? oldFloorTableData : [];
    if (floors.length > 0) return floors;

    if (currentDetails?.oldConstructionYear || currentDetails?.oldCarpetAreaSqMeter) {
      return [
        {
          wardPropPartNo: '',
          floor: '0',
          subFloor: '',
          assessmentYear: '',
          year: currentDetails.oldConstructionYear || '',
          constructionType: currentDetails.oldConstructionTypeId || '',
          typeOfUse: currentDetails.oldTypeOfUseId || '',
          subType: '',
          carpetArea: `${currentDetails.oldCarpetAreaSqFeet || 0} / ${currentDetails.oldCarpetAreaSqMeter || 0}`,
          builtupArea: `${currentDetails.oldBuiltupAreaSqFeet || 0} / ${currentDetails.oldBuiltupAreaSqMeter || 0}`,
        },
      ];
    }
    return [];
  }, [oldFloorTableData, currentDetails]);

  const oldFloorColumns: Column<Record<string, unknown>>[] = [
    { key: 'wardPropPartNo', label: t('fields.wardPropPartNo') },
    { key: 'floor', label: t('fields.floor') },
    { key: 'subFloor', label: t('fields.subFloor') },
    { key: 'assessmentYear', label: t('fields.assmtYear') },
    { key: 'year', label: t('fields.constYear') },
    { key: 'constructionType', label: t('fields.constType') },
    { key: 'typeOfUse', label: t('fields.typeOfUse') },
    { key: 'subType', label: t('fields.subType') },
    { key: 'carpetArea', label: t('fields.carpetAreaSqFtMtr') },
    { key: 'builtupArea', label: t('fields.builtupAreaSqFtMtr') },
  ];

  if (!showOldFloorInfo) return null;

  return (
    <div className="w-full mt-2">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {title}
            </span>
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
          </div>
          {!isLoading && (
            <span className="text-[11px] font-medium text-slate-500">
              {tableData.length} {tableData.length === 1 ? 'record' : 'records'}
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-xs font-medium text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <span>Loading historical floor details...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <MasterTable<Record<string, unknown>>
              data={tableData as unknown as Record<string, unknown>[]}
              columns={oldFloorColumns}
              emptyText={t('fields.noFloorDetails')}
              paginationConfig={{ enabled: false }}
              maxBodyHeightClassName="max-h-[180px] xl:max-h-[240px]"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualOldFloorDetailsTable;
