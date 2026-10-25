'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { OldTaxesData } from '@/types/ptis.types';
import { MasterTable, Column } from '@/components/common/MasterTable';
import { getTranslatedTaxLabel } from '@/lib/utils/ptis';
import { Loader2 } from 'lucide-react';

interface IndividualOldTaxDetailsTableProps {
  oldTaxesData: OldTaxesData | null | undefined;
  showOldTaxInfo: boolean;
  isLoading?: boolean;
}

export const IndividualOldTaxDetailsTable: React.FC<IndividualOldTaxDetailsTableProps> = ({
  oldTaxesData,
  showOldTaxInfo,
  isLoading = false,
}) => {
  const t = useTranslations('ptis');
  const tInd = useTranslations('individual');

  const title =
    (typeof tInd?.has === 'function' && tInd.has('oldDetails.oldTaxDetails')
      ? tInd('oldDetails.oldTaxDetails')
      : '') || 'Old Tax Details';

  // Collect unique tax names (excluding 'taxtotal') to define dynamic columns
  const uniqueTaxNames = useMemo(() => {
    if (!oldTaxesData || !Array.isArray(oldTaxesData.taxYears)) return [];
    const taxNames = new Set<string>();
    oldTaxesData.taxYears.forEach((yearData) => {
      if (yearData && Array.isArray(yearData.taxes)) {
        yearData.taxes.forEach((tax) => {
          const name = tax?.taxName;
          if (name && name.toLowerCase() !== 'taxtotal') {
            taxNames.add(name);
          }
        });
      }
    });
    return Array.from(taxNames);
  }, [oldTaxesData]);

  // Construct table columns
  const columns = useMemo(() => {
    const cols: Column<Record<string, unknown>>[] = [
      {
        key: 'wardPropPartNo',
        label: t('fields.wardPropPartNo'),
        align: 'left',
        width: '180px',
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap',
      },
      {
        key: 'year',
        label: t('fields.year'),
        align: 'center',
        width: '100px',
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap',
      },
    ];

    // Dynamic tax columns
    uniqueTaxNames.forEach((taxName) => {
      cols.push({
        key: taxName,
        label: getTranslatedTaxLabel(t, taxName),
        align: 'right',
        width: '120px',
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap font-medium',
      });
    });

    // Total tax column
    cols.push({
      key: 'taxTotal',
      label: t('fields.taxTotal'),
      align: 'right',
      width: '130px',
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap font-bold text-slate-900',
    });

    return cols;
  }, [uniqueTaxNames, t]);

  // Transform data for MasterTable
  const data = useMemo(() => {
    if (!oldTaxesData || !Array.isArray(oldTaxesData.taxYears)) return [];

    return oldTaxesData.taxYears.map((yearData) => {
      const wardNo = yearData.oldWardNo?.toString() ?? '';
      const propertyNo = yearData.oldPropertyNo ?? '';
      const partitionNo = yearData.oldPartitionNo?.toString() ?? '';
      const wardPropPartNo = [wardNo, propertyNo, partitionNo].filter(Boolean).join(' - ');

      const row: Record<string, unknown> = {
        wardPropPartNo,
        year: yearData.yearCode || yearData.year || '',
      };

      // Default all dynamic tax columns to 0
      uniqueTaxNames.forEach((name) => {
        row[name] = 0;
      });
      row['taxTotal'] = 0;

      // Populate actual values
      if (Array.isArray(yearData.taxes)) {
        yearData.taxes.forEach((tax) => {
          const name = tax?.taxName;
          if (name) {
            if (name.toLowerCase() === 'taxtotal') {
              row['taxTotal'] = tax.taxAmount;
            } else {
              row[name] = tax.taxAmount;
            }
          }
        });
      }

      return row;
    });
  }, [oldTaxesData, uniqueTaxNames]);

  if (!showOldTaxInfo) return null;

  return (
    <div className="mt-2 w-full">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {title}
            </span>
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />}
          </div>
          {!isLoading && (
            <span className="text-[11px] font-medium text-slate-500">
              {data.length} {data.length === 1 ? 'record' : 'records'}
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-xs font-medium text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <span>Loading historical tax breakdown...</span>
          </div>
        ) : !oldTaxesData || !oldTaxesData.taxYears || oldTaxesData.taxYears.length === 0 ? (
          <div className="p-4 text-center text-xs font-medium text-slate-500">
            {t('fields.noTaxDetails')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <MasterTable<Record<string, unknown>>
              data={data}
              columns={columns}
              emptyText={t('fields.noTaxDetails')}
              paginationConfig={{ enabled: false }}
              maxBodyHeightClassName="max-h-[220px]"
            />
          </div>
        )}
      </div>
    </div>
  );
};
