'use client';

import { useTranslations } from 'next-intl';
import { GitBranch, Database } from 'lucide-react';
import type { ConditionOverviewRow, MasterOverviewRow } from '@/types/dynamic-tax-register.types';
import type { FieldConfig } from '@/types/rule-engine';
import { ConditionOverviewTable } from './ConditionOverviewTable';
import { MasterOverviewTable } from './MasterOverviewTable';

export interface HybridOverviewTabProps {
  fields: FieldConfig[];
  resolveApiValueLabel?: (fieldId: string, rawValue: string) => string | undefined;
  loading?: boolean;
  // Condition-rules section (server-paged).
  conditionRows: ConditionOverviewRow[];
  conditionPageNumber: number;
  conditionPageSize: number;
  conditionTotalCount: number;
  onConditionPageChange: (page: number) => void;
  onConditionPageSizeChange: (size: number) => void;
  // Master-mappings section (server-paged, independent of the condition section).
  masterRows: MasterOverviewRow[];
  masterPageNumber: number;
  masterPageSize: number;
  masterTotalCount: number;
  onMasterPageChange: (page: number) => void;
  onMasterPageSizeChange: (size: number) => void;
  /** True when either section's overview fetch failed (network/5xx) rather than genuinely
   *  returning zero rows — renders overview.loadError instead of the "nothing configured" state. */
  loadFailed?: boolean;
}

/** Hybrid taxes carry both condition rules and master mappings — shown as two labeled sections,
 *  each paginated on the server independently. */
export function HybridOverviewTab({
  fields,
  resolveApiValueLabel,
  loading,
  conditionRows,
  conditionPageNumber,
  conditionPageSize,
  conditionTotalCount,
  onConditionPageChange,
  onConditionPageSizeChange,
  masterRows,
  masterPageNumber,
  masterPageSize,
  masterTotalCount,
  onMasterPageChange,
  onMasterPageSizeChange,
  loadFailed,
}: HybridOverviewTabProps) {
  const t = useTranslations('dynamicTaxRegister');

  if (conditionTotalCount === 0 && masterTotalCount === 0 && !loading) {
    return (
      <p className={`text-sm py-10 text-center ${loadFailed ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
        {loadFailed ? t('overview.loadError') : t('overview.emptyHybrid')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
            {t('overview.hybridConditionSection')}
          </span>
        </div>
        <ConditionOverviewTable
          rows={conditionRows}
          fields={fields}
          resolveApiValueLabel={resolveApiValueLabel}
          loading={loading}
          pageNumber={conditionPageNumber}
          pageSize={conditionPageSize}
          totalCount={conditionTotalCount}
          onPageChange={onConditionPageChange}
          onPageSizeChange={onConditionPageSizeChange}
          loadFailed={loadFailed}
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
            {t('overview.hybridMasterSection')}
          </span>
        </div>
        <MasterOverviewTable
          rows={masterRows}
          loading={loading}
          pageNumber={masterPageNumber}
          pageSize={masterPageSize}
          totalCount={masterTotalCount}
          onPageChange={onMasterPageChange}
          onPageSizeChange={onMasterPageSizeChange}
          loadFailed={loadFailed}
        />
      </section>
    </div>
  );
}
