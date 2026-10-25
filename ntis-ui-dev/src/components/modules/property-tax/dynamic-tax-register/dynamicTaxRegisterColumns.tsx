'use client';

import type { Column } from '@/components/common/MasterTable';
import type { DynamicTaxRegisterRow, CalculationMode } from '@/types/dynamic-tax-register.types';
import { Badge, StatusBadge } from '@/components/common';
import { ConfigureButton } from '@/components/common/ActionButtons';
import { Tooltip } from '@/components/common/Tooltip';

/** Tax Name / Regional Name are free text and can run long (e.g. auto-generated
 *  tax codes) — truncate past 20 characters and reveal the full value on hover
 *  rather than letting the row stretch the table's width. */
const NAME_TRUNCATE_LIMIT = 20;

function renderTruncatableName(value: unknown) {
  const text = (value as string) || '';
  if (!text) return <span>-</span>;
  if (text.length <= NAME_TRUNCATE_LIMIT) return <span>{text}</span>;
  return (
    <Tooltip content={text}>
      <span className="cursor-help">{text.slice(0, NAME_TRUNCATE_LIMIT)}...</span>
    </Tooltip>
  );
}

export interface GetDynamicTaxRegisterColumnsParams {
  t: (key: string) => string;
  pageNumber: number;
  pageSize: number;
  MODE_BADGE_CLASS: Record<CalculationMode, string>;
  RULE_CATEGORY_LABEL_KEY: Record<CalculationMode, string>;
  goToConfigure: (row: DynamicTaxRegisterRow) => void;
  assessmentStatusLabel?: string;
}

export function getDynamicTaxRegisterColumns({
  t,
  pageNumber,
  pageSize,
  MODE_BADGE_CLASS,
  RULE_CATEGORY_LABEL_KEY,
  goToConfigure,
  assessmentStatusLabel,
}: GetDynamicTaxRegisterColumnsParams): Column<DynamicTaxRegisterRow>[] {
  return [
    {
      key: 'taxId',
      label: t('list.columns.srNo'),
      width: '56px',
      align: 'left',
      cellClassName: 'text-slate-400 font-mono text-xs',
      render: (_val: unknown, _row, rowIndex: number) => <span>{(pageNumber - 1) * pageSize + rowIndex + 1}</span>,
    },
    {
      key: 'taxName',
      label: t('list.columns.taxName'),
      width: '170px',
      align: 'left',
      cellClassName: 'font-semibold text-slate-800 text-xs',
      render: renderTruncatableName,
    },
    {
      key: 'taxNameAlias',
      label: t('list.columns.taxNameAlias'),
      width: '140px',
      align: 'left',
      cellClassName: 'text-slate-700 text-xs',
      // Optional field — renderTruncatableName already shows the same em dash the other
      // nullable columns use rather than a blank cell, so an unset alias reads as "none
      // recorded" instead of a rendering gap.
      render: renderTruncatableName,
    },
    {
      key: 'taxCode',
      label: t('list.columns.taxCode'),
      width: '110px',
      align: 'left',
      cellClassName: 'text-slate-400 font-mono text-xs tracking-wide',
    },
    {
      key: 'ruleName',
      label: t('list.columns.ruleName'),
      width: '170px',
      align: 'left',
      render: (val: unknown) => <span className="text-xs font-medium text-slate-700">{(val as string) ?? '-'}</span>,
    },
    {
      key: 'ruleCategory',
      label: t('list.columns.ruleCategory'),
      width: '120px',
      align: 'center',
      // Show the calculation-mode label (Value/Condition/Master/Hybrid Based), not the internal
      // routing category code — "Field"/"Data" were confusing for CONDITION_BASED/MASTER_BASED.
      // Color comes from MODE_BADGE_CLASS — the same mapping the stat cards above use.
      render: (_: unknown, row: DynamicTaxRegisterRow) => {
        const rowMode = row.calculationMode;
        if (!rowMode || !MODE_BADGE_CLASS[rowMode]) return <span className="text-xs text-slate-400">-</span>;
        return (
          <Badge variant="outline" size="sm" className={MODE_BADGE_CLASS[rowMode]}>
            {t(RULE_CATEGORY_LABEL_KEY[rowMode])}
          </Badge>
        );
      },
    },
    {
      key: 'source',
      label: t('list.columns.source'),
      width: '110px',
      align: 'left',
      cellClassName: 'text-xs font-medium text-slate-700',
    },
    {
      key: 'status',
      label: t('list.columns.status'),
      width: '100px',
      align: 'left',
      render: (val: unknown) => (
        <StatusBadge value={val as string} activeLabel={t('list.activeBadge')} inactiveLabel={t('list.deactiveBadge')} />
      ),
    },
    {
      key: 'assessmentStatus',
      label: assessmentStatusLabel || t('list.columns.assessmentStatus'),
      width: '120px',
      align: 'left',
      render: (val: unknown) => {
        const isActive = Boolean(val);
        return (
          <Badge variant={isActive ? 'default' : 'secondary'} size="sm" dot>
            {isActive ? t('list.activeBadge') : t('list.deactiveBadge')}
          </Badge>
        );
      },
    },
    {
      key: 'oldTaxStatus',
      label: t('list.columns.oldTaxStatus'),
      width: '116px',
      align: 'left',
      render: (val: unknown) => {
        const isActive = Boolean(val);
        return (
          <Badge
            variant="outline"
            size="sm"
            dot
            className={isActive ? 'bg-slate-50 text-slate-700 border-slate-300' : 'bg-white text-slate-400 border-slate-200'}
          >
            {isActive ? t('list.activeBadge') : t('list.deactiveBadge')}
          </Badge>
        );
      },
    },
    {
      key: 'ruleSummary',
      label: t('list.columns.ruleSummary'),
      width: '130px',
      align: 'left',
      cellClassName: 'text-xs font-medium text-slate-700',
    },
    {
      key: 'action',
      label: t('list.columns.actions'),
      width: '96px',
      align: 'center',
      render: (_, row: DynamicTaxRegisterRow) => (
        <ConfigureButton size="xs" onClick={() => goToConfigure(row)} className="active:scale-95" />
      ),
    },
  ];
}
