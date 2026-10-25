'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useConfirm, SearchInput, SearchSelect, AddButton, Card } from '@/components/common';
import type { SearchSelectOption } from '@/components/common';
import type { ZoneDivisionMasterItem, ZoneDivisionMasterPayload, ZoneDivisionMasterViewProps } from '@/types/payroll/MasterModule';
import { usePayrollMasterFilters, MasterStatusFilter } from '@/hooks/payroll';
import {
  createZoneDivisionMasterAction,
  updateZoneDivisionMasterAction,
  deleteZoneDivisionMasterAction,
} from '@/app/[locale]/payroll/organisation-masters/zone-division-master/action';
import { ZoneDivisionMasterTable } from './ZoneDivisionMasterTable';
import { ZoneDivisionMasterFormDrawer } from './ZoneDivisionMasterFormDrawer';

export type { ZoneDivisionMasterViewProps };

export function ZoneDivisionMasterView({
  initialItems = [],
  pageNumber: serverPageNumber = 1,
  pageSize = 10,
  totalCount: serverTotalCount = 0,
  totalPages: serverTotalPages = 1,
  sortBy: propsSortBy,
  sortOrder: propsSortOrder,
}: ZoneDivisionMasterViewProps): React.ReactElement {
  const router = useRouter();
  const { confirm } = useConfirm();
  const t = useTranslations('payrollZoneDivisionMaster');
  const tCommon = useTranslations('common');

  const {
    isPending, search, statusFilter, pageNumber, pageSize: activePageSize,
    handleSearchChange, handleStatusChange, handlePageChange, handlePageSizeChange,
  } = usePayrollMasterFilters({
    defaultPageSize: pageSize,
    defaultPage: serverPageNumber,
    defaultSortBy: propsSortBy,
    defaultSortOrder: propsSortOrder,
  });

  const items = initialItems;

  const statusOptions: SearchSelectOption[] = useMemo(
    () => [
      { label: tCommon('status.all'), value: 'all' },
      { label: tCommon('status.active'), value: 'active' },
      { label: tCommon('status.inactive'), value: 'inactive' },
    ],
    [tCommon]
  );

  const [activeItem, setActiveItem] = useState<ZoneDivisionMasterItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const existingCodes = useMemo(() => items.map((d) => d.zoneDivisionCode), [items]);

  const handleDelete = (item: ZoneDivisionMasterItem) => {
    confirm({
      variant: 'delete',
      title: t('deleteModal.title'),
      description: t('deleteModal.description', { name: item.zoneDivisionName }),
      confirmText: t('deleteModal.confirm'),
      cancelText: t('deleteModal.cancel'),
      meta: { name: item.zoneDivisionName },
      onConfirm: async () => {
        const targetId = item.zoneDivisionId || item.id || item.zoneDivisionCode;
        const res = await deleteZoneDivisionMasterAction(String(targetId));
        if (!res.success) {
          const msg = res.statusCode === 409
            ? t('deleteModal.inUse', { name: item.zoneDivisionName })
            : t('messages.deleteFailed');
          toast.error(msg);
          return;
        }
        toast.success(t('messages.deleteSuccess'));
        router.refresh();
      },
    });
  };

  const handleSave = async (data: ZoneDivisionMasterPayload): Promise<boolean> => {
    const isEdit = Boolean(activeItem);
    const targetId = activeItem?.zoneDivisionId || activeItem?.id || activeItem?.zoneDivisionCode;
    const res = isEdit
      ? await updateZoneDivisionMasterAction(String(targetId), data)
      : await createZoneDivisionMasterAction(data);

    if (!res.success) {
      const errorMsg = res.statusCode === 409
        ? t('apiErrors.duplicate')
        : t(isEdit ? 'messages.updateFailed' : 'messages.createFailed');
      toast.error(errorMsg);
      return false;
    }
    toast.success(t(isEdit ? 'messages.updateSuccess' : 'messages.createSuccess'));
    router.refresh();
    return true;
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Card padding="none" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">{t('title')}</h1>
          <p className="text-xs text-slate-600 mt-0.5">{t('subtitle')}</p>
        </div>
      </Card>

      <Card padding="none" className="w-full border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden flex flex-col min-h-[450px]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-4 border-b border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder={t('filters.searchPlaceholder')}
              aria-label={t('filters.searchPlaceholder')}
              className="mb-0 flex-1 sm:max-w-md w-full"
              inputClassName="h-9 py-1.5 text-xs rounded-xl border-slate-200"
            />
            <div className="w-full sm:w-44">
              <label htmlFor="zone-status-filter" className="sr-only">
                {t('filters.status')}
              </label>
              <SearchSelect
                id="zone-status-filter"
                name="zoneStatusFilter"
                options={statusOptions}
                value={statusFilter}
                onChange={(_name, val) => handleStatusChange(val as MasterStatusFilter)}
                placeholder={tCommon('status.all')}
                className="text-xs rounded-xl"
              />
            </div>
          </div>
          <AddButton
            label={t('buttons.add')}
            size="sm"
            onClick={() => {
              setActiveItem(null);
              setIsDrawerOpen(true);
            }}
            className="h-9 rounded-xl px-4 text-xs font-bold bg-blue-700 hover:bg-blue-800 shadow-2xs shrink-0 cursor-pointer w-full sm:w-auto"
          />
        </div>

        <ZoneDivisionMasterTable
          data={items}
          pageNumber={pageNumber}
          pageSize={activePageSize || pageSize}
          totalCount={serverTotalCount}
          totalPages={serverTotalPages}
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

      <ZoneDivisionMasterFormDrawer
        key={
          activeItem
            ? String(activeItem.zoneDivisionId || activeItem.id || activeItem.zoneDivisionCode)
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
        existingItems={items}
        existingCodes={existingCodes}
      />
    </div>
  );
}

export default ZoneDivisionMasterView;
