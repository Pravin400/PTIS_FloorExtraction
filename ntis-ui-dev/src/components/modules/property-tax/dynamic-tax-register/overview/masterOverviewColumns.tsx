import type { Column } from '@/components/common/MasterTable';
import type { MasterOverviewRow } from '@/types/dynamic-tax-register.types';
import { formatConditionEffect } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';

export function getMasterOverviewColumns(
  t: (key: string) => string,
  aliasLabels?: { assessmentYearLabel?: string }
): Column<MasterOverviewRow>[] {
  return [
    {
      key: 'taxName',
      label: t('overview.columns.tax'),
      width: '180px',
      render: (_v, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-700">{row.taxName || '—'}</span>
          {row.taxCode && <span className="text-[10px] font-mono text-slate-400">{row.taxCode}</span>}
        </div>
      ),
    },
    {
      key: 'masterName',
      label: t('overview.columns.masterName'),
      width: '130px',
      render: (_v, row) => <span className="text-slate-700">{row.masterName || '—'}</span>,
    },
    {
      key: 'displayValue',
      label: t('overview.columns.masterKey'),
      // Show only the human-readable value — the raw master key id is intentionally hidden.
      render: (_v, row) => (
        <span className="font-semibold text-slate-700">{row.displayValue || row.masterKey}</span>
      ),
    },
    {
      key: 'yearRangeLabel',
      label: aliasLabels?.assessmentYearLabel || t('overview.columns.assessmentYear'),
      width: '120px',
      align: 'center',
      render: (_v, row) => <span className="text-slate-600">{row.yearRangeLabel || '—'}</span>,
    },
    {
      key: 'resultValue',
      label: t('overview.columns.result'),
      width: '150px',
      render: (_v, row) => (
        <span className="font-semibold text-emerald-700">
          {formatConditionEffect(row.resultMode, row.resultBase, row.resultValue)}
        </span>
      ),
    },
  ];
}
