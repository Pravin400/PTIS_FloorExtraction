'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useTransition, useCallback, useMemo } from 'react';
import { MasterTable } from '@/components/common/MasterTable';
import type { Column } from '@/components/common/MasterTable';
import { PageContainer } from '@/components/common/PageContainer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SearchInput } from '@/components/common/SearchInput';
import { AddButton, EditButton, DeleteButton } from '@/components/common/ActionButtons';
import { useDebounce } from '@/hooks/useDebounce';
import type { TariffChargeData } from '@/types/water-bill/tariff-workbench/tariffWorkbench.types';
import type { TariffChargePagedResponse } from '@/lib/api/water-bill/tariff-workbench/tariffChargeDetail.service';
import { TariffChargeDetailForm } from './TariffChargeDetailForm';
import type { TariffChargeDetailFormData, TariffChargeLookupOption } from './TariffChargeDetailForm';
import { useToast, useConfirm } from '@/components/common';

export type { TariffChargeData };

export interface TariffChargeDetailsProps {
  locale?: string;
  pagedData?: TariffChargePagedResponse;
  initialData?: TariffChargeData[];
  initialSearchTerm?: string;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  /** 'edit' when the edit drawer should open on mount */
  drawer?: 'edit' | 'add' | null;
  /** The record pre-fetched for editing */
  initialEditingData?: TariffChargeData | null;
  tariffOptions?: TariffChargeLookupOption[];
  chargeHeadOptions?: TariffChargeLookupOption[];
  geographyUnitOptions?: TariffChargeLookupOption[];
  updateAction?: (id: number, data: Partial<TariffChargeData>) => Promise<{ success: boolean; message?: string }>;
  createAction?: (data: Partial<TariffChargeData>) => Promise<{ success: boolean; message?: string }>;
  deleteAction?: (id: number) => Promise<{ success: boolean; message?: string }>;
}

