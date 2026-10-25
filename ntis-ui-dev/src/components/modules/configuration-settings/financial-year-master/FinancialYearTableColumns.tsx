"use client";


import { Calendar, CheckCircle2 } from 'lucide-react';
import { Badge, EditButton } from '@/components/common';
import { FinancialYear } from '@/types/financialYear.types';
import { formatNumericDate } from '@/lib/utils/format';

export const calculateDuration = (
  startDate: string | null, 
  endDate: string | null,
  t?: (key: string, values?: Record<string, string | number>) => string
): string => {
  if (!startDate || !endDate) return '-';
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return t ? t('days', { count: days }) : `${days} days`;
};


interface ColumnProps {
  t: (key: string) => string;
  tCommon: (key: string) => string;
  handleEdit: (id: number) => void;
  handleSetCurrent: (id: number) => void;
  handleClose: (id: number) => void;
  handleDelete: (id: number) => void;
  loadingState: { id: number; action: 'setCurrent' | 'close' | 'delete' | 'edit' } | null;
}

export const getFinancialYearColumns = ({
  t,
  tCommon,
  handleEdit,
  handleSetCurrent: _handleSetCurrent,
  handleClose: _handleClose,
  handleDelete: _handleDelete,
  loadingState,
}: ColumnProps) => [
  {
    key: 'yearCode',
    label: t('table.columns.code'),
    render: (value: unknown) => (
      <Badge variant="outline" className="font-mono bg-violet-50 text-violet-700 border-violet-200 inline-flex items-center justify-center min-w-[70px] cursor-default shadow-sm py-1">
        {(value as string) || 'N/A'}
      </Badge>
    ),
  },
  {
    key: 'year',
    label: t('table.columns.financialYear'),
    render: (_: unknown, row: FinancialYear) => (
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="p-2.5 bg-gradient-to-br from-violet-100 to-violet-200 rounded-lg shadow-sm shrink-0 border border-violet-200">
          <Calendar className="w-4.5 h-4.5 text-violet-700" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-slate-900 leading-tight">{t('table.columns.financialYear')} {row.year}-{row.year + 1}</span>
          {row.description && <span className="text-[11px] text-slate-500 line-clamp-1 break-all mt-0.5">{row.description}</span>}
        </div>
      </div>
    ),
  },
  {
    key: 'startDate',
    label: t('table.columns.period'),
    render: (_: unknown, row: FinancialYear) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-slate-700 tabular-nums leading-none">{formatNumericDate(row.startDate)}</span>
        <span className="text-[11px] text-slate-400 font-medium tabular-nums">{tCommon('table.to')} {formatNumericDate(row.endDate)}</span>
      </div>
    ),
  },
  {
    key: 'duration',
    label: t('table.columns.duration'),
    render: (_: unknown, row: FinancialYear) => (
      <Badge variant="outline" className="text-[11px] font-medium border-slate-200 px-2.5 py-1 cursor-default bg-slate-50/50">
        {calculateDuration(row.startDate, row.endDate, t)}
      </Badge>
    ),
  },
  {
    key: 'isActive',
    label: t('table.columns.current'),
    className: "text-center",
    render: (value: unknown) => (value as boolean) ? (
      <Badge 
        icon={CheckCircle2}
        className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1.5 cursor-default shadow-sm border font-bold !gap-1.5"
      >
        {t('table.columns.current')}
      </Badge>
    ) : null,
  },

  {
    key: 'actions',
    label: t('table.columns.actions'),
    className: "text-right min-w-[150px]",
    headerClassName: "text-right",
    render: (_: unknown, row: FinancialYear) => {
      const isAnyLoading = loadingState?.id === row.id;
      
      return (
        <div className="flex justify-end items-center gap-2">
          <EditButton 
            onClick={() => handleEdit(row.id)} 
            disabled={isAnyLoading} 
            className="shadow-sm border border-slate-200 hover:shadow-md transition-all active:scale-95 cursor-pointer h-10 w-10 flex items-center justify-center bg-white !p-0" 
          />
        </div>
      );
    },
  },
];
