import { useMemo, useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast, useConfirm } from "@/components/common";
import { useDebounce } from "@/hooks/useDebounce";
import { getBillingPeriodColumns } from "@/components/modules/water-bill/billing-configuration/billing-period/billingPeriodColumns";
import {
  filterBillingPeriodsForTable,
  sortBillingPeriodsTable,
} from "@/lib/utils/water-bill/billing-configuration/billingPeriodTable.utils";
import type {
  BillingPeriodMaster as BillingPeriodMasterType,
  CreateBillingPeriodDto,
  BillingPeriodFormState,
  UseBillingPeriodMasterProps,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

export type { UseBillingPeriodMasterProps };

export function useBillingPeriodMaster({
  pagedData,
  initialData,
  locale,
  drawer = null,
  initialEditingData = null,
  initialSortBy,
  initialSortOrder,
  initialSearchTerm,
  createAction,
  updateAction,
  deleteAction,
}: UseBillingPeriodMasterProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("billingPeriodMaster");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState(initialSearchTerm || "");
  const debouncedSearch = useDebounce(search, 1000);
  const isFirstMount = useRef(true);

  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(initialSortOrder);

  const records = useMemo(() => {
    const rawItems = pagedData?.items ?? initialData ?? [];
    const filtered = filterBillingPeriodsForTable(rawItems);
    return sortBillingPeriodsTable(filtered, sortBy, sortOrder);
  }, [pagedData, initialData, sortBy, sortOrder]);
  const pageNumber = pagedData?.pageNumber ?? 1;
  const pageSize = pagedData?.pageSize ?? 10;
  const totalCount = pagedData?.totalCount ?? records.length;
  const totalPages =
    pagedData?.totalPages && pagedData.totalPages > 0
      ? pagedData.totalPages
      : Math.ceil(totalCount / pageSize) || 1;

  const navigateWithParams = useCallback(
    (
      newPage: number,
      newPageSize: number,
      newSearch?: string,
      newSortBy?: string,
      newSortOrder?: "asc" | "desc"
    ) => {
      const params = new URLSearchParams();
      params.set("pageNumber", String(newPage));
      params.set("pageSize", String(newPageSize));
      if (newSearch) params.set("searchTerm", newSearch);
      const activeSortBy = newSortBy !== undefined ? newSortBy : sortBy;
      const activeSortOrder = newSortOrder !== undefined ? newSortOrder : sortOrder;
      if (activeSortBy) params.set("sortBy", activeSortBy);
      if (activeSortOrder) params.set("sortOrder", activeSortOrder);
      startTransition(() => {
        router.push(`/${locale}/water-bill/billing-configuration/billing-period?${params.toString()}`);
      });
    },
    [locale, router, sortBy, sortOrder]
  );

  // Debounced search: 1 second delay
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const trimmedDebounced = debouncedSearch.trim();
    const currentTrimmed = (initialSearchTerm || "").trim();
    if (trimmedDebounced !== currentTrimmed) {
      navigateWithParams(1, pageSize, trimmedDebounced || undefined);
    }
  }, [debouncedSearch, initialSearchTerm, navigateWithParams, pageSize]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSearchSubmit = () => {
    const trimmedSearch = search.trim();
    navigateWithParams(1, pageSize, trimmedSearch || undefined);
  };

  const handleSort = useCallback(
    (key: string) => {
      const nextOrder: "asc" | "desc" = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
      setSortBy(key);
      setSortOrder(nextOrder);
      navigateWithParams(1, pageSize, search.trim() || undefined, key, nextOrder);
    },
    [navigateWithParams, pageSize, search, sortBy, sortOrder]
  );

  const columns = useMemo(
    () => getBillingPeriodColumns(t, tCommon, sortBy, sortOrder, handleSort),
    [t, tCommon, sortBy, sortOrder, handleSort]
  );

  const handlePageChange = (p: number) => {
    navigateWithParams(p, pageSize, search.trim() || undefined);
  };

  const handlePageSizeChange = (size: number) => {
    navigateWithParams(1, size, search.trim() || undefined);
  };

  const handleAdd = () => {
    router.push(`/${locale}/water-bill/billing-configuration/billing-period/add`);
  };

  const handleEdit = (row: BillingPeriodMasterType) => {
    router.push(`/${locale}/water-bill/billing-configuration/billing-period/edit/${row.id}`);
  };

  const handleFormClose = () => {
    router.push(`/${locale}/water-bill/billing-configuration/billing-period`);
  };

  const handleFormSubmit = async (data: CreateBillingPeriodDto) => {
    setIsSubmitting(true);
    try {
      let result: BillingPeriodFormState;
      if (drawer === "edit" && initialEditingData?.id && updateAction) {
        result = await updateAction(initialEditingData.id, { success: false }, data);
      } else if (createAction) {
        result = await createAction({ success: false }, data);
      } else {
        throw new Error(t("errors.noMutationAction"));
      }

      if (result.success) {
        toast.success(drawer === "edit" ? t("messages.updateSuccess") : t("messages.createSuccess"));
        router.push(`/${locale}/water-bill/billing-configuration/billing-period`);
        router.refresh();
      } else {
        toast.error(result.message || tCommon("errors.unexpectedError"));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tCommon("errors.unexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (row: BillingPeriodMasterType) => {
    confirm({
      variant: "delete",
      title: t("confirm.deleteTitle"),
      description: t("confirm.deleteDescription"),
      meta: { name: row.billingPeriodCode },
      onConfirm: async () => {
        if (!deleteAction) {
          toast.error(t("errors.noDeleteAction"));
          return;
        }
        try {
          const result = await deleteAction(row.id);
          if (result.success) {
            toast.success(t("messages.deleteSuccess"));
            router.refresh();
          } else {
            toast.error(result.message || tCommon("errors.unexpectedError"));
          }
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : tCommon("errors.unexpectedError"));
        }
      },
    });
  };

  return {
    t,
    tCommon,
    search,
    records,
    columns,
    isPending,
    isSubmitting,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    handleSearchChange,
    handleSearchSubmit,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleFormSubmit,
  };
}
