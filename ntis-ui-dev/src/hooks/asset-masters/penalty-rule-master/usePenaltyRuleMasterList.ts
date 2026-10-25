"use client";

import { useMemo, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useToast } from "@/components/common";
import { getPenaltyRuleMasterColumns } from "@/components/modules/assets/configuration/master-data/penalty-rule-master/PenaltyRuleMasterColumns";
import { deletePenaltyRuleAction } from "@/app/[locale]/assets/configuration/master-data/penalty-rule-master/action";
import { usePenaltyRuleMasterSearch } from "@/hooks/asset-masters/penalty-rule-master/usePenaltyRuleMasterSearch";
import { getPenaltyRuleErrorMessage } from "@/hooks/asset-masters/penalty-rule-master/error-mapping";
import type { PenaltyRuleProps, PenaltyRule } from "@/types/asset-masters/penalty-rule-master.types";

export function usePenaltyRuleMasterList({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
}: PenaltyRuleProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("penaltyRuleMaster");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const { search, currentSearchTerm, handleSearchChange } = usePenaltyRuleMasterSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
  });

  useEffect(() => {
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
      router.replace(`/${locale}/assets/configuration/master-data/penalty-rule-master?${params.toString()}`);
    }
  }, [pageNumber, pageSize, totalPages, locale, router]);

  const buildUrl = useCallback(
    (
      page: number,
      size: number,
      searchTermVal?: string,
      newSortBy?: string,
      newSortOrder?: string
    ) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));
      if (searchTermVal?.trim()) params.set("q", searchTermVal.trim());
      if (newSortBy) params.set("sortBy", newSortBy);
      if (newSortOrder) params.set("sortOrder", newSortOrder);

      return `/${locale}/assets/configuration/master-data/penalty-rule-master?${params.toString()}`;
    },
    [locale]
  );

  const handleSort = useCallback(
    (columnKey: string) => {
      startTransition(() => {
        const nextOrder = sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
        router.push(buildUrl(pageNumber, pageSize, currentSearchTerm, columnKey, nextOrder));
      });
    },
    [sortBy, sortOrder, pageNumber, pageSize, currentSearchTerm, buildUrl, router]
  );

  const columns = useMemo(
    () =>
      getPenaltyRuleMasterColumns({
        t,
        tCommon,
        sortBy,
        sortOrder,
        onSort: handleSort,
      }),
    [t, tCommon, sortBy, sortOrder, handleSort]
  );

  const changePage = useCallback(
    (p: number) => {
      startTransition(() => {
        router.push(buildUrl(p, pageSize, currentSearchTerm, sortBy, sortOrder));
      });
    },
    [pageSize, currentSearchTerm, sortBy, sortOrder, buildUrl, router]
  );

  const changePageSize = useCallback(
    (size: number) => {
      startTransition(() => {
        router.push(buildUrl(1, size, currentSearchTerm, sortBy, sortOrder));
      });
    },
    [currentSearchTerm, sortBy, sortOrder, buildUrl, router]
  );

  const handleDelete = useCallback(
    (row: PenaltyRule) => {
      confirm({
        variant: "delete",
        title: `${t("penaltyCode")}: ${row.penaltyCode}`,
        description: `${t("deleteConfirm")}`,
        meta: {
          name: row.penaltyName,
        },
        onConfirm: async () => {
          const fd = new FormData();
          fd.append("id", String(row.id));
          const res = await deletePenaltyRuleAction(fd);
          if (res?.success) {
            toast.success(t("form.messages.deleteSuccess"));
            startTransition(() => router.refresh());
          } else {
            const errorMsg = getPenaltyRuleErrorMessage(res?.message, res?.statusCode, t, tCommon);
            toast.error(errorMsg || tCommon("errors.deleteError"));
          }
        },
      });
    },
    [confirm, router, t, tCommon, toast]
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
    handleDelete,
    start,
    end,
  };
}
