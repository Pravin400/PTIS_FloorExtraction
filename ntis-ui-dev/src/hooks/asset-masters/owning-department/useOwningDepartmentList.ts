"use client";

import { useMemo, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useToast } from "@/components/common";
import { getColumns } from "@/components/modules/assets/configuration/master-data/owning-department/OwningDepartmentColumns";
import { deleteOwningDepartmentAction } from "@/app/[locale]/assets/configuration/master-data/owning-department/action";
import { useOwningDepartmentSearch } from "@/hooks/asset-masters/owning-department/useOwningDepartmentSearch";
import { getOwningDepartmentErrorMessage } from "@/hooks/asset-masters/owning-department/error-mapping";
import type { OwningDepartment, OwningDepartmentMasterProps } from "@/types/asset-masters/owning-department.types";

export function useOwningDepartmentList({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
}: OwningDepartmentMasterProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const t = useTranslations("owningDepartment");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const { search, currentSearchTerm, handleSearchChange } = useOwningDepartmentSearch({
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
      router.replace(`/${locale}/assets/configuration/master-data/owning-department?${params.toString()}`);
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

      return `/${locale}/assets/configuration/master-data/owning-department?${params.toString()}`;
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
      getColumns({
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
    (row: OwningDepartment) => {
      confirm({
        variant: "delete",
        title: `${t("title")}: ${row.owningDepartmentName}`,
        description: t("form.messages.deleteConfirm"),
        meta: {
          name: row.owningDepartmentName,
        },
        onConfirm: async () => {
          try {
            const fd = new FormData();
            fd.append("id", String(row.id));
            const res = await deleteOwningDepartmentAction(fd);
            if (res.success) {
              toast.success(t("form.messages.deleteSuccess") || tCommon("messages.deleteSuccess"));
              startTransition(() => router.refresh());
            } else {
              const errorMsg = getOwningDepartmentErrorMessage(res.message, res.statusCode, t, tCommon);
              toast.error(errorMsg || tCommon("messages.deleteError"));
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : tCommon("messages.deleteError"));
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
