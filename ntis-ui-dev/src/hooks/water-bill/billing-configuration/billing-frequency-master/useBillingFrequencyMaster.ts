import { useMemo, useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast, useConfirm } from "@/components/common";
import { useDebounce } from "@/hooks/useDebounce";
import { getBillingFrequencyColumns } from "@/components/modules/water-bill/billing-configuration/billing-frequency/billingFrequencyColumns";
import type {
  BillingFrequencyMaster as BillingFrequencyMasterType,
  CreateBillingFrequencyMasterDto,
  BillingFrequencyFormState,
  UseBillingFrequencyMasterProps,
} from "@/types/water-bill/billing-configuration/billingFrequencyMaster.types";

export type { UseBillingFrequencyMasterProps };

export function useBillingFrequencyMaster({
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
}: UseBillingFrequencyMasterProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("billingFrequencyMaster");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState(initialSearchTerm || "");
  const debouncedSearch = useDebounce(search, 1000);
  const isFirstMount = useRef(true);

  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(initialSortOrder);

  const records = useMemo(() => {
    const rawItems = pagedData?.items ?? initialData ?? [];
    const items = [...rawItems];
    if (sortBy) {
      items.sort((a, b) => {
        const valA = a[sortBy as keyof BillingFrequencyMasterType];
        const valB = b[sortBy as keyof BillingFrequencyMasterType];
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "desc" ? valB - valA : valA - valB;
        }
        return sortOrder === "desc"
          ? String(valB ?? "").localeCompare(String(valA ?? ""), undefined, { numeric: true })
          : String(valA ?? "").localeCompare(String(valB ?? ""), undefined, { numeric: true });
      });
    } else {
      items.sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0));
    }
    return items;
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
        router.push(`/${locale}/water-bill/billing-configuration/billing-frequency?${params.toString()}`);
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
    () => getBillingFrequencyColumns(t, tCommon, sortBy, sortOrder, handleSort),
    [t, tCommon, sortBy, sortOrder, handleSort]
  );

  const handlePageChange = (p: number) => {
    navigateWithParams(p, pageSize, search.trim() || undefined);
  };

  const handlePageSizeChange = (size: number) => {
    navigateWithParams(1, size, search.trim() || undefined);
  };

  const handleAdd = () => {
    router.push(`/${locale}/water-bill/billing-configuration/billing-frequency/add`);
  };

  const handleEdit = (row: BillingFrequencyMasterType) => {
    router.push(`/${locale}/water-bill/billing-configuration/billing-frequency/edit/${row.id}`);
  };

  const handleFormClose = () => {
    router.push(`/${locale}/water-bill/billing-configuration/billing-frequency`);
  };

  const handleFormSubmit = async (data: CreateBillingFrequencyMasterDto): Promise<BillingFrequencyFormState | void> => {
    setIsSubmitting(true);
    try {
      let result: BillingFrequencyFormState;
      if (drawer === "edit" && initialEditingData?.id && updateAction) {
        result = await updateAction(initialEditingData.id, { success: false }, { ...data, id: initialEditingData.id });
      } else if (createAction) {
        result = await createAction({ success: false }, data);
      } else {
        throw new Error(t("errors.noMutationAction"));
      }

      if (result.success) {
        toast.success(drawer === "edit" ? t("messages.updateSuccess") : t("messages.createSuccess"));
        router.push(`/${locale}/water-bill/billing-configuration/billing-frequency`);
        router.refresh();
      } else {
        toast.error(result.message || tCommon("errors.unexpectedError"));
      }
      return result;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tCommon("errors.unexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (row: BillingFrequencyMasterType) => {
    confirm({
      variant: "delete",
      title: t("confirm.deleteTitle"),
      description: t("confirm.deleteDescription"),
      meta: { name: row.billingFrequency },
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
