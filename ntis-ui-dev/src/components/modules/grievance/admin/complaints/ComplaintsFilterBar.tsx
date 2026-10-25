'use client';

/**
 * Complaints Filter Bar Component
 * Path: src/components/modules/grievance/admin/complaints/ComplaintsFilterBar.tsx
 *
 * Filter toolbar for grievance complaints table.
 * Composes the generic `@/components/common/AdvanceFilter` primitive.
 * Line ceiling: <= 300 lines.
 */

import { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { AdvanceFilter, type AdvanceFilterSelect } from '@/components/common';
import type { DepartmentOption } from '@/types/grievance/admin-complaints.types';

interface ComplaintsFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  departmentId: number | 'all';
  onDepartmentChange: (val: number | 'all') => void;
  departments: DepartmentOption[];
  statusId: number | 'all';
  onStatusChange: (val: number | 'all') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (val: 'asc' | 'desc') => void;
  fromDate: string;
  onFromDateChange: (val: string) => void;
  toDate: string;
  onToDateChange: (val: string) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function ComplaintsFilterBar({
  search,
  onSearchChange,
  departmentId,
  onDepartmentChange,
  departments,
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
}: ComplaintsFilterBarProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const selects: AdvanceFilterSelect[] = useMemo(
    () => [
      {
        id: 'status',
        value: statusId,
        onChange: (val) => onStatusChange(val === 'all' ? 'all' : Number(val)),
        placeholder: t('allStatusOption'),
        icon: Filter,
        minWidthClass: 'min-w-[120px] sm:min-w-[140px]',
        options: [
          { value: 1, label: t('statusPending') },
          { value: 2, label: t('statusInProgress') },
          { value: 3, label: t('statusResolved') },
          { value: 4, label: t('statusClosed') },
        ],
      },
    ],
    [statusId, onStatusChange, t]
  );

  return (
    <AdvanceFilter
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('searchComplaintsPlaceholder')}
      clearSearchLabel={t('clearSearch')}
      department={{
        value: departmentId,
        onChange: (val) => onDepartmentChange(val === 'all' ? 'all' : Number(val)),
        departments,
        placeholder: t('allDepartmentsOption'),
        minWidthClass: 'min-w-[150px] sm:min-w-[180px]',
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
