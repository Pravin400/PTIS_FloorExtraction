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
import type { TariffSlabData } from '@/types/water-bill/tariff-workbench/tariffWorkbench.types';
import type { TariffSlabPagedResponse } from '@/lib/api/water-bill/tariff-workbench/tariffSlabDetail.service';
import { TariffSlabForm } from './TariffSlabForm';
import type { TariffSlabFormData, TariffSlabLookupOption } from './TariffSlabForm';
import { useToast, useConfirm } from '@/components/common';

export type { TariffSlabData };

export interface TariffSlabsProps {
  locale?: string;
  pagedData?: TariffSlabPagedResponse;
  initialData?: TariffSlabData[];
  initialSearchTerm?: string;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  initialTariffId?: number;
  /** 'edit' when the edit drawer should open on mount */
  drawer?: 'edit' | 'add' | null;
  /** The record pre-fetched for editing */
  initialEditingData?: TariffSlabData | null;
  tariffOptions?: TariffSlabLookupOption[];
  geographyUnitOptions?: TariffSlabLookupOption[];
  updateAction?: (id: number, data: Partial<TariffSlabData>) => Promise<{ success: boolean; message?: string }>;
  createAction?: (data: Partial<TariffSlabData>) => Promise<{ success: boolean; message?: string }>;
  deleteAction?: (id: number) => Promise<{ success: boolean; message?: string }>;
}

