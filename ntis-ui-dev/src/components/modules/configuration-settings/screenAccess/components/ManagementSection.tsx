'use client';

import React from 'react';
import { MasterTable, type Column } from '@/components/common/MasterTable';
import { SearchInput } from '@/components/common/SearchInput';
import { Select } from '@/components/common/select';
import { Button } from '@/components/common/ActionButton';
import { Plus } from 'lucide-react';
import type { PaginationData } from '@/types/screen-access.types';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
}

interface ManagementSectionProps<T> {
  data: T[];
  columns: Column<T & Record<string, unknown>>[];
  pagination: PaginationData;
  searchTerm: string;
  onSearch: (term: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onAdd: () => void;
  searchPlaceholder?: string;
  addButtonLabel?: string;
  filters?: FilterConfig[];
  renderActions?: (row: T) => React.ReactNode;
  isPending?: boolean;
}

export function ManagementSection<T>({
  data,
  columns,
  pagination,
  searchTerm,
  onSearch,
  onPageChange,
  onPageSizeChange,
  onAdd,
  searchPlaceholder,
  addButtonLabel,
  filters = [],
  renderActions,
  isPending,
}: ManagementSectionProps<T>) {
  return (
    <div className="flex flex-col space-y-4 h-full overflow-hidden">
      {/* Header Actions: Search, Filters, Add Button */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-50/30 p-3 rounded-lg border border-gray-100">
        <SearchInput
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={onSearch}
          className="mb-0 flex-1 max-w-sm text-gray-700 bg-white"
        />

        {filters.map((filter, index) => (
          <Select
            key={filter.id || `filter-${filter.placeholder || index}`}
            value={filter.value}
            onChange={(_, value) => filter.onChange(value)}
            options={filter.options}
            className={filter.className || 'w-48'}
            placeholder={filter.placeholder}
            ariaLabel={filter.ariaLabel}
          />
        ))}

        <Button onClick={onAdd} className="ml-auto gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          {addButtonLabel}
        </Button>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <MasterTable
          data={data as (T & Record<string, unknown>)[]}
          columns={columns}
          pageNumber={pagination.pageNumber}
          pageSize={pagination.pageSize}
          totalCount={pagination.totalCount}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isPagination={true}
          isPageSize={true}
          loading={isPending}
          renderActions={renderActions}
        />
      </div>
    </div>
  );
}
