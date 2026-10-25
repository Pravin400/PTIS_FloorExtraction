'use client';

import { MasterTable, type Column } from '@/components/common/MasterTable';
import { SearchInput } from '@/components/common/SearchInput';
import { AddButton, EditButton, DeleteButton } from '@/components/common/ActionButtons';
import type { TariffWorkbench } from '@/types/water-bill/tariff-workbench/tariffWorkbench.types';

interface TariffMasterTableProps {
  records: TariffWorkbench[];
  columns: Column<TariffWorkbench>[];
  loading: boolean;
  search: string;
  searchPlaceholder: string;
  addLabel: string;
  actionsLabel: string;
  editAriaLabel: string;
  deleteAriaLabel: string;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onSearchChange: (val: string) => void;
  onSearchSubmit: () => void;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  onAdd: () => void;
  onEdit: (row: TariffWorkbench) => void;
  onDelete: (row: TariffWorkbench) => void;
}

export function TariffMasterTable({
  records,
  columns,
  loading,
  search,
  searchPlaceholder,
  addLabel,
  actionsLabel,
  editAriaLabel,
  deleteAriaLabel,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onSearchChange,
  onSearchSubmit,
  onPageChange,
  onPageSizeChange,
  onAdd,
  onEdit,
  onDelete,
}: TariffMasterTableProps) {
  return (
    <MasterTable<TariffWorkbench>
      columns={columns}
      data={records}
      loading={loading}
      maxBodyHeightClassName="max-h-[500px]"
      getRowKey={(row) => String(row.id)}
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      paginationConfig={{ enabled: true, showPageSizeSelector: true }}
      pageSizeOptions={[10, 20, 30, 50]}
      headerExtra={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            onEnter={onSearchSubmit}
            placeholder={searchPlaceholder}
            className="mb-0 w-72 text-gray-900"
          />
          <AddButton label={addLabel} onClick={onAdd} />
        </div>
      }
      renderActions={(row) => (
        <div className="flex items-center gap-1 justify-center">
          <EditButton aria-label={editAriaLabel} onClick={() => onEdit(row)} />
          <DeleteButton aria-label={deleteAriaLabel} onClick={() => onDelete(row)} />
        </div>
      )}
      actionLabel={actionsLabel}
    />
  );
}
