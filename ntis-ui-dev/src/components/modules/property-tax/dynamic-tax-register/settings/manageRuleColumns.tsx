'use client';

import type { Column } from '@/components/common/MasterTable';
import type { DynamicTaxRule, TaxCalculationModeOption } from '@/types/dynamic-tax-register.types';
import { EditButton, DeleteButton } from '@/components/common';

export interface GetManageRuleColumnsParams {
  t: (key: string) => string;
  RULE_TYPE_LABEL: Record<string, string>;
  modeByCode: Map<string, TaxCalculationModeOption>;
  isRuleInUse: (id: number) => boolean;
  handleEdit: (rule: DynamicTaxRule) => void;
  handleDelete: (rule: DynamicTaxRule) => void;
}

export function getManageRuleColumns({
  t,
  RULE_TYPE_LABEL,
  modeByCode,
  isRuleInUse,
  handleEdit,
  handleDelete,
}: GetManageRuleColumnsParams): Column<DynamicTaxRule>[] {
  return [
    {
      key: 'id',
      label: t('manageRule.columns.id'),
      width: '40px',
      align: 'center',
      cellClassName: 'text-slate-400 font-mono text-xs',
      render: (_val: unknown, _row: DynamicTaxRule, rowIndex: number) => <span>{rowIndex + 1}</span>,
    },
    { key: 'displayName', label: t('manageRule.columns.displayName'), width: '200px', align: 'left', cellClassName: 'font-bold text-slate-800 text-[11px]' },
    {
      key: 'ruleType',
      label: t('manageRule.columns.ruleType'),
      width: '130px',
      align: 'center',
      render: (val: unknown) => {
        const raw = (val as string) ?? '';
        const label = RULE_TYPE_LABEL[raw] ?? raw;
        if (!raw) return <span className="text-slate-500 text-xs">-</span>;
        // Colour is derived from the mode's CAPABILITIES, not its code, so a mode added in the DB
        // is styled consistently with whichever mechanism it reuses instead of falling to plain
        // grey. Hybrid-style (multi-capability) modes read as blue.
        const mode = modeByCode.get(raw);
        const tone = !mode
          ? 'bg-slate-50 text-slate-600 border-slate-200'
          : mode.usesHybridConfig
            ? 'bg-blue-50 text-blue-600 border-blue-100'
            : mode.usesMasterConfig
              ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
              : mode.usesConditionConfig
                ? 'bg-amber-50 text-amber-600 border-amber-100'
                : mode.usesValueConfig
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200';
        return <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${tone}`}>{label}</span>;
      },
    },
    {
      key: 'attachedReference',
      label: t('manageRule.columns.attachedReference'),
      width: '160px',
      align: 'left',
      cellClassName: 'text-slate-400 italic text-[11px] font-medium',
      render: (val: unknown) => <span>{(val as string) || '-'}</span>,
    },
    { key: 'sortOrder', label: t('manageRule.columns.sortOrder'), width: '60px', align: 'center', cellClassName: 'text-slate-500 font-mono text-xs font-semibold' },
    {
      key: 'isActive',
      label: t('manageRule.columns.status'),
      width: '90px',
      align: 'center',
      render: (val: unknown, row: DynamicTaxRule) => {
        const isActive = Boolean(val);
        return (
          <div className="flex flex-col items-center gap-1">
            <span className={`inline-flex items-center gap-1.5 font-bold text-[10px] ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              {isActive ? t('manageRule.active') : t('manageRule.inactive')}
            </span>
            {isRuleInUse(row.id) && (
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{t('manageRule.inUse')}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'action',
      label: t('manageRule.columns.actions'),
      width: '100px',
      align: 'center',
      render: (_: unknown, row: DynamicTaxRule) => {
        const inUse = isRuleInUse(row.id);
        return (
          <div className="flex items-center justify-center gap-2">
            <EditButton onClick={() => handleEdit(row)} aria-label={t('manageRule.editRuleAria')} />
            <DeleteButton
              onClick={() => handleDelete(row)}
              aria-label={t('manageRule.deleteRuleAria')}
              disabled={inUse}
              title={inUse ? t('manageRule.ruleInUseHint') : undefined}
            />
          </div>
        );
      },
    },
  ];
}
