"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useToast } from "@/components/common";
import type { GstMasterProps, GstMaster } from "@/types/asset-masters/gst-master.types";
import { getGstMasterColumns } from "@/components/modules/assets/configuration/master-data/gst-master/GstMasterColumns";
import { deleteGstMasterAction } from "@/app/[locale]/assets/configuration/master-data/gst-master/action";
import { useGstMasterSearch } from "@/hooks/asset-masters/gst-master/useGstMasterSearch";
import { getGstMasterErrorMessage } from "@/hooks/asset-masters/gst-master/error-mapping";

export function useGstMasterList({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
}: GstMasterProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("gstMaster");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();
  const toast = useToast();
  const [isPending, startTransition] = React.useTransition();

  const { search, currentSearchTerm, handleSearchChange } = useGstMasterSearch({
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
      router.replace(`/${locale}/assets/configuration/master-data/gst-master?${params.toString()}`);
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

      return `/${locale}/assets/configuration/master-data/gst-master?${params.toString()}`;
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

  const columns = React.useMemo(
    () =>
      getGstMasterColumns({
        t,
        tCommon,
        sortBy,
        sortOrder,
        onSort: handleSort,
      }),
    [t, tCommon, sortBy, sortOrder, handleSort]
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

  const handleDelete = React.useCallback(
    (row: GstMaster) => {
      confirm({
        variant: "delete",
        title: `${t("taxCode")}: ${row.taxCode}`,
        description: `${t("deleteConfirm")}`,
        meta: {
          name: row.taxName,
        },
        onConfirm: async () => {
          const fd = new FormData();
          fd.append("id", String(row.id));
          const res = await deleteGstMasterAction(fd);
          if (res?.success) {
            toast.success(t("form.messages.deleteSuccess"));
            startTransition(() => router.refresh());
          } else {
            const errorMsg = getGstMasterErrorMessage(res?.message, res?.statusCode, t, tCommon);
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
