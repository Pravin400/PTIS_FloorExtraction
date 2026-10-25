"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AliasMaster, AliasMasterProps } from "@/types/alias-master.types";
import { getAliasMasterColumns } from "@/components/modules/configuration-settings/alias-master/AliasMasterColumns";
import { useAliasMasterSearch } from "@/hooks/configuration-settings/alias-master/useAliasMasterSearch";
import { toggleAliasMasterStatusAction } from "@/app/[locale]/configuration-settings/alias-master/action";

export function useAliasMasterList({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
}: AliasMasterProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("aliasMaster");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = React.useTransition();
  const [togglingId, setTogglingId] = React.useState<number | null>(null);

  const { search, currentSearchTerm, handleSearchChange } = useAliasMasterSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
  });

  React.useEffect(() => {
    const allowedSizes = [10, 20, 30, 40, 50];
    let hasChanged = false;
    const params = new URLSearchParams(window.location.search);

    if (!allowedSizes.includes(pageSize)) {
      const fallbackSize = allowedSizes.reduce((prev, curr) =>
        Math.abs(curr - pageSize) < Math.abs(prev - pageSize) ? curr : prev
      );
      params.set("pageSize", String(fallbackSize));
      hasChanged = true;
    }

    const rawPageStr = params.get("page");
    if (rawPageStr !== null) {
      const rawPage = parseInt(rawPageStr, 10);
      if (!Number.isFinite(rawPage) || rawPage < 1) {
        params.set("page", "1");
        hasChanged = true;
      } else if (totalPages > 0 && rawPage > totalPages) {
        params.set("page", String(totalPages));
        hasChanged = true;
      }
    }

    if (hasChanged) {
      router.replace(`/${locale}/configuration-settings/alias-master?${params.toString()}`);
    }
  }, [pageNumber, pageSize, totalPages, locale, router]);

  const buildUrl = React.useCallback(
    (
      page: number,
      size: number,
      searchTerm?: string,
      newSortBy?: string,
      newSortOrder?: string
    ) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));
      if (searchTerm?.trim()) params.set("q", searchTerm.trim());
      if (newSortBy) params.set("sortBy", newSortBy);
      if (newSortOrder) params.set("sortOrder", newSortOrder);

      return `/${locale}/configuration-settings/alias-master?${params.toString()}`;
    },
    [locale]
  );

  const handleSort = React.useCallback(
    (columnKey: string) => {
      startTransition(() => {
        const nextOrder = sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
        router.push(buildUrl(pageNumber, pageSize, currentSearchTerm, columnKey, nextOrder));
      });
    },
    [sortBy, sortOrder, pageNumber, pageSize, currentSearchTerm, buildUrl, router]
  );

  const handleToggleStatus = React.useCallback(
    async (row: AliasMaster) => {
      const nextIsActive = !row.isActive;
      setTogglingId(row.id);
      try {
        const res = await toggleAliasMasterStatusAction(row.id, nextIsActive);
        if (res?.success) {
          toast.success(nextIsActive ? t("form.messages.activateSuccess") : t("form.messages.deactivateSuccess"));
          startTransition(() => router.refresh());
        } else {
          toast.error(res?.message || tCommon("errors.updateError"));
        }
      } finally {
        setTogglingId(null);
      }
    },
    [router, t, tCommon]
  );

  const columns = React.useMemo(
    () =>
      getAliasMasterColumns({
        t,
        tCommon,
        sortBy,
        sortOrder,
        onSort: handleSort,
        onToggleStatus: handleToggleStatus,
        togglingId,
      }),
    [t, tCommon, sortBy, sortOrder, handleSort, handleToggleStatus, togglingId]
  );

  const changePage = React.useCallback(
    (p: number) => {
      startTransition(() => {
        router.push(buildUrl(p, pageSize, currentSearchTerm, sortBy, sortOrder));
      });
    },
    [pageSize, currentSearchTerm, sortBy, sortOrder, buildUrl, router]
  );

  const changePageSize = React.useCallback(
    (size: number) => {
      startTransition(() => {
        router.push(buildUrl(1, size, currentSearchTerm, sortBy, sortOrder));
      });
    },
    [currentSearchTerm, sortBy, sortOrder, buildUrl, router]
  );

  const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalCount);

  return {
    router,
    locale,
    t,
    tCommon,
    isPending,
    search,
    handleSearchChange,
    columns,
    changePage,
    changePageSize,
    start,
    end,
  };
}
