import { type ReactNode } from 'react';
import { Badge, StatusBadge } from '@/components/common';
import { GrievanceCategoryActions } from './GrievanceCategoryActions';
import type { GrievanceCategory } from '@/types/grievance-category-master/grievanceCategory.types';
import {
  getLocalizedEscalationLabel,
  getLocalizedPriorityLabel,
  getPriorityStyles,
} from './ColumnUtils';

export const renderCategoryCode = (value: unknown): ReactNode => (
  <code className="px-2 py-1 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-black border border-slate-200 tracking-wider">
    {String(value)}
  </code>
);

export const renderCategoryName = (value: unknown): ReactNode => (
  <div className="flex flex-col max-w-[300px]">
    <span
      className="font-bold text-slate-900 leading-tight line-clamp-3"
      title={String(value)}
    >
      {String(value)}
    </span>
  </div>
);

export const renderDepartment = (
  value: unknown,
  row: GrievanceCategory,
  departmentMap: Map<number, string>,
  t: (key: string, params?: Record<string, string | number | Date>) => string
): ReactNode => {
  const deptId = Number(value);
  let displayName = row.departmentName;

  if (!displayName) {
    if (deptId === 0) {
      displayName = t('fallback.notAssigned');
    } else {
      displayName = departmentMap.get(deptId) || t('fallback.idNotFound', { id: deptId });
    }
  }

  return (
    <span className="text-sm font-medium text-slate-600">{displayName}</span>
  );
};

export const renderPriority = (
  row: GrievanceCategory,
  tPriorityOptions: (key: string) => string
): ReactNode => (
  <Badge
    className={`${getPriorityStyles(row.priority || '')} border transition-transform duration-300 hover:scale-105 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full`}
  >
    {getLocalizedPriorityLabel(row.priority || '', tPriorityOptions)}
  </Badge>
);

export const renderSla = (row: GrievanceCategory, t: (key: string) => string): ReactNode => (
  <div className="flex items-center gap-1.5">
    <span className="text-slate-900 font-black text-sm tabular-nums">
      {row.resolutionSla || '0'}
    </span>
    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
      {t('days')}
    </span>
  </div>
);

export const renderEscalation = (
  row: GrievanceCategory,
  tEscalationOptions: (key: string) => string
): ReactNode => (
  <Badge
    variant="secondary"
    className="bg-slate-100 text-slate-600 border-none text-[10px] font-bold px-2 py-0.5 rounded-md"
  >
    {row.escalationLevel
      ? getLocalizedEscalationLabel(row.escalationLevel, tEscalationOptions)
      : '-'}
  </Badge>
);

export const renderStatus = (
  row: GrievanceCategory,
  tCommonStatus: (key: string) => string
): ReactNode => (
  <StatusBadge
    value={row.isActive}
    activeLabel={tCommonStatus('active')}
    inactiveLabel={tCommonStatus('inactive')}
    className="shadow-xs"
  />
);

export const renderActions = (
  row: GrievanceCategory,
  onEdit: (id: number) => void,
  onDelete: (id: number) => void,
  deletingId?: number | null,
  editingId?: number | null
): ReactNode => (
  <GrievanceCategoryActions
    categoryId={row.id}
    onEdit={onEdit}
    onDelete={onDelete}
    isDeleting={deletingId === row.id}
    isEditing={editingId === row.id}
  />
);

export const renderDescription = (value: unknown): ReactNode => (
  <div className="max-w-[200px]">
    <span
      className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic break-all [word-break:break-all]"
      title={value ? String(value) : ''}
    >
      {value ? String(value) : '-'}
    </span>
  </div>
);
