'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { QualificationMasterItem } from '@/types/payroll/MasterModule';
import {
  MasterTable,
  EditButton,
  DeleteButton,
} from '@/components/common';

import { getQualificationMasterColumns } from './qualificationMasterColumns';

export interface QualificationMasterTableProps {
  data: QualificationMasterItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onEdit: (item: QualificationMasterItem) => void;
  onDelete: (item: QualificationMasterItem) => void;
}

export function QualificationMasterTable({
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
}: QualificationMasterTableProps): React.ReactElement {
  const t = useTranslations('payrollQualificationMaster');
  const tCommon = useTranslations('common');

  const columns = useMemo(
    () => getQualificationMasterColumns(t, tCommon),
    [t, tCommon]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <MasterTable<QualificationMasterItem>
        columns={columns}
        data={data}
        loading={isLoading}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        actionLabel={t('list.table.actions')}
        actionHeaderAlign="center"
        actionCellAlign="center"
        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
        pageSizeOptions={[5, 10, 20, 50]}
        renderActions={(row) => (
          <div className="flex items-center justify-center gap-1.5">
            <EditButton
              title={t('list.buttons.editTitle')}
              aria-label={`${t('list.buttons.editTitle')}: ${row.qualificationName}`}
              onClick={() => onEdit(row)}
            />
            <DeleteButton
              title={t('list.buttons.deleteTitle')}
              aria-label={`${t('list.buttons.deleteTitle')}: ${row.qualificationName}`}
              onClick={() => onDelete(row)}
            />
          </div>
        )}
        getRowKey={(row) => String(row.qualificationId ?? row.id ?? row.qualificationCode)}
      />
    </div>
  );
}

export default QualificationMasterTable;
