'use client';

import type { Column } from '@/components/common/MasterTable';
import type { ConditionOverviewRow } from '@/types/dynamic-tax-register.types';
import type { FieldConfig } from '@/types/rule-engine';
import { Badge } from '@/components/common';
import { formatConditionSummary, formatConditionEffect } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';

export interface GetConditionOverviewColumnsParams {
  t: (key: string) => string;
  fields: FieldConfig[];
  resolveApiValueLabel?: (fieldId: string, rawValue: string) => string | undefined;
  assessmentYearLabel?: string;
  assessmentBasisLabel?: string;
}

export function getConditionOverviewColumns({
  t,
  fields,
  resolveApiValueLabel,
  assessmentYearLabel,
  assessmentBasisLabel,
}: GetConditionOverviewColumnsParams): Column<ConditionOverviewRow>[] {
  return [
    {
      key: 'sortOrder',
      // Same numbered-circle convention as the editor (ConditionRuleRowCard) — rows are evaluated
      // top to bottom within a tax and every match is summed unless a row's stopFurtherProcessing
      // halts evaluation there, so this is genuinely the row's evaluation priority, not just a
      // display index.
      label: t('overview.columns.priority'),
      width: '36px',
      align: 'center',
      render: (_v, row) => (
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold">
            {row.sortOrder}
          </span>
          {row.stopFurtherProcessing && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
              title={t('condition.stopFurtherProcessing')}
              aria-label={t('condition.stopFurtherProcessing')}
            />
          )}
        </span>
      ),
    },
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
      key: 'conditions',
      label: t('overview.columns.conditions'),
      render: (_v, row) => (
        <span className="text-slate-700">
          {formatConditionSummary(row.conditions, fields, t('condition.alwaysMatches'), resolveApiValueLabel)}
        </span>
      ),
    },
    {
      key: 'resultValue',
      label: t('overview.columns.result'),
      width: '150px',
      render: (_v, row) => (
        <span className="font-semibold text-emerald-700">
          {formatConditionEffect(
            row.resultMode,
            row.resultBase,
            row.resultValue,
            row.referenceTaxName ?? undefined,
            fields.find((f) => f.fieldId === row.unitFieldId)?.fieldName ?? row.unitFieldId ?? undefined
          )}
        </span>
      ),
    },
    {
      key: 'yearRangeLabel',
      label: assessmentYearLabel || t('overview.columns.assessmentYear'),
      width: '120px',
      align: 'center',
      render: (_v, row) => <span className="text-slate-600">{row.yearRangeLabel || t('overview.allYears')}</span>,
    },
    {
      key: 'assessmentBasis',
      label: assessmentBasisLabel || t('condition.assessmentBasis'),
      width: '110px',
      align: 'center',
      render: (_v, row) => (
        <span className="text-slate-600">
          {row.assessmentBasis === 'BUILDING_BASED'
            ? t('condition.buildingBasedOption')
            : t('condition.propertyBasedOption')}
        </span>
      ),
    },
    {
      key: 'conditionEvaluationScope',
      label: t('condition.conditionEvaluationScope'),
      width: '130px',
      align: 'center',
      render: (_v, row) => (
        <span className="text-slate-600">
          {row.conditionEvaluationScope === 'ALL_FLOORS_AGGREGATED'
            ? t('condition.allFloorsAggregatedOption')
            : t('condition.floorWiseOption')}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: t('overview.columns.status'),
      width: '90px',
      align: 'center',
      render: (_v, row) => (
        <Badge
          className={
            row.isActive
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold'
              : 'bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold'
          }
        >
          {row.isActive ? t('list.activeBadge') : t('list.deactiveBadge')}
        </Badge>
      ),
    },
  ];
}
