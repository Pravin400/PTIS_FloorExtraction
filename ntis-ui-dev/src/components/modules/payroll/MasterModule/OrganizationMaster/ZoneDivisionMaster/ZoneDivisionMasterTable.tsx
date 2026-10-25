'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type {
  ZoneDivisionMasterItem,
  ZoneDivisionMasterTableProps,
} from '@/types/payroll/MasterModule';
import { MasterTable, type Column, EditButton, DeleteButton } from '@/components/common';
import { getZoneDivisionColumns } from './ZoneDivisionColumns';

export type { ZoneDivisionMasterTableProps };

export function ZoneDivisionMasterTable({
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
}: ZoneDivisionMasterTableProps): React.ReactElement {
  const t = useTranslations('payrollZoneDivisionMaster');
  const tCol = useTranslations('payrollZoneDivisionMaster.table.columns');
  const tCommon = useTranslations('common');

  const columns: Column<ZoneDivisionMasterItem>[] = useMemo(
    () => getZoneDivisionColumns(tCol, tCommon),
    [tCol, tCommon]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <MasterTable<ZoneDivisionMasterItem>
        columns={columns}
        data={data}
        loading={isLoading}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        actionLabel={tCol('actions')}
        actionHeaderAlign="center"
        actionCellAlign="center"
        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
        pageSizeOptions={[5, 10, 20, 50]}
        renderActions={(row) => (
          <div className="flex items-center justify-center gap-1.5">
            <EditButton
              title={t('drawer.editTitle')}
              aria-label={t('table.actions.editAria', { name: row.zoneDivisionName })}
              onClick={() => onEdit(row)}
            />
            <DeleteButton
              title={t('deleteModal.title')}
              aria-label={t('table.actions.deleteAria', { name: row.zoneDivisionName })}
              onClick={() => onDelete(row)}
            />
          </div>
        )}
        getRowKey={(row) => String(row.zoneDivisionId ?? row.id ?? row.zoneDivisionCode)}
      />
    </div>
  );
}

export default ZoneDivisionMasterTable;
