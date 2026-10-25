'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useConfirm, SearchInput, SearchSelect, AddButton, Card } from '@/components/common';
import type { SearchSelectOption } from '@/components/common';
import type { DeptMasterItem } from '@/types/payroll/MasterModule';
import { usePayrollMasterFilters, MasterStatusFilter } from '@/hooks/payroll';
import {
  createDeptMasterAction,
  updateDeptMasterAction,
  deleteDeptMasterAction,
} from '@/app/[locale]/payroll/organisation-masters/department-master/action';
import { DeptMasterTable } from './DeptMasterTable';
import { DeptMasterFormDrawer } from './DeptMasterFormDrawer';

export interface DeptMasterViewProps {
  initialItems: DeptMasterItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  existingCodes?: string[];
}

export function DeptMasterView({
  initialItems = [],
  pageNumber: serverPageNumber = 1,
  pageSize = 10,
  totalCount: serverTotalCount = 0,
  totalPages: serverTotalPages = 1,
  sortBy: propsSortBy,
  sortOrder: propsSortOrder,
  existingCodes: existingCodesProp,
}: DeptMasterViewProps): React.ReactElement {
  const router = useRouter();
  const { confirm } = useConfirm();
  const t = useTranslations('payrollDepartmentMaster');
  const tCommon = useTranslations('common');

  const {
    isPending,
    search,
    statusFilter,
    pageNumber,
    pageSize: activePageSize,
    handleSearchChange,
    handleStatusChange,
    handlePageChange,
    handlePageSizeChange,
  } = usePayrollMasterFilters({
    defaultPageSize: pageSize,
    defaultPage: serverPageNumber,
    defaultSortBy: propsSortBy,
    defaultSortOrder: propsSortOrder,
  });

  const items = initialItems;

  const mergedExistingCodes = useMemo(() => {
    const set = new Set<string>();
    if (existingCodesProp) {
      existingCodesProp.forEach((c) => set.add(c.trim().toUpperCase()));
    }
    items.forEach((item) => {
      if (item.departmentCode) {
        set.add(item.departmentCode.trim().toUpperCase());
      }
    });
    return Array.from(set);
  }, [existingCodesProp, items]);

  const statusOptions: SearchSelectOption[] = useMemo(
    () => [
      { label: tCommon('status.all'), value: 'all' },
      { label: tCommon('status.active'), value: 'active' },
      { label: tCommon('status.inactive'), value: 'inactive' },
    ],
    [tCommon]
  );

  const [activeItem, setActiveItem] = useState<DeptMasterItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDelete = (item: DeptMasterItem) => {
    confirm({
      variant: 'delete',
      title: t('delete.confirmTitle'),
      description: t('delete.confirmDescription', { name: item.departmentName }),
      confirmText: tCommon('confirm.delete.confirm'),
      cancelText: tCommon('confirm.cancel'),
      meta: { name: item.departmentName },
      onConfirm: async () => {
        const targetId = item.id ?? item.departmentId ?? item.departmentCode;
        const res = await deleteDeptMasterAction(String(targetId));
        if (!res.success) {
          const msg =
            res.statusCode === 409
              ? t('delete.deleteInUse', { name: item.departmentName })
              : res.message || tCommon('messages.deleteFailed');
          toast.error(msg);
          return;
        }
        toast.success(t('delete.success', { name: item.departmentName }));
        router.refresh();
      },
    });
  };

  const handleSave = async (data: Omit<DeptMasterItem, 'departmentId'>): Promise<boolean> => {
    if (activeItem) {
      const targetId = activeItem.id ?? activeItem.departmentId ?? activeItem.departmentCode;
      const res = await updateDeptMasterAction(String(targetId), data);
      if (!res.success) {
        toast.error(res.message || tCommon('messages.updateFailed'));
        return false;
      }
      toast.success(t('success.updated'));
      setIsDrawerOpen(false);
      setActiveItem(null);
      router.refresh();
      return true;
    } else {
      const res = await createDeptMasterAction(data);
      if (!res.success) {
        toast.error(res.message || tCommon('messages.createFailed'));
        return false;
      }
      toast.success(t('success.created'));
      setIsDrawerOpen(false);
      setActiveItem(null);
      router.refresh();
      return true;
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
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

      <Card
        padding="none"
        className="w-full border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden flex flex-col min-h-[450px]"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-4 border-b border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder={t('list.filters.searchPlaceholder')}
              className="mb-0 flex-1 sm:max-w-md w-full"
              inputClassName="h-9 py-1.5 text-xs rounded-xl border-slate-200"
            />
            <div className="w-full sm:w-44">
              <label htmlFor="dept-status-filter" className="sr-only">
                {tCommon('status.all')}
              </label>
              <SearchSelect
                id="dept-status-filter"
                name="deptStatusFilter"
                options={statusOptions}
                value={statusFilter}
                onChange={(_name, val) => handleStatusChange(val as MasterStatusFilter)}
                placeholder={tCommon('status.all')}
                className="text-xs rounded-xl"
              />
            </div>
          </div>
          <AddButton
            label={t('list.buttons.add')}
            size="sm"
            onClick={() => {
              setActiveItem(null);
              setIsDrawerOpen(true);
            }}
            className="h-9 rounded-xl px-4 text-xs font-bold bg-blue-700 hover:bg-blue-800 shadow-2xs shrink-0 cursor-pointer w-full sm:w-auto"
          />
        </div>

        <DeptMasterTable
          data={items}
          pageNumber={pageNumber}
          pageSize={activePageSize || pageSize}
          totalCount={serverTotalCount}
          totalPages={serverTotalPages ?? 1}
          isLoading={isPending}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={(item) => {
            setActiveItem(item);
            setIsDrawerOpen(true);
          }}
          onDelete={handleDelete}
        />
      </Card>

      <DeptMasterFormDrawer
        key={
          activeItem
            ? String(activeItem.id ?? activeItem.departmentId ?? activeItem.departmentCode)
            : isDrawerOpen
              ? 'add-open'
              : 'add-closed'
        }
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setActiveItem(null);
        }}
        onSave={handleSave}
        initialItem={activeItem}
        existingCodes={mergedExistingCodes}
      />
    </div>
  );
}
