import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { OldTaxesData } from '@/types/ptis.types';
import { MasterTable, Column } from '@/components/common/MasterTable';
import { getTranslatedTaxLabel } from '@/lib/utils/ptis';

interface OldTaxDetailsTableProps {
  oldTaxesData: OldTaxesData | null | undefined;
  showOldTaxInfo: boolean;
}

export const OldTaxDetailsTable: React.FC<OldTaxDetailsTableProps> = ({
  oldTaxesData,
  showOldTaxInfo,
}) => {
  const t = useTranslations('ptis');

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
        cellClassName: 'tabular-nums font-medium whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
      });
    });

    // Last column: Tax Total
    cols.push({
      key: 'taxTotal',
      label: t('fields.taxTotal'),
      align: 'right',
      cellClassName: 'tabular-nums font-bold text-slate-900 whitespace-nowrap',
      headerClassName: 'whitespace-nowrap',
    });

    return cols;
  }, [uniqueTaxNames, t]);

  // Construct table data
  const data = useMemo(() => {
    if (!oldTaxesData || !Array.isArray(oldTaxesData.taxYears)) return [];

    return oldTaxesData.taxYears.map((yearData) => {
      const wardNo = yearData.oldWardNo?.toString() ?? '';
      const propertyNo = yearData.oldPropertyNo ?? '';
      const partitionNo = yearData.oldPartitionNo?.toString() ?? '';
      const wardPropPartNo = [wardNo, propertyNo, partitionNo].filter(Boolean).join(' - ');

      const row: Record<string, unknown> = {
        wardPropPartNo,
        year: yearData.yearCode || yearData.year,
      };

      // Initialize unique tax names and taxTotal
      uniqueTaxNames.forEach((name) => {
        row[name] = 0;
      });
      row['taxTotal'] = 0;

      if (yearData && Array.isArray(yearData.taxes)) {
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

  if (!oldTaxesData || !oldTaxesData.taxYears || oldTaxesData.taxYears.length === 0) {
    return (
      <div className="mt-0.5 p-2 text-center text-sm text-slate-500 bg-slate-50 rounded border border-dashed border-slate-300">
        {t('fields.noTaxDetails')}
      </div>
    );
  }

  return (
    <div className="mt-0.5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded border border-blue-100 p-0.5 shadow-inner">
      <div className="rounded overflow-x-auto shadow-sm">
        <MasterTable<Record<string, unknown>>
          data={data}
          columns={columns}
          emptyText={t('fields.noTaxDetails')}
          paginationConfig={{ enabled: false }}
          maxBodyHeightClassName="max-h-[300px]"
        />
      </div>
    </div>
  );
};
