import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import type { Column } from '@/components/common';

export function useAppliedRulesColumns(locale: string) {
  const t = useTranslations('ptis');

  const columns: Column[] = [
    {
      key: 'applyOrder',
      label: t('appliedRules.columns.applyOrder'),
      align: 'center',
      width: '50px',
    },
    {
      key: 'ruleCategory',
      label: t('appliedRules.columns.ruleCategory'),
      align: 'center',
      width: '65px',
      render: (val: unknown) => (
        <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-800 border border-slate-200 uppercase whitespace-nowrap">
          {val as string}
        </span>
      ),
    },
    {
      key: 'ruleScopeName',
      label: t('appliedRules.columns.ruleScopeName'),
      align: 'center',
      width: '95px',
      render: (val: unknown) => (
        <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
          {val ? (val as string) : '-'}
        </span>
      ),
    },
    {
      key: 'floorName',
      label: t('appliedRules.columns.floorName'),
      align: 'center',
      width: '90px',
      render: (val: unknown) => (
        <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-100 whitespace-nowrap">
          {val ? (val as string) : '-'}
        </span>
      ),
    },
    {
      key: 'typeOfUseName',
      label: t('appliedRules.columns.typeOfUseName'),
      align: 'center',
      width: '95px',
      render: (val: unknown) => (
        <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-100 whitespace-nowrap">
          {val ? (val as string) : '-'}
        </span>
      ),
    },
    {
      key: 'ruleName',
      label: t('appliedRules.columns.ruleName'),
      align: 'left',
      cellClassName: 'font-medium text-slate-900 leading-snug',
    },
    {
      key: 'effectType',
      label: t('appliedRules.columns.effectType'),
      align: 'center',
      width: '95px',
      render: (val: unknown) => (
        <span className={cn(
          "px-2 py-0.5 text-xs font-semibold rounded border whitespace-nowrap",
          String(val).toLowerCase().includes('decrease')
            ? "bg-red-50 text-red-700 border-red-100"
            : "bg-green-50 text-green-700 border-green-100"
        )}>
          {val as string}
        </span>
      ),
    },
    {
      key: 'effectValue',
      label: t('appliedRules.columns.effectValue'),
      align: 'center',
      width: '75px',
      render: (val: unknown) => (
        <span className="font-semibold text-slate-800">
          {typeof val === 'number' ? val : '-'}
        </span>
      ),
    },
    {
      key: 'applyRate',
      label: t('appliedRules.columns.applyRate'),
      align: 'center',
      width: '85px',
      render: (val: unknown) => (
        <span className="font-semibold text-slate-800">
          {typeof val === 'number' ? `${val}%` : '-'}
        </span>
      ),
    },
    {
      key: 'baseValue',
      label: t('appliedRules.columns.baseValue'),
      align: 'center',
      width: '80px',
      render: (val: unknown) => (
        <span className="font-semibold text-slate-700">
          {typeof val === 'number' ? val.toFixed(2) : '-'}
        </span>
      ),
    },
    {
      key: 'computedValue',
      label: t('appliedRules.columns.computedValue'),
      align: 'center',
      width: '90px',
      render: (val: unknown) => (
        <span className="font-bold text-indigo-600">
          {typeof val === 'number' ? val.toFixed(2) : '-'}
        </span>
      ),
    },
    {
      key: 'appliedAt',
      label: t('appliedRules.columns.appliedAt'),
      align: 'center',
      width: '85px',
      render: (val: unknown) => (
        <span className="font-semibold text-slate-700 text-xs whitespace-nowrap">
          {val ? new Date(val as string).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'mr' ? 'mr-IN' : 'hi-IN') : '-'}
        </span>
      ),
    },
  ];

  return columns;
}
