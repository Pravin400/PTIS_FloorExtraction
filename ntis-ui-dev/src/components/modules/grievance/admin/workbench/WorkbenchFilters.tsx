'use client';

/**
 * Workbench Filters Component
 * Path: src/components/modules/grievance/admin/workbench/WorkbenchFilters.tsx
 *
 * Implements the Workbench filter toolbar using the canonical
 * platform primitive @/components/common/AdvanceFilter.
 * Includes search with clear, Department, Officer, and Status selects,
 * sorting, date range, and filter reset.
 * Line ceiling: <= 200 lines.
 */

import { useMemo } from 'react';
import { Users, Filter } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { AdvanceFilter, type AdvanceFilterSelect } from '@/components/common/AdvanceFilter';
import type {
  DepartmentOption,
  DepartmentOfficerOption,
} from '@/types/grievance/admin-complaints.types';

interface WorkbenchFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  departmentId: number | 'all';
  onDepartmentChange: (dept: number | 'all') => void;
  departments: DepartmentOption[];
  officerId: number | 'all';
  onOfficerChange: (officer: number | 'all') => void;
  officers: DepartmentOfficerOption[];
  statusId: number | 'all';
  onStatusChange: (status: number | 'all') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (val: 'asc' | 'desc') => void;
  fromDate: string;
  onFromDateChange: (val: string) => void;
  toDate: string;
  onToDateChange: (val: string) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function WorkbenchFilters({
  search,
  onSearchChange,
  departmentId,
  onDepartmentChange,
  departments,
  officerId,
  onOfficerChange,
  officers,
  statusId,
  onStatusChange,
  sortOrder,
  onSortOrderChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  onReset,
  isLoading = false,
}: WorkbenchFiltersProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const selects: AdvanceFilterSelect[] = useMemo(
    () => [
      {
        id: 'officer',
        value: officerId,
        onChange: (val) => onOfficerChange(val === 'all' ? 'all' : Number(val)),
        placeholder: t('filterAllOfficers'),
        icon: Users,
        minWidthClass: 'min-w-[130px] sm:min-w-[155px]',
        options: officers.map((off) => ({
          value: off.id,
          label: off.name + (off.designation ? ` (${off.designation})` : ''),
        })),
      },
      {
        id: 'status',
        value: statusId,
        onChange: (val) => onStatusChange(val === 'all' ? 'all' : Number(val)),
        placeholder: t('filterAllStatuses'),
        icon: Filter,
        minWidthClass: 'min-w-[110px] sm:min-w-[130px]',
        options: [
          { value: 1, label: t('statusPending') },
          { value: 2, label: t('statusInProgress') },
          { value: 3, label: t('statusResolved') },
          { value: 4, label: t('statusClosed') },
        ],
      },
    ],
    [
      officerId,
      onOfficerChange,
      officers,
      statusId,
      onStatusChange,
      t,
    ]
  );

  return (
    <AdvanceFilter
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('searchWorkbenchPlaceholder')}
      searchWidthClass="w-full sm:w-44 md:w-52 shrink-0"
      clearSearchLabel={t('clearFilters')}
      department={{
        value: departmentId,
        onChange: (val) => onDepartmentChange(val === 'all' ? 'all' : Number(val)),
        departments,
        placeholder: t('filterAllDepartments'),
        locale,
      }}
      selects={selects}
      sort={{
        sortOrder,
        onSortOrderChange,
        descLabel: t('sortNewestFirst'),
        ascLabel: t('sortOldestFirst'),
        ariaLabel: t('sortOrderLabel'),
      }}
      dateRange={{
        fromDate,
        toDate,
        onFromDateChange,
        onToDateChange,
        fromLabel: t('fromDateLabel'),
        toLabel: t('toDateLabel'),
      }}
      onReset={onReset}
      resetLabel={t('clearFilters')}
      isLoading={isLoading}
    />
  );
}