export function TariffSlabs({
  locale = 'en',
  pagedData,
  initialData,
  initialSearchTerm,
  initialSortBy,
  initialSortOrder,
  initialTariffId,
  drawer = null,
  initialEditingData = null,
  tariffOptions = [],
  geographyUnitOptions = [],
  updateAction,
  createAction,
  deleteAction,
}: TariffSlabsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations('tariffWorkbench');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const { confirm } = useConfirm();

  const [tariffId, setTariffId] = useState<number | undefined>(initialTariffId);
  const [prevInitialTariffId, setPrevInitialTariffId] = useState(initialTariffId);

  if (initialTariffId !== prevInitialTariffId) {
    setPrevInitialTariffId(initialTariffId);
    setTariffId(initialTariffId);
  }

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
    (newPage: number, newPageSize: number, newSearch?: string, newTariffId?: number | null) => {
      const params = new URLSearchParams();
      params.set('pageNumber', String(newPage));
      params.set('pageSize', String(newPageSize));
      if (newSearch) params.set('searchTerm', newSearch);
      const activeTariffId = newTariffId === null ? undefined : (newTariffId !== undefined ? newTariffId : tariffId);
      if (activeTariffId) params.set('tariffId', String(activeTariffId));
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);
      startTransition(() => {
        router.push(`/${locale}/water-bill/tariff-workbench/slabs?${params.toString()}`);
      });
    },
    [locale, router, sortBy, sortOrder, tariffId]
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

  const handleAdd = () => {
    const params = new URLSearchParams();
    if (tariffId) params.set('tariffId', String(tariffId));
    if (search) params.set('searchTerm', search);
    const qs = params.toString();
    router.push(`/${locale}/water-bill/tariff-workbench/slabs/add${qs ? `?${qs}` : ''}`);
  };
  const handleEdit = (row: TariffSlabData) => {
    const params = new URLSearchParams();
    if (tariffId) params.set('tariffId', String(tariffId));
    if (search) params.set('searchTerm', search);
    const qs = params.toString();
    router.push(`/${locale}/water-bill/tariff-workbench/slabs/edit/${row.id}${qs ? `?${qs}` : ''}`);
  };
  const handleFormClose = () => {
    const params = new URLSearchParams();
    if (search) params.set('searchTerm', search);
    if (tariffId) params.set('tariffId', String(tariffId));
    const qs = params.toString();
    router.push(`/${locale}/water-bill/tariff-workbench/slabs${qs ? `?${qs}` : ''}`);
  };

  const handleFormSubmit = async (data: TariffSlabFormData) => {
    setIsSubmitting(true);
    try {
      let result: { success: boolean; message?: string } | undefined;
      const payload = {
        ...data,
        fromUnit: data.fromUnit === "" ? 0 : data.fromUnit,
        toUnit: data.toUnit === "" ? 0 : data.toUnit,
        unitRate: data.unitRate === "" ? 0 : data.unitRate,
        fixedCharge: data.fixedCharge === "" ? 0 : data.fixedCharge,
        minimumCharge: data.minimumCharge === "" ? 0 : data.minimumCharge,
      } as Partial<TariffSlabData>;

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

  const handleDelete = (row: TariffSlabData) => {
    confirm({
      variant: 'delete',
      title: t('confirm.deleteSlabTitle') || t('confirm.deleteTitle'),
      description: t('confirm.deleteSlabDescription') || t('confirm.deleteDescription'),
      meta: { name: row.tariffName || String(row.id), id: row.id },
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

  const columns: Column<TariffSlabData>[] = [
    { key: "tariffName", label: t("table.tariffName"), align: "center" },
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
    { key: "fromUnit", label: t("table.fromUnit"), align: "center", render: (v: unknown) => (v != null ? String(v) : '-') },
    { key: "toUnit", label: t("table.toUnit"), align: "center", render: (v: unknown) => (v != null ? String(v) : '-') },
    { key: "unitRate", label: t("table.unitRate"), align: "center", render: (v: unknown) => (v != null ? String(v) : '-') },
    { key: "fixedCharge", label: t("table.fixedCharge"), align: "center", render: (v: unknown) => (v != null ? String(v) : '-') },
    { key: "minimumCharge", label: t("table.minimumCharge"), align: "center", render: (v: unknown) => (v != null ? String(v) : '-') },
    { key: "maximumCharge", label: t("table.maximumCharge"), align: "center", render: (v: unknown) => (v != null ? String(v) : '-') },
    { key: "perConnectionAmount", label: t("table.perConnectionAmount"), align: "center", render: (v: unknown) => (v != null ? String(v) : '-') },
    {
      key: "formulaCode",
      label: t("table.formulaCode"),
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 font-mono shadow-2xs">
            {row.formulaCode || "-"}
          </span>
        </div>
      )
    },
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
      <MasterTable<TariffSlabData>
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
            <div className="flex items-center gap-2">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                onEnter={handleSearchSubmit}
                placeholder={t("searchPlaceholder") || "Search records..."}
                className="mb-0 w-72 text-gray-900"
              />
              {tariffId ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-200 shadow-2xs">
                  <span>{t("filters.tariffId") || "Tariff ID"}: {tariffId}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTariffId(undefined);
                      navigateWithParams(1, pageSize, search.trim() || undefined, null);
                    }}
                    className="cursor-pointer text-blue-600 hover:text-blue-800 font-bold ml-0.5 leading-none"
                    title={tCommon("table.clearFilter") || "Clear filter"}
                    aria-label={tCommon("table.clearFilter") || "Clear filter"}
                  >
                    ×
                  </button>
                </div>
              ) : null}
            </div>
            <AddButton
              label={t("addSlabTitle") || "Add Slab Details"}
              onClick={handleAdd}
            />
          </div>
        }
        actionLabel={tCommon("table.columns.actions") || "Action"}
        renderActions={(row) => (
          <div className="flex items-center gap-1 justify-center">
            <EditButton
              aria-label={tCommon("table.actions.edit") || "Edit"}
              onClick={() => handleEdit(row)}
            />
            <DeleteButton
              aria-label={tCommon("table.actions.delete") || "Delete"}
              onClick={() => handleDelete(row)}
            />
          </div>
        )}
      />
      <TariffSlabForm
        open={drawer === 'edit' || drawer === 'add'}
        initialData={initialEditingData}
        defaultTariffId={tariffId}
        tariffOptions={tariffOptions}
        geographyUnitOptions={geographyUnitOptions}
        isSubmitting={isSubmitting}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </PageContainer>
  );
}
