'use client';

import type { Column } from '@/components/common/MasterTable';
import type { OverviewTax, ValueOverviewRow } from '@/types/dynamic-tax-register.types';
import { Badge } from '@/components/common';

export function getValueOverviewColumns(
  t: (key: string) => string,
  taxes: OverviewTax[],
  aliasLabels?: { typeOfUseLabel?: string; assessmentYearLabel?: string }
): Column<ValueOverviewRow>[] {
  const fixed: Column<ValueOverviewRow>[] = [
    {
      // TYPE OF USE + DESCRIPTION merged into one column, e.g. "C - अनिवासी".
      key: 'typeOfUseCode',
      label: aliasLabels?.typeOfUseLabel || t('overview.columns.typeOfUse'),
      width: '240px',
      render: (_v, row) => {
        const code = row.typeOfUseCode || String(row.typeOfUseId);
        return (
          <span className="text-slate-700">
            <span className="font-bold text-indigo-600">{code}</span>
            {row.description ? ` - ${row.description}` : ''}
          </span>
        );
      },
    },
    {
      key: 'type',
      label: t('overview.columns.type'),
      width: '80px',
      align: 'center',
      render: (_v, row) =>
        row.type ? (
          <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">{row.type}</Badge>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'yearRangeLabel',
      label: aliasLabels?.assessmentYearLabel || t('overview.columns.assessmentYear'),
      width: '110px',
      align: 'center',
      render: (_v, row) => <span className="text-slate-600">{row.yearRangeLabel || '—'}</span>,
    },
  ];

  const taxCols: Column<ValueOverviewRow>[] = taxes.map((tax) => ({
    key: `tax_${tax.taxId}`,
    label: tax.taxName || tax.taxCode || String(tax.taxId),
    width: '90px',
    align: 'center',
    render: (_v, row) => {
      const pct = row.percentages[String(tax.taxId)];
      return pct === undefined ? (
        <span className="text-slate-300">–</span>
      ) : (
        <span className={pct === 0 ? 'text-slate-400' : 'font-semibold text-blue-600'}>{pct}</span>
      );
    },
  }));

  return [...fixed, ...taxCols];
}
