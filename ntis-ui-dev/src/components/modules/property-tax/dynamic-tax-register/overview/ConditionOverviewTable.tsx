'use client';

import { useTranslations } from 'next-intl';
import { MasterTable } from '@/components/common';
import type { ConditionOverviewRow } from '@/types/dynamic-tax-register.types';
import type { FieldConfig } from '@/types/rule-engine';
import { getConditionOverviewColumns } from './conditionOverviewColumns';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export interface ConditionOverviewTableProps {
  rows: ConditionOverviewRow[];
  fields: FieldConfig[];
  resolveApiValueLabel?: (fieldId: string, rawValue: string) => string | undefined;
  /** Server-side pagination state (the drawer drives it through the URL). */
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
  /** True when this tab's overview fetch failed (network/5xx) rather than genuinely returning
   *  zero rows — renders overview.loadError instead of the "nothing configured" empty state. */
  loadFailed?: boolean;
}

/** Read-only flat table of condition rows across every tax of a mode (shared by the
 *  Condition tab and the Hybrid tab's condition section). Pagination is server-side. */
export function ConditionOverviewTable({
  rows,
  fields,
  resolveApiValueLabel,
  pageNumber,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  loading,
  loadFailed,
}: ConditionOverviewTableProps) {
  const t = useTranslations('dynamicTaxRegister');
  const assessmentLabel = useAliasLabel('Assessment', t('aliasFallback.assessment'));
  const assessmentYearLabel = `${assessmentLabel} ${t('aliasFallback.yearSuffix')}`;
  const assessmentBasisLabel = `${assessmentLabel} ${t('aliasFallback.basisSuffix')}`;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const columns = getConditionOverviewColumns({ t, fields, resolveApiValueLabel, assessmentYearLabel, assessmentBasisLabel });

  return (
    <MasterTable
      columns={columns}
      data={rows}
      loading={loading}
      paginationConfig={{ enabled: true, showPageSizeSelector: true }}
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={totalCount}
      height='lg'
      totalPages={totalPages}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      pageSizeOptions={[10, 25, 50, 100]}
      maxBodyHeightClassName="max-h-none"
      emptyText={loadFailed ? t('overview.loadError') : t('overview.emptyCondition')}
      getRowKey={(row, i) => `${(row as ConditionOverviewRow).taxId}-${(row as ConditionOverviewRow).sortOrder}-${i}`}
      tableClassName="text-xs w-full border-collapse"
      theadClassName="font-bold [&_th]:p-2.5 [&_th]:text-left"
      rowClassName={() => 'hover:bg-slate-50/60 [&_td]:p-2.5 [&_td]:border-t [&_td]:border-slate-100 align-top'}
    />
  );
}
