'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MasterTable, Select } from '@/components/common';
import type {
  OverviewTax,
  ValueOverviewRow,
  TypeOfUseOption,
  YearRangeOption,
  TypeOfUseGroupOption,
} from '@/types/dynamic-tax-register.types';
import { getValueOverviewColumns } from './valueOverviewColumns';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export interface ValueOverviewTabProps {
  /** Pivot column headers (all value-based taxes) — from the server, never client-filtered. */
  taxes: OverviewTax[];
  /** Current page of pivot rows. */
  rows: ValueOverviewRow[];
  /** Server-side pagination state (the drawer drives it through the URL). */
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
  /** AssessmentYearRange master rows — the source of the Year filter options. */
  yearRangeOptions: YearRangeOption[];
  /** TypeOfUseGroup master rows — the source of the "Type" filter options. */
  typeOfUseGroups: TypeOfUseGroupOption[];
  /** Description options — the selected group's TypeOfUse rows, or the full list (resolved server-side). */
  descriptionOptions: TypeOfUseOption[];
  /** Current filter values ("all" when unset). */
  yearValue: string;
  typeValue: string;
  descValue: string;
  onYearChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onDescChange: (value: string) => void;
  /** True when this tab's overview fetch failed (network/5xx) rather than genuinely returning
   *  zero rows — renders overview.loadError instead of the "nothing configured" empty state. */
  loadFailed?: boolean;
}

/** Value-based cross-tax pivot: rows = (TypeOfUse × year-range), one column per value-based tax,
 *  cells = that tax's percentage. Read-only; horizontally scrollable when many taxes. Filtering +
 *  pagination are server-side — "Type" (TypeOfUseGroup) and "Description" cascade on the server. */
export function ValueOverviewTab({
  taxes,
  rows,
  pageNumber,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  loading,
  yearRangeOptions,
  typeOfUseGroups,
  descriptionOptions,
  yearValue,
  typeValue,
  descValue,
  onYearChange,
  onTypeChange,
  onDescChange,
  loadFailed,
}: ValueOverviewTabProps) {
  const t = useTranslations('dynamicTaxRegister');
  const typeOfUseLabel = useAliasLabel('Type_Of_Use', t('aliasFallback.typeOfUse'));
  const assessmentLabel = useAliasLabel('Assessment', t('aliasFallback.assessment'));
  const assessmentYearLabel = `${assessmentLabel} ${t('aliasFallback.yearSuffix')}`;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const yearOptions = useMemo(
    () => [
      { label: t('overview.allYears'), value: 'all' },
      ...yearRangeOptions.map((o) => ({ label: o.label, value: String(o.value) })),
    ],
    [yearRangeOptions, t]
  );

  const typeOptions = useMemo(
    () => [
      { label: t('overview.allTypes'), value: 'all' },
      ...typeOfUseGroups.map((g) => ({ label: g.label, value: String(g.value) })),
    ],
    [typeOfUseGroups, t]
  );

  const descOptions = useMemo(
    () => [
      { label: t('overview.allDescriptions'), value: 'all' },
      ...descriptionOptions.map((o) => ({ label: o.description, value: String(o.id) })),
    ],
    [descriptionOptions, t]
  );

  const columns = useMemo(
    () => getValueOverviewColumns(t, taxes, { typeOfUseLabel, assessmentYearLabel }),
    [taxes, t, typeOfUseLabel, assessmentYearLabel]
  );

  // Only the genuine "no value-based taxes" case shows the empty state; during a navigation the
  // taxes list is momentarily empty, so defer to the loading table instead of flashing "empty".
  if (taxes.length === 0 && !loading) {
    return (
      <p className={`text-sm py-10 text-center ${loadFailed ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
        {loadFailed ? t('overview.loadError') : t('overview.emptyValue')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            {assessmentYearLabel}
          </span>
          <Select options={yearOptions} value={yearValue} onChange={(_, v) => onYearChange(v)} selectSize="sm" className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            {t('overview.filterType')}
          </span>
          <Select options={typeOptions} value={typeValue} onChange={(_, v) => onTypeChange(v)} selectSize="sm" className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            {t('overview.filterDescription')}
          </span>
          <Select options={descOptions} value={descValue} onChange={(_, v) => onDescChange(v)} selectSize="sm" className="w-52" />
        </div>
        <span className="text-[11px] text-slate-400 ml-auto">{t('overview.rowCount', { count: totalCount })}</span>
      </div>
      <div className="overflow-x-auto">
        <MasterTable
          columns={columns}
          data={rows}
          height='lg'
          loading={loading}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 25, 50, 100]}
          maxBodyHeightClassName="max-h-none"
          emptyText={loadFailed ? t('overview.loadError') : t('overview.emptyValue')}
          getRowKey={(row) => `${(row as ValueOverviewRow).typeOfUseId}-${(row as ValueOverviewRow).yearRangeRVId}`}
          tableClassName="text-xs w-max min-w-full border-collapse"
          theadClassName="font-bold [&_th]:whitespace-nowrap [&_th]:p-2.5 [&_th]:border-r [&_th]:border-[#DCEAFF]"
          rowClassName={() => 'hover:bg-slate-50/60 [&_td]:p-2 [&_td]:border-r [&_td]:border-slate-100'}
        />
      </div>
    </div>
  );
}
