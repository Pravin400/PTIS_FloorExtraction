'use client';

import { useTranslations } from 'next-intl';
import { MasterTable, Select } from '@/components/common';
import type { MasterOverviewRow } from '@/types/dynamic-tax-register.types';
import { getMasterOverviewColumns } from './masterOverviewColumns';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

/** Controlled Tax / Master filter bar (server-driven). Present only on the standalone Master
 *  tab; the Hybrid tab's master section renders a plain paginated list without it. */
export interface MasterOverviewFilters {
  taxOptions: { label: string; value: string }[];
  masterOptions: { label: string; value: string }[];
  taxValue: string;
  masterValue: string;
  onTaxChange: (value: string) => void;
  onMasterChange: (value: string) => void;
}

export interface MasterOverviewTableProps {
  rows: MasterOverviewRow[];
  /** Server-side pagination state (the drawer drives it through the URL). */
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
  /** Provide to show the Tax / Master filter bar (Master tab); omit for the Hybrid master section. */
  filters?: MasterOverviewFilters;
  /** True when this tab's overview fetch failed (network/5xx) rather than genuinely returning
   *  zero rows — renders overview.loadError instead of the "nothing configured" empty state. */
  loadFailed?: boolean;
}

/** Read-only flat table of master-mapping rows across every tax of a mode. Filtering + pagination
 *  are server-side; this component only renders the current page and reports control changes up. */
export function MasterOverviewTable({
  rows,
  pageNumber,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  loading,
  filters,
  loadFailed,
}: MasterOverviewTableProps) {
  const t = useTranslations('dynamicTaxRegister');
  const assessmentYearLabel = `${useAliasLabel('Assessment', t('aliasFallback.assessment'))} ${t('aliasFallback.yearSuffix')}`;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const columns = getMasterOverviewColumns(t, { assessmentYearLabel });

  return (
    <div className="flex flex-col gap-3">
      {filters && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {t('overview.filterTax')}
            </span>
            <Select options={filters.taxOptions} value={filters.taxValue} onChange={(_, v) => filters.onTaxChange(v)} selectSize="sm" className="w-52" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {t('overview.filterMaster')}
            </span>
            <Select options={filters.masterOptions} value={filters.masterValue} onChange={(_, v) => filters.onMasterChange(v)} selectSize="sm" className="w-40" />
          </div>
          <span className="text-[11px] text-slate-400 ml-auto">{t('overview.rowCount', { count: totalCount })}</span>
        </div>
      )}
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
        emptyText={loadFailed ? t('overview.loadError') : t('overview.emptyMaster')}
        getRowKey={(row, i) => `${(row as MasterOverviewRow).taxId}-${(row as MasterOverviewRow).masterKey}-${i}`}
        tableClassName="text-xs w-full border-collapse"
        theadClassName="font-bold [&_th]:p-2.5 [&_th]:text-left"
        rowClassName={() => 'hover:bg-slate-50/60 [&_td]:p-2.5 [&_td]:border-t [&_td]:border-slate-100 align-top'}
      />
    </div>
  );
}
