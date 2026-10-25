import React from 'react';
import { Column } from '@/components/common/MasterTable';
import { cn } from '@/lib/utils/cn';
import {
  formatReassessmentCurrency,
  formatReassessmentNumber,
  formatReassessmentTaxCurrency,
  sumReassessmentTaxAmounts,
} from '@/lib/utils/format';
import { ReassessmentTaxRow } from '@/types/reassessment.types';

interface TaxColumn {
  key: string;
  label: string;
  displayOrder: number;
}

interface DynamicTaxRow extends Record<string, unknown> {
  taxes: string;
  totalTax: string;
  isTotal?: boolean;
  isAdditional?: boolean;
  [key: string]: unknown;
}

export function useReassessmentTaxTable({
  taxColumns,
  taxRows,
}: {
  taxColumns: TaxColumn[];
  taxRows: ReassessmentTaxRow[];
}) {
  // Compact numeric cell renderer
  const numericTaxRender = (val: unknown, row: DynamicTaxRow): React.ReactNode => {
    const numVal = typeof val === 'number' ? val : 0;
    return (
      <div
        className={cn(
          'border border-gray-300 shadow-sm rounded h-[20px] flex items-center justify-center transition-all duration-150 hover:border-blue-500 hover:shadow px-1',
          row.isTotal && 'bg-green-50',
          row.isAdditional && 'bg-yellow-50',
          !row.isTotal && !row.isAdditional && 'bg-blue-50'
        )}
      >
        <span
          className={cn(
            'font-mono text-[11px] leading-[18px] text-gray-900',
            row.isTotal ? 'font-bold' : ''
          )}
        >
          {formatReassessmentNumber(numVal)}
        </span>
      </div>
    );
  };

  // Compact total-tax cell renderer (right aligned currency)
  const totalTaxRender = (val: unknown, row: DynamicTaxRow): React.ReactNode => {
    let displayVal;
    if (typeof val === 'number') {
      displayVal = formatReassessmentCurrency(val);
    } else if (typeof val === 'string') {
      displayVal = val;
    } else {
      displayVal = '';
    }
    return (
      <div
        className={cn(
          'border border-gray-300 shadow-sm rounded h-[20px] flex items-center justify-end px-1.5 transition-all duration-150 hover:border-blue-500 hover:shadow',
          row.isTotal && 'bg-green-50',
          row.isAdditional && 'bg-yellow-50',
          !row.isTotal && !row.isAdditional && 'bg-blue-50'
        )}
      >
        <span
          className={cn(
            'font-mono text-[11px] leading-[18px] text-gray-900',
            row.isTotal ? 'font-bold' : ''
          )}
        >
          {displayVal}
        </span>
      </div>
    );
  };

  // Compact taxes-label cell renderer
  const taxesLabelRender = (val: unknown, row: DynamicTaxRow): React.ReactNode => {
    const displayVal = typeof val === 'string' || typeof val === 'number' ? val : '';
    return (
      <div
        className={cn(
          'border border-gray-300 shadow-sm rounded h-[20px] flex items-center px-1.5 transition-all duration-150 hover:border-blue-500 hover:shadow',
          row.isTotal && 'bg-green-50',
          row.isAdditional && 'bg-yellow-50',
          !row.isTotal && !row.isAdditional && 'bg-blue-50'
        )}
      >
        <span
          className={cn(
            'font-sans text-[11px] leading-[18px] text-left text-gray-900',
            row.isTotal ? 'font-bold' : 'font-semibold'
          )}
        >
          {displayVal}
        </span>
      </div>
    );
  };

  // Dynamic columns — compact widths
  const detailedTaxesColumns: Column<DynamicTaxRow>[] = [
    {
      key: 'taxes',
      label: 'Taxes',
      width: '110px',
      align: 'left',
      render: taxesLabelRender,
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
    },
    ...taxColumns.map((col) => ({
      key: col.key,
      label: col.label,
      width: '95px',
      align: 'center' as const,
      render: numericTaxRender,
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
    })),
    {
      key: 'totalTax',
      label: 'Total Tax (₹)',
      width: '110px',
      align: 'right' as const,
      headerClassName: 'bg-slate-100 font-black text-right pr-2 whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: totalTaxRender,
    },
  ];

  const oldTaxRow = taxRows.find((row) => row.rowType === 'old');
  const newTaxRow = taxRows.find((row) => row.rowType === 'additional');
  const oldCalculatedTotal = oldTaxRow ? sumReassessmentTaxAmounts(oldTaxRow.taxes) : 0;
  const newCalculatedTotal = newTaxRow ? sumReassessmentTaxAmounts(newTaxRow.taxes) : 0;

  // Transform tax rows to table format
  const detailedTaxesData: DynamicTaxRow[] = taxRows.map((row) => {
    const isTotalRow = row.rowType === 'total';
    const isOldRow = row.rowType === 'old';
    const isNewRow = row.rowType === 'additional';
    const totalTaxVal = isTotalRow
      ? oldCalculatedTotal + newCalculatedTotal
      : sumReassessmentTaxAmounts(row.taxes);
    const compareWith = isOldRow
      ? newCalculatedTotal
      : isNewRow
        ? oldCalculatedTotal
        : undefined;

    const rowData: DynamicTaxRow = {
      taxes: row.label,
      totalTax: isTotalRow
        ? formatReassessmentCurrency(totalTaxVal)
        : formatReassessmentTaxCurrency(totalTaxVal, compareWith),
      isTotal: isTotalRow,
      isAdditional: row.rowType === 'additional',
    };

    Object.entries(row.taxes).forEach(([key, value]) => {
      const numVal = typeof value === 'number' ? value : 0;
      rowData[key] = isTotalRow ? Math.abs(numVal) : value;
    });

    return rowData;
  });

  return { detailedTaxesColumns, detailedTaxesData };
}