'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  Card,
  SearchInput,
  SearchSelect,
  useConfirm,
  MasterTable,
  EditButton,
  DeleteButton,
  AddButton,
} from '@/components/common';
import type {
  EmpTypeMasterItem,
  EmpTypeMasterPayload,
} from '@/types/payroll/MasterModule';
import {
  createEmpTypeMasterAction,
  updateEmpTypeMasterAction,
  deleteEmpTypeMasterAction,
} from '@/app/[locale]/payroll/organisation-masters/emp-type-master/action';
import { usePayrollMasterFilters, type MasterStatusFilter } from '@/hooks/payroll/usePayrollMasterFilters';
import { EmpTypeForm } from './EmpTypeForm';
import { getEmpTypeColumns } from './EmpTypeColumns';

export interface EmpTypeMasterProps {
  initialItems: EmpTypeMasterItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function EmpTypeMaster({
  initialItems = [],
  pageNumber: serverPageNumber = 1,
  pageSize = 10,
  totalCount: serverTotalCount = 0,
  totalPages: serverTotalPages = 1,
  sortBy: propsSortBy,
  sortOrder: propsSortOrder,
}: EmpTypeMasterProps): React.ReactElement {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('payrollEmployeeTypeMaster');
  const tCol = useTranslations('payrollEmployeeTypeMaster.table.columns');
  const tCommon = useTranslations('common');
  const { confirm } = useConfirm();

  const items = initialItems;

  const {
    search,
    handleSearchChange,
    statusFilter,
    handleStatusChange,
    pageNumber: page,
    handlePageChange,
    pageSize: currentPageSize,
    handlePageSizeChange,
  } = usePayrollMasterFilters({
    defaultPage: serverPageNumber,
    defaultPageSize: pageSize,
    defaultSortBy: propsSortBy,
    defaultSortOrder: propsSortOrder,
  });

  const [activeItem, setActiveItem] = useState<EmpTypeMasterItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: tCommon('status.all') },
      { value: 'active', label: tCommon('status.active') },
      { value: 'inactive', label: tCommon('status.inactive') },
    ],
    [tCommon]
  );

  /* ================= TABLE COLUMNS ================= */
  const columns = useMemo(
    () => getEmpTypeColumns(tCol, tCommon),
    [tCol, tCommon]
  );

  const existingCodes = useMemo(
    () => items.map((d) => d.employeeTypeCode),
    [items]
  );

  const handleSave = useCallback(
    async (payload: EmpTypeMasterPayload): Promise<boolean> => {
      try {
        if (activeItem) {
          const res = await updateEmpTypeMasterAction(activeItem.employeeTypeId, payload);
          if (res.success) {
            toast.success(t('messages.updateSuccess'));
            setIsDrawerOpen(false);
            setActiveItem(null);
            router.refresh();
            return true;
          } else {
            const isDuplicate =
              res.statusCode === 409 ||
              (res.statusCode === 400 && res.message?.toLowerCase().includes('already exists'));
            const errorMsg = isDuplicate
              ? t('apiErrors.duplicate')
              : (res.message || t('messages.updateFailed'));
            toast.error(errorMsg);
            return false;
          }
        } else {
          const res = await createEmpTypeMasterAction(payload);
          if (res.success) {
            toast.success(t('messages.createSuccess'));
            setIsDrawerOpen(false);
            setActiveItem(null);
            router.refresh();
            return true;
          } else {
            const isDuplicate =
              res.statusCode === 409 ||
              (res.statusCode === 400 && res.message?.toLowerCase().includes('already exists'));
            const errorMsg = isDuplicate
              ? t('apiErrors.duplicate')
              : (res.message || t('messages.createFailed'));
            toast.error(errorMsg);
            return false;
          }
        }
      } catch (err: unknown) {
        toast.error((err as Error)?.message || t('messages.saveError'));
        return false;
      }
    },
    [activeItem, router, t]
  );

  const handleDelete = useCallback(
    (item: EmpTypeMasterItem) => {
      const displayName =
        locale === 'mr' && item.employeeTypeNameMarathi
          ? item.employeeTypeNameMarathi
          : item.employeeTypeName;

      confirm({
        variant: 'delete',
        title: t('deleteModal.title'),
        description: t('deleteModal.description', { name: displayName }),
        confirmText: t('deleteModal.confirm'),
        cancelText: t('deleteModal.cancel'),
        onConfirm: async () => {
          try {
            const res = await deleteEmpTypeMasterAction(item.employeeTypeId);
            if (res.success) {
              toast.success(t('messages.deleteSuccess'));
              router.refresh();
            } else {
              const msg =
                res.statusCode === 409
                  ? t('deleteModal.inUse', { name: displayName })
                  : res.message || t('messages.deleteFailed');
              toast.error(msg);
            }
          } catch (err: unknown) {
            toast.error((err as Error)?.message || t('messages.deleteError'));
          }
        },
      });
    },
    [confirm, locale, router, t]
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header Card */}
      <Card
        padding="none"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-2xs"
      >
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">{t('subtitle')}</p>
        </div>
      </Card>

      {/* Combined Card for Search, Status Filter, Add Button, and Table */}
      <Card
        padding="none"
        className="w-full border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden flex flex-col min-h-[450px]"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-4 border-b border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder={t('filters.searchPlaceholder')}
              className="mb-0 flex-1 sm:max-w-md w-full"
              inputClassName="h-9 py-1.5 text-xs rounded-xl border-slate-200"
            />
            <div className="w-full sm:w-44">
              <label htmlFor="status-filter" className="sr-only">
                {tCommon('status.all')}
              </label>
              <SearchSelect
                id="status-filter"
                name="statusFilter"
                options={statusOptions}
                value={statusFilter}
                onChange={(_name, val) => handleStatusChange(val as MasterStatusFilter)}
                placeholder={tCommon('status.all')}
                className="text-xs rounded-xl"
              />
            </div>
          </div>
          <AddButton
            size="sm"
            label={t('buttons.add')}
            onClick={() => {
              setActiveItem(null);
              setIsDrawerOpen(true);
            }}
            className="h-9 rounded-xl px-4 text-xs font-bold bg-blue-700 hover:bg-blue-800 shadow-2xs shrink-0 cursor-pointer w-full sm:w-auto"
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <MasterTable<EmpTypeMasterItem>
            columns={columns}
            data={items}
            height="lg"
            containerClassName="gap-0 [&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-t-none"
            pageNumber={page}
            pageSize={currentPageSize}
            totalCount={serverTotalCount}
            totalPages={serverTotalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            actionLabel={tCol('actions')}
            actionHeaderAlign="center"
            actionCellAlign="center"
            paginationConfig={{ enabled: true, showPageSizeSelector: true }}
            pageSizeOptions={[5, 10, 20, 50]}
            renderActions={(row) => (
              <div className="flex items-center justify-center gap-1.5">
                <EditButton
                  title={t('drawer.editTitle')}
                  aria-label={`Edit ${row.employeeTypeName}`}
                  onClick={() => {
                    setActiveItem(row);
                    setIsDrawerOpen(true);
                  }}
                />
                <DeleteButton
                  title={t('deleteModal.title')}
                  aria-label={`Delete ${row.employeeTypeName}`}
                  onClick={() => handleDelete(row)}
                />
              </div>
            )}
            getRowKey={(row) => row.employeeTypeId}
          />
        </div>
      </Card>

      <EmpTypeForm
        key={
          activeItem ? String(activeItem.employeeTypeId) : isDrawerOpen ? 'add-open' : 'add-closed'
        }
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSave}
        initialItem={activeItem}
        existingItems={items}
        existingCodes={existingCodes}
      />
    </div>
  );
}

export default EmpTypeMaster;
