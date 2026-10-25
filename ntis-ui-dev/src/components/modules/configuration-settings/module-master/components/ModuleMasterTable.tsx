'use client';

import { MasterTable, type Column } from '@/components/common/MasterTable';
import type { ModuleMasterTableRow } from '../ModuleColumns';
import type { ModuleMaster } from '@/types/moduleMaster.types';

interface ModuleMasterTableProps {
  columns: Column<ModuleMasterTableRow>[];
  data: ModuleMaster[];
  loading: boolean;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  renderActions: (row: ModuleMasterTableRow) => React.ReactNode;
}

export function ModuleMasterTable({
  columns,
  data,
  loading,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  renderActions,
}: ModuleMasterTableProps) {
  return (
    <MasterTable<ModuleMasterTableRow>
      columns={columns}
      data={data as ModuleMasterTableRow[]}
      loading={loading}
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onPageSizeChange={(size: number) => onPageSizeChange(size)}
      isPagination={true}
      isPageSize={true}
      renderActions={renderActions}
      getRowKey={(row) => String(row.moduleId)}
    />
  );
}
