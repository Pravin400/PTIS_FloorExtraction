'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MasterTable, Column } from '@/components/common/MasterTable';
import type { MappedPropertyItem } from '@/types/ptis.types';
import { Loader2 } from 'lucide-react';

export interface IndividualOldMapDetailsTableProps {
  showOldMapInfo: boolean;
  mappedPropertiesData?: MappedPropertyItem[];
  isLoading?: boolean;
}

export const IndividualOldMapDetailsTable: React.FC<IndividualOldMapDetailsTableProps> = ({
  showOldMapInfo,
  mappedPropertiesData = [],
  isLoading = false,
}) => {
  const t = useTranslations('ptis');
  const tInd = useTranslations('individual');

  const title =
    (typeof tInd?.has === 'function' && tInd.has('oldDetails.oldMapDetails')
      ? tInd('oldDetails.oldMapDetails')
      : '') || 'Mapped Properties Details';

  const oldMapTableData = useMemo(() => {
    return (mappedPropertiesData || []).filter(Boolean).map((item) => {
      const oldPropPartNo = `${item.oldPropertyNo || ''}${item.oldPartitionNo ? ` - ${item.oldPartitionNo}` : ''}`;
      const oldWardPropPartNo = [item.oldWardNo, oldPropPartNo].filter(Boolean).join(' - ');
      return {
        ...item,
        oldWardPropPartNo,
      };
    });
  }, [mappedPropertiesData]);

  const oldMapColumns: Column<Record<string, unknown>>[] = [
    { key: 'mappingCategory', label: t('fields.mappingCategory') },
    { key: 'oldZoneNo', label: t('fields.oldZoneName') },
    { key: 'oldWardPropPartNo', label: t('fields.oldWardPropPartNo') },
    { key: 'oldEgovNo', label: t('fields.oldEGovNo') },
    { key: 'oldPlotArea', label: t('fields.oldPlotAreaSqMtr') },
    { key: 'oldPlotNo', label: t('fields.oldPlotNo') },
    { key: 'oldConstructionArea', label: t('fields.oldConstAreaSqMtr') },
    { key: 'oldALV', label: t('fields.oldALV') },
    { key: 'oldRV', label: t('fields.oldRV') },
    { key: 'oldGeneralTax', label: t('fields.oldPropTax') },
    { key: 'oldTotalTax', label: t('fields.oldTotalTax') },
  ];

  if (!showOldMapInfo) return null;

  return (
    <div className="w-full mt-2">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {title}
            </span>
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />}
          </div>
          {!isLoading && (
            <span className="text-[11px] font-medium text-slate-500">
              {oldMapTableData.length} {oldMapTableData.length === 1 ? 'record' : 'records'}
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-xs font-medium text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <span>Loading mapped properties...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <MasterTable<Record<string, unknown>>
              data={oldMapTableData as unknown as Record<string, unknown>[]}
              columns={oldMapColumns}
              emptyText={t('fields.noMapDetails')}
              paginationConfig={{ enabled: false }}
              maxBodyHeightClassName="max-h-[180px] xl:max-h-[240px]"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualOldMapDetailsTable;
