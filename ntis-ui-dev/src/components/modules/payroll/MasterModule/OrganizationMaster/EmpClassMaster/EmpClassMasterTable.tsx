'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type {
  EmpClassMasterItem,
  EmpClassMasterTableProps,
} from '@/types/payroll/MasterModule';
import { MasterTable, type Column, EditButton, DeleteButton } from '@/components/common';
import { getEmpClassColumns } from './EmpClassColumns';

export type { EmpClassMasterTableProps };

export function EmpClassMasterTable({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: EmpClassMasterTableProps): React.ReactElement {
  const t = useTranslations('payrollEmployeeClassMaster');
  const tCommon = useTranslations('common');

  const columns: Column<EmpClassMasterItem>[] = useMemo(
    () => getEmpClassColumns(t, tCommon),
    [t, tCommon]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <MasterTable<EmpClassMasterItem>
        columns={columns}
        data={data}
        loading={isLoading}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        actionLabel={t('table.columns.actions')}
        actionHeaderAlign="center"
        actionCellAlign="center"
        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
        pageSizeOptions={[5, 10, 20, 50]}
        renderActions={(row) => (
          <div className="flex items-center justify-center gap-1.5">
            <EditButton
              title={t('drawer.editTitle')}
              aria-label={t('table.actions.editAria', { name: row.className })}
              onClick={() => onEdit(row)}
            />
            <DeleteButton
              title={t('deleteModal.title')}
              aria-label={t('table.actions.deleteAria', { name: row.className })}
              onClick={() => onDelete(row)}
            />
          </div>
        )}
        getRowKey={(row) => String(row.employeeClassId ?? row.id ?? row.classCode)}
      />
    </div>
  );
}

export default EmpClassMasterTable;
