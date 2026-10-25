import { useMemo, useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast, useConfirm } from "@/components/common";
import { getChargeHeadColumns } from "@/components/modules/water-bill/charge-heads/chargeHeadColumns";
import { TEXT_SANITIZE } from "@/lib/utils/validation";

const getChargeHeadsUrl = (locale: string, queryString = "") =>
  `/${locale}/water-bill/charge-heads${queryString}`;
import type {
  ChargeHead,
  CreateChargeHeadDto,
  UseChargeHeadsProps,
  ChargeHeadFormState,
} from "@/types/water-bill/chargeHeads.types";

export function useChargeHeads({
  pagedData,
  initialData,
  locale,
  drawer = null,
  initialEditingData = null,
  initialSortBy: _initialSortBy,
  initialSortOrder: _initialSortOrder,
  initialSearchTerm,
  createAction,
  updateAction,
  deleteAction,
}: UseChargeHeadsProps) {
  const router = useRouter();
  const navSearchParams = useSearchParams();
  const searchParams = navSearchParams;
  const confirmObj = useConfirm();
  const confirm = confirmObj?.confirm || ((opts: { onConfirm?: () => void }) => opts.onConfirm?.());
  const toast = useToast();
  const t = useTranslations("chargeHeads");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeDrawer, setActiveDrawer] = useState<"add" | "edit" | null>(drawer);

  const [prevDrawer, setPrevDrawer] = useState(drawer);
  if (drawer !== prevDrawer) {
    setPrevDrawer(drawer);
    setActiveDrawer(drawer);
  }

  const [editingData, setEditingData] = useState<ChargeHead | null>(initialEditingData);
  const [prevInitialEditingData, setPrevInitialEditingData] = useState(initialEditingData);

  if (initialEditingData !== prevInitialEditingData) {
    setPrevInitialEditingData(initialEditingData);
    if (initialEditingData) {
      setEditingData(initialEditingData);
    }
  }

  const currentSearchTerm =
    searchParams?.get("q") ?? searchParams?.get("searchTerm") ?? initialSearchTerm ?? "";
  const [search, setSearch] = useState<string>(currentSearchTerm);

  const searchParamsRef = useRef(searchParams);
  const currentSearchTermRef = useRef(currentSearchTerm);

  useEffect(() => {
    searchParamsRef.current = searchParams;
    currentSearchTermRef.current = currentSearchTerm;
  }, [searchParams, currentSearchTerm]);

  const lastSetByEffect = useRef<string>(currentSearchTerm);

  useEffect(() => {
    if (lastSetByEffect.current !== currentSearchTerm) {
      setSearch(currentSearchTerm);
      lastSetByEffect.current = currentSearchTerm;
    }
  }, [currentSearchTerm]);

  const records = useMemo(
    () => pagedData?.items ?? initialData ?? [],
    [pagedData, initialData]
  );

  const pageNumber = pagedData?.pageNumber ?? 1;
  const pageSize = pagedData?.pageSize ?? 10;
  const totalCount = pagedData?.totalCount ?? records.length;
  const totalPages =
    pagedData?.totalPages && pagedData.totalPages > 0
      ? pagedData.totalPages
      : Math.ceil(totalCount / (pageSize || 1)) || 1;

  useEffect(() => {
    if (search === currentSearchTermRef.current) return;

    const timer = setTimeout(() => {
      const rawParams = searchParamsRef.current ? searchParamsRef.current.toString() : "";
      const params = new URLSearchParams(rawParams);
      params.set("pageNumber", "1");
      params.set("page", "1");
      if (search.trim()) {
        params.set("q", search.trim());
        params.set("searchTerm", search.trim());
      } else {
        params.delete("q");
        params.delete("searchTerm");
      }
      startTransition(() => {
        router.push(`/${locale}/water-bill/charge-heads?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [search, router, locale]);

  const handleSearchChange = useCallback((value: string) => {
    const sanitized = value.replace(TEXT_SANITIZE, "");
    setSearch(sanitized);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = search.trim();
    const rawParams = searchParamsRef.current ? searchParamsRef.current.toString() : "";
    const params = new URLSearchParams(rawParams);
    params.set("pageNumber", "1");
    params.set("page", "1");
    if (trimmed) {
      params.set("q", trimmed);
      params.set("searchTerm", trimmed);
    } else {
      params.delete("q");
      params.delete("searchTerm");
    }
    startTransition(() => {
      router.push(getChargeHeadsUrl(locale, `?${params.toString()}`));
    });
  }, [search, router, locale, startTransition]);

  const columns = useMemo(
    () => getChargeHeadColumns(t, tCommon),
    [t, tCommon]
  );

  const handlePageChange = (p: number) => {
    const rawParams = searchParamsRef.current ? searchParamsRef.current.toString() : "";
    const params = new URLSearchParams(rawParams);
    params.set("pageNumber", String(p));
    params.set("page", String(p));
    params.set("pageSize", String(pageSize));
    if (search.trim()) {
      params.set("q", search.trim());
      params.set("searchTerm", search.trim());
    }
    startTransition(() => {
      router.push(getChargeHeadsUrl(locale, `?${params.toString()}`));
    });
  };

  const handlePageSizeChange = (size: number) => {
    const rawParams = searchParamsRef.current ? searchParamsRef.current.toString() : "";
    const params = new URLSearchParams(rawParams);
    params.set("pageNumber", "1");
    params.set("page", "1");
    params.set("pageSize", String(size));
    if (search.trim()) {
      params.set("q", search.trim());
      params.set("searchTerm", search.trim());
    }
    startTransition(() => {
      router.push(getChargeHeadsUrl(locale, `?${params.toString()}`));
    });
  };

  const handleAdd = () => {
    startTransition(() => {
      router.push(`/${locale}/water-bill/charge-heads/add`);
    });
  };

  const handleEdit = (row: ChargeHead) => {
    const rawParams = searchParamsRef.current ? searchParamsRef.current.toString() : "";
    const qs = rawParams ? `?${rawParams}` : "";
    startTransition(() => {
      router.push(`/${locale}/water-bill/charge-heads/edit/${row.id}${qs}`);
    });
  };

  const handleFormClose = () => {
    setActiveDrawer(null);
    setEditingData(null);

    startTransition(() => {
      router.push(`/${locale}/water-bill/charge-heads`);
    });
  };

  const handleFormSubmit = async (data: CreateChargeHeadDto) => {
    setIsSubmitting(true);

    const activeMode = activeDrawer || drawer;
    const currentEdit = editingData || initialEditingData;

    try {
      let result: ChargeHeadFormState;

      if (activeMode === "edit" && currentEdit?.id && updateAction) {
        result = await updateAction(
          currentEdit.id,
          { success: false },
          data
        );
      } else if (createAction) {
        result = await createAction(
          { success: false },
          data
        );
      } else {
        throw new Error(t("errors.noMutationAction"));
      }

      if (result.success) {
        toast.success(
          (result.message as string | undefined) ||
          (activeMode === "edit"
            ? t("success.updated")
            : t("success.created"))
        );

        setActiveDrawer(null);
        setEditingData(null);

        startTransition(() => {
          router.push(`/${locale}/water-bill/charge-heads`);
          router.refresh();
        });
      } else {
        toast.error(
          (result.message as string | undefined) || tCommon("errors.unexpectedError")
        );
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : tCommon("errors.unexpectedError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (row: ChargeHead) => {
    const codeVal = row.chargeHeadCode || row.code || "";
    confirm({
      variant: "delete",
      title: codeVal ? `${t("list.table.code")}: ${codeVal}` : t("delete.confirmTitle"),
      description: t("delete.confirmDescription"),
      meta: { name: String(row.chargeHeadName || row.name || codeVal || ""), id: row.id },

      onConfirm: async () => {
        if (!deleteAction) {
          toast.error(t("errors.noDeleteAction"));
          return;
        }

        try {
          const res = await deleteAction(row.id);
          if (res.success) {
            toast.success(res.message || t("success.deleted"));
            startTransition(() => {
              router.refresh();
            });
          } else {
            toast.error(res.message || t("errors.deleteFailed"));
          }
        } catch (err: unknown) {
          toast.error(
            err instanceof Error ? err.message : t("errors.deleteFailed")
          );
        }
      },
    });
  };

  return {
    search,
    records,
    columns,
    isPending,
    isSubmitting,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    activeDrawer,
    editingData,
    handleSearchChange,
    handleSearchSubmit,
    handlePageChange,
    handlePageSizeChange,
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleFormSubmit,
  };
}