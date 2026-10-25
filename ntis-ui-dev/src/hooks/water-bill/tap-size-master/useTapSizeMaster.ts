import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type { TapSize, PagedResponse } from "@/types/waterBill/tapSizeMaster.types";
import { deleteTapSizeAction } from "@/app/[locale]/water-bill/tap-size-master/actions";
import { ALPHANUMERIC_WITH_SPACES_SANITIZE } from "@/lib/utils/validation-rules";

export function useTapSizeMaster(data: PagedResponse<TapSize>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const pathname = usePathname() || "";
  const [isPending, startTransition] = useTransition();

  const isUnified = pathname.includes("/water-bill/connection-type-master/tap-size");
  const basePath = isUnified
    ? `/${locale}/water-bill/connection-type-master/tap-size`
    : `/${locale}/water-bill/tap-size-master`;

  const t = useTranslations("tapSizeMaster.tapSize");
  const tCommon = useTranslations("common");

  const { confirm } = useConfirm();

  const { items, pageNumber, pageSize, totalCount, totalPages } = data;
  const currentSearchTerm = searchParams.get("q") ?? "";
  const [search, setSearch] = useState<string>(currentSearchTerm);

  const currentStatusFilter = searchParams.get("status") || "all";
  const [statusFilter, setStatusFilter] = useState<string>(currentStatusFilter);

  const searchParamsRef = useRef(searchParams);
  const currentSearchTermRef = useRef(currentSearchTerm);

  useEffect(() => {
    searchParamsRef.current = searchParams;
    currentSearchTermRef.current = currentSearchTerm;
  }, [searchParams, currentSearchTerm]);

  const [prevStatusFilter, setPrevStatusFilter] = useState<string>(currentStatusFilter);
  if (currentStatusFilter !== prevStatusFilter) {
    setPrevStatusFilter(currentStatusFilter);
    setStatusFilter(currentStatusFilter);
  }

  const lastSetByEffect = useRef<string>(currentSearchTerm);

  useEffect(() => {
    if (lastSetByEffect.current !== currentSearchTerm) {
      setSearch(currentSearchTerm);
      lastSetByEffect.current = currentSearchTerm;
    }
  }, [currentSearchTerm]);

  useEffect(() => {
    if (search === currentSearchTermRef.current) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      params.set("page", "1");
      if (search.trim()) {
        params.set("q", search.trim());
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [search, router, basePath]);

  const handleSearchChange = useCallback((value: string) => {
    const sanitized = value
      .normalize("NFC")
      .replace(ALPHANUMERIC_WITH_SPACES_SANITIZE, "")
      .replace(/\s{2,}/g, " ");
    setSearch(sanitized);
  }, []);

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    const params = new URLSearchParams(searchParamsRef.current.toString());
    params.set("page", "1");
    if (status && status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }, [router, basePath]);

  const buildUrl = useCallback(
    (page: number, size: number, searchTerm?: string, status?: string) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));
      if (searchTerm) params.set("q", searchTerm);
      const activeStatus = status ?? searchParamsRef.current.get("status");
      if (activeStatus && activeStatus !== "all") params.set("status", activeStatus);
      return `${basePath}?${params.toString()}`;
    },
    [basePath]
  );

  const changePage = (p: number) => {
    startTransition(() => {
      router.push(buildUrl(p, pageSize, search, statusFilter));
    });
  };

  const handlePageSizeChange = (size: number) => {
    startTransition(() => {
      router.push(buildUrl(1, size, search, statusFilter));
    });
  };

  const handleAdd = () => {
    router.push(`${basePath}/add`);
  };

  const handleEdit = useCallback(
    (row: TapSize) => {
      router.push(`${basePath}/edit/${row.id}`);
    },
    [router, basePath]
  );

  const handleDelete = useCallback(
    (row: TapSize) => {
      confirm({
        variant: "delete",
        title: `${t("table.tapSize")}: ${row.tapSize}`,
        description: t("confirm.deleteDescription"),
        meta: { name: row.tapSize },
        onConfirm: async () => {
          const result = await deleteTapSizeAction(row.id);
          if (result.success) {
            toast.success(t("messages.deleteSuccess"));
          } else {
            toast.error(result.error || t("messages.deleteError"));
          }
        },
      });
    },
    [confirm, t]
  );

  const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalCount);

  return {
    t,
    tCommon,
    items,
    isPending,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    search,
    currentSearchTerm,
    handleSearchChange,
    statusFilter,
    handleStatusFilterChange,
    start,
    end,
    changePage,
    handlePageSizeChange,
    handleAdd,
    handleEdit,
    handleDelete,
    buildUrl,
  };
}