export function TariffChargeDetails({
  locale = 'en',
  pagedData,
  initialData,
  initialSearchTerm,
  initialSortBy,
  initialSortOrder,
  drawer = null,
  initialEditingData = null,
  tariffOptions = [],
  chargeHeadOptions = [],
  geographyUnitOptions = [],
  updateAction,
  createAction,
  deleteAction,
}: TariffChargeDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations('tariffWorkbench');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState(initialSearchTerm || '');
  const debouncedSearch = useDebounce(search, 1000);
  const isFirstMount = useRef(true);

  const [sortBy] = useState<string | undefined>(initialSortBy);
  const [sortOrder] = useState<'asc' | 'desc' | undefined>(initialSortOrder);

  const records = useMemo(
    () => pagedData?.items ?? initialData ?? [],
    [pagedData, initialData]
  );

  const pageNumber = pagedData?.pageNumber ?? 1;
  const pageSize = pagedData?.pageSize ?? 10;
  const totalCount = pagedData?.totalCount ?? records.length;
  const totalPages = pagedData?.totalPages && pagedData.totalPages > 0
    ? pagedData.totalPages
    : Math.ceil(totalCount / pageSize) || 1;

  const navigateWithParams = useCallback(
    (newPage: number, newPageSize: number, newSearch?: string) => {
      const params = new URLSearchParams();
      params.set('pageNumber', String(newPage));
      params.set('pageSize', String(newPageSize));
      if (newSearch) params.set('searchTerm', newSearch);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);
      startTransition(() => {
        router.push(`/${locale}/water-bill/tariff-workbench/charge-details?${params.toString()}`);
      });
    },
    [locale, router, sortBy, sortOrder]
  );

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const trimmedDebounced = debouncedSearch.trim();
    const currentTrimmed = (initialSearchTerm || '').trim();
    if (trimmedDebounced !== currentTrimmed) {
      navigateWithParams(1, pageSize, trimmedDebounced || undefined);
    }
  }, [debouncedSearch, initialSearchTerm, navigateWithParams, pageSize]);

  const handleSearchChange = (value: string) => setSearch(value);
  const handleSearchSubmit = () => navigateWithParams(1, pageSize, search.trim() || undefined);
  const handlePageChange = (p: number) => navigateWithParams(p, pageSize, search.trim() || undefined);
  const handlePageSizeChange = (size: number) => navigateWithParams(1, size, search.trim() || undefined);

  const handleAdd = () => router.push(`/${locale}/water-bill/tariff-workbench/charge-details/add`);
  const handleEdit = (row: TariffChargeData) => router.push(`/${locale}/water-bill/tariff-workbench/charge-details/edit/${row.id}`);
  const handleFormClose = () => router.push(`/${locale}/water-bill/tariff-workbench/charge-details${search ? `?searchTerm=${encodeURIComponent(search)}` : ''}`);

  const handleFormSubmit = async (data: TariffChargeDetailFormData) => {
    setIsSubmitting(true);
    try {
      let result: { success: boolean; message?: string } | undefined;
      const payload = {
        ...data,
        amount: data.amount === "" ? 0 : data.amount,
        sequenceNo: data.sequenceNo === "" ? 0 : data.sequenceNo,
        isDynamic: data.isDynamic === "" ? false : data.isDynamic,
        isMandatory: data.isMandatory === "" ? false : data.isMandatory,
      } as Partial<TariffChargeData>;

      if (drawer === 'edit' && initialEditingData?.id && updateAction) {
        result = await updateAction(initialEditingData.id, payload);
      } else if (createAction) {
        result = await createAction(payload);
      }
      if (result?.success) {
        toast.success(result.message || (drawer === 'edit' ? t('messages.updateSuccess') : t('messages.createSuccess')));
        handleFormClose();
        startTransition(() => router.refresh());
      } else {
        toast.error(result?.message || tCommon('errors.unexpectedError'));
      }
    } catch {
      toast.error(tCommon('errors.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (row: TariffChargeData) => {
    confirm({
      variant: 'delete',
      title: t('confirm.deleteChargeDetailTitle') || t('confirm.deleteTitle'),
      description: t('confirm.deleteChargeDetailDescription') || t('confirm.deleteDescription'),
      meta: { name: row.chargeHeadName || row.tariffName || String(row.id), id: row.id },
      onConfirm: async () => {
        if (!deleteAction) {
          toast.error(t('errors.noDeleteAction'));
          return;
        }
        try {
          const result = await deleteAction(row.id);
          if (result.success) {
            toast.success(result.message || t('messages.deleteSuccess'));
            startTransition(() => router.refresh());
          } else {
            toast.error(result.message || tCommon('errors.unexpectedError'));
          }
        } catch {
          toast.error(tCommon('errors.unexpectedError'));
        }
      },
    });
  };

  const columns: Column<TariffChargeData>[] = [
    { key: "tariffName", label: t("table.tariffName"), align: "center" },
    {
      key: "chargeHeadName",
      label: t("table.chargeHeadName"),
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 shadow-2xs">
            {row.chargeHeadName || "-"}
          </span>
        </div>
      )
    },
    {
      key: "geographyUnitName",
      label: t("table.geographyUnit"),
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs">
            {row.geographyUnitName || "-"}
          </span>
        </div>
      )
    },
    { key: "amount", label: t("table.amount"), align: "center" },
    {
      key: "isDynamic",
      label: t("table.isDynamic"),
      align: "center",
      render: (v) => (
        <div className="flex items-center justify-center w-full">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${v ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {v ? t("table.yes") : t("table.no")}
          </span>
        </div>
      )
    },
    {
      key: "isMandatory",
      label: t("table.isMandatory"),
      align: "center",
      render: (v) => (
        <div className="flex items-center justify-center w-full">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${v ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {v ? t("table.yes") : t("table.no")}
          </span>
        </div>
      )
    },
    { key: "sequenceNo", label: t("table.sequenceNo"), align: "center" },
    {
      key: "isActive",
      label: t("table.status") || "Status",
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <StatusBadge value={row.isActive} activeLabel={tCommon("status.active")} inactiveLabel={tCommon("status.inactive")} />
        </div>
      )
    },
  ];

  return (
    <PageContainer>
      <MasterTable<TariffChargeData>
        data={records}
        columns={columns}
        loading={isPending}
        getRowKey={(row) => String(row.id)}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
        pageSizeOptions={[10, 20, 30, 50]}
        headerExtra={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              onEnter={handleSearchSubmit}
              placeholder={t("searchPlaceholder")}
              className="mb-0 w-72 text-gray-900"
            />
            <AddButton
              label={t("addChargeDetailTitle")}
              onClick={handleAdd}
            />
          </div>
        }
        actionLabel={tCommon("table.columns.actions")}
        renderActions={(row) => (
          <div className="flex items-center gap-1 justify-center">
            <EditButton
              aria-label={tCommon("table.actions.edit")}
              onClick={() => handleEdit(row)}
            />
            <DeleteButton
              aria-label={tCommon("table.actions.delete")}
              onClick={() => handleDelete(row)}
            />
          </div>
        )}
      />
      <TariffChargeDetailForm
        open={drawer === 'edit' || drawer === 'add'}
        initialData={initialEditingData}
        nextSequenceNo={1}
        tariffOptions={tariffOptions}
        chargeHeadOptions={chargeHeadOptions}
        geographyUnitOptions={geographyUnitOptions}
        isSubmitting={isSubmitting}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </PageContainer>
  );
}
