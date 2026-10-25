'use client';

import { MasterTable, type Column } from '@/components/common/MasterTable';
import type { BankMasterTableRow } from '../BankColumns';
import type { BankMasterData } from '@/types/bank-master.types';

interface BankMasterTableProps {
  columns: Column<BankMasterTableRow>[];
  data: BankMasterData[];
  loading: boolean;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  renderActions: (row: BankMasterTableRow) => React.ReactNode;
}

export function BankMasterTable({
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
}: BankMasterTableProps) {
  return (
    <MasterTable<BankMasterTableRow>
      columns={columns}
      data={data as BankMasterTableRow[]}
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
      getRowKey={(row) => row.id}
    />
  );
}
