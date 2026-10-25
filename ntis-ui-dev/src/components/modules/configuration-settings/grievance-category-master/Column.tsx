'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { type Column } from '@/components/common';
import type { DepartmentMaster } from '@/types/departmentMaster.types';
import type { GrievanceCategory } from '@/types/grievance-category-master/grievanceCategory.types';
import {
  renderActions,
  renderCategoryCode,
  renderCategoryName,
  renderDepartment,
  renderDescription,
  renderEscalation,
  renderPriority,
  renderSla,
  renderStatus,
} from './ColumnRenderers';

type UseGrievanceCategoryColumnsParams = {
  locale: string;
  departments: DepartmentMaster[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  deletingId?: number | null;
  editingId?: number | null;
};

export function useGrievanceCategoryColumns({
  departments,
  onEdit,
  onDelete,
  deletingId,
  editingId,
}: UseGrievanceCategoryColumnsParams): Column<GrievanceCategory>[] {
  const t = useTranslations('grievanceCategory.list');
  const tPriorityOptions = useTranslations('grievanceCategory.options.priority');
  const tEscalationOptions = useTranslations('grievanceCategory.options.escalation');
  const tCommonStatus = useTranslations('common.status');
  const tCommonTable = useTranslations('common.table');

  const departmentMap = useMemo(() => {
    const map = new Map<number, string>();
    departments.forEach((dept) => {
      if (dept.departmentId) {
        map.set(dept.departmentId, dept.departmentName);
      }
    });
    return map;
  }, [departments]);

  return useMemo(() => {
    const cols: Column<GrievanceCategory>[] = [
      {
        key: 'categoryCode',
        label: t('headers.code'),
        headerClassName: 'hidden sm:table-cell',
        cellClassName: 'hidden sm:table-cell',
        render: renderCategoryCode,
      },
      {
        key: 'categoryName',
        label: t('headers.name'),
        render: renderCategoryName,
      },
      {
        key: 'departmentId',
        label: t('headers.department'),
        render: (value, row) => renderDepartment(value, row, departmentMap, t),
      },
      {
        key: 'priority',
        label: t('headers.priority'),
        headerClassName: 'hidden sm:table-cell',
        cellClassName: 'hidden sm:table-cell',
        render: (_, row) => renderPriority(row, tPriorityOptions),
      },
      {
        key: 'resolutionSla',
        label: t('headers.sla'),
        headerClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
        render: (_, row) => renderSla(row, t),
      },
      {
        key: 'escalationLevel',
        label: t('headers.escalation'),
        headerClassName: 'hidden lg:table-cell',
        cellClassName: 'hidden lg:table-cell',
        render: (_, row) => renderEscalation(row, tEscalationOptions),
      },
      {
        key: 'description',
        label: t('headers.description'),
        headerClassName: 'hidden xl:table-cell',
        cellClassName: 'hidden xl:table-cell',
        render: renderDescription,
      },
      {
        key: 'isActive',
        label: tCommonTable('columns.status'),
        render: (_, row) => renderStatus(row, tCommonStatus),
      },
    ];

    cols.push({
      key: 'id' as keyof GrievanceCategory,
      label: tCommonTable('columns.actions'),
      align: 'right',
      render: (_, row) => renderActions(row, onEdit, onDelete, deletingId, editingId),
    });

    return cols;
  }, [
    departmentMap,
    t,
    tCommonStatus,
    tCommonTable,
    tEscalationOptions,
    tPriorityOptions,
    onEdit,
    onDelete,
    deletingId,
    editingId,
  ]);
}
