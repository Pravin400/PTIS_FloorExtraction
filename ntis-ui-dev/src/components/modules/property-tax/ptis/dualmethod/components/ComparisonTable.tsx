'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FloorDetailsTable, type FloorDetailsTableColumn } from '@/components/common';
import { type DualMethodResponse } from '@/types/dualMethod.types';
import { formatIndianNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { getTranslatedTaxLabel } from '@/lib/utils/ptis';
import {
  type ComparisonRow,
  getUniqueTaxNames,
  buildTaxKeyMap,
  buildComparisonRows,
} from '@/lib/utils/ptis-table-helpers';

interface DualMethodComparisonTableProps {
  dualMethodData: DualMethodResponse | null;
  locale: string;
}

// Static styling constants moved outside component to avoid allocations per render
const HEADER_TEXT_CLASSES = 'text-white text-[9.5px] font-bold tracking-tight py-1 uppercase';
const CELL_CENTER_CLASS = 'text-center px-0.5';
const NUMBER_CELL_CLASSES =
  'border border-blue-200 rounded-md px-1.5 py-0.5 text-center bg-white text-[12px] min-w-[50px] shadow-2xs font-semibold text-slate-800 hover:border-blue-300 transition-colors';
const TOTAL_CELL_CLASSES =
  'border border-emerald-300 rounded-md px-1.5 py-0.5 text-center bg-emerald-50/80 text-[12px] min-w-[60px] font-bold text-emerald-800 shadow-2xs hover:border-emerald-400 transition-colors';

function renderTaxAmountCell(val: unknown, isTotal = false) {
  const num = Number(val ?? 0);
  const decimals = Number.isInteger(num) ? 0 : 2;
  return (
    <div className={isTotal ? TOTAL_CELL_CLASSES : NUMBER_CELL_CLASSES}>
      {formatIndianNumber(num, decimals, decimals)}
    </div>
  );
}

export const DualMethodComparisonTable: React.FC<DualMethodComparisonTableProps> = ({
  dualMethodData,
  locale: _locale,
}) => {
  const t = useTranslations('ptis.modules.DualMethod');
  const rootT = useTranslations('ptis');

  const taxNames = useMemo(() => getUniqueTaxNames(dualMethodData), [dualMethodData]);
  const taxKeyMap = useMemo(() => buildTaxKeyMap(taxNames), [taxNames]);

  const labels = useMemo(
    () => [
      {
        id: 'old',
        key: 'oldTaxes' as const,
        label: t('comparisonTable.oldTaxes'),
        color: 'bg-slate-100 text-slate-700 border-slate-200',
      },
      {
        id: 'rv',
        key: 'rvTaxes' as const,
        label: t('comparisonTable.rvTaxes'),
        color: 'bg-blue-50 text-blue-600 border-blue-200',
      },
      {
        id: 'cv',
        key: 'cvTaxes' as const,
        label: t('comparisonTable.cvTaxes'),
        color: 'bg-purple-50 text-purple-600 border-purple-200',
      },
      {
        id: 'retain',
        key: 'retainTaxes' as const,
        label: t('comparisonTable.retainTaxes'),
        color: 'bg-red-50 text-red-600 border-red-200',
      },
    ],
    [t]
  );

  const rows = useMemo(
    () => buildComparisonRows(dualMethodData, taxNames, labels, taxKeyMap),
    [dualMethodData, taxNames, labels, taxKeyMap]
  );

  const columns = useMemo(() => {
    const cols: FloorDetailsTableColumn<ComparisonRow>[] = [
      {
        key: 'label',
        label: t('comparisonTable.taxes'),
        headerClassName: `${HEADER_TEXT_CLASSES} ${CELL_CENTER_CLASS} sticky left-0 z-20 bg-[#1e3a8a] min-w-[115px] w-[115px] border-r border-blue-700/60`,
        cellClassName: `${CELL_CENTER_CLASS} sticky left-0 z-10 bg-white min-w-[115px] w-[115px] border-r border-blue-200`,
        render: (row) => (
          <div className="w-full flex items-center justify-center px-0.5">
            <div
              className={cn(
                'px-1.5 py-0.5 rounded-md shadow-2xs border text-center text-[11px] font-bold tracking-tight uppercase transition-all whitespace-nowrap inline-flex items-center justify-center w-full',
                row.colorClass
              )}
            >
              {row.label}
            </div>
          </div>
        ),
      },
    ];

    taxNames.forEach((taxName) => {
      const translatedLabel = getTranslatedTaxLabel(rootT, taxName);
      const key = taxKeyMap[taxName];

      cols.push({
        key,
        label: translatedLabel.toUpperCase(),
        headerClassName: `${HEADER_TEXT_CLASSES} ${CELL_CENTER_CLASS}`,
        cellClassName: CELL_CENTER_CLASS,
        render: (row) => renderTaxAmountCell(row[key]),
      });
    });

    cols.push({
      key: 'totalTax',
      label: t('comparisonTable.totalTax'),
      headerClassName: `${HEADER_TEXT_CLASSES} ${CELL_CENTER_CLASS} sticky right-0 z-20 bg-[#1e3a8a] min-w-[85px] w-[85px] border-l border-blue-700/60`,
      cellClassName: `${CELL_CENTER_CLASS} sticky right-0 z-10 bg-white min-w-[85px] w-[85px] border-l border-blue-200`,
      render: (row) => renderTaxAmountCell(row.totalTax, true),
    });

    return cols;
  }, [t, rootT, taxNames, taxKeyMap]);

  return (
    <div className="w-full tax-details-container overflow-x-auto max-h-[300px] overflow-y-auto" data-testid="master-table">
      <FloorDetailsTable<ComparisonRow>
        data={rows}
        columns={columns}
        showExpandColumn={false}
        showScrollButtons={false}
        tableClassName="w-full border-collapse"
        theadClassName="bg-[#1e3a8a] text-white border-b border-blue-700/60 shadow-xs"
        emptyMessage={t('comparisonTable.emptyMessage')}
      />
    </div>
  );
};
