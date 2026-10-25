"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useToast } from "@/components/common";
import {
  type GrievanceWorkflowStageMasterProps,
  type GrievanceWorkflowStageMaster,
  GRIEVANCE_WORKFLOW_STAGE_PAGE_SIZES,
} from "@/types/asset-masters/grievance-workflow-stage-master.types";
import { getGrievanceWorkflowStageMasterColumns } from "@/components/modules/assets/configuration/master-data/grievance-workflow-stage/GrievanceWorkflowStageMasterColumns";
import { deleteGrievanceWorkflowStageMasterAction } from "@/app/[locale]/assets/configuration/master-data/grievance-workflow-stage/action";
import { useGrievanceWorkflowStageMasterSearch } from "@/hooks/asset-masters/grievance-workflow-stage-master/useGrievanceWorkflowStageMasterSearch";
import { getGrievanceWorkflowStageMasterErrorMessage } from "@/hooks/asset-masters/grievance-workflow-stage-master/error-mapping";

export function useGrievanceWorkflowStageMasterList({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
}: GrievanceWorkflowStageMasterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("grievanceWorkflowStageMaster");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();
  const toast = useToast();
  const [, startTransition] = React.useTransition();

  const { search, currentSearchTerm, handleSearchChange } = useGrievanceWorkflowStageMasterSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
  });

  React.useEffect(() => {
    const allowedSizes: readonly number[] = GRIEVANCE_WORKFLOW_STAGE_PAGE_SIZES;
    let hasChanged = false;
    const params = new URLSearchParams(searchParams?.toString() || "");

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
      router.replace(
        `/${locale}/assets/configuration/master-data/grievance-workflow-stage?${params.toString()}`
      );
    }
  }, [pageNumber, pageSize, totalPages, locale, router, searchParams]);

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

      return `/${locale}/assets/configuration/master-data/grievance-workflow-stage?${params.toString()}`;
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
      getGrievanceWorkflowStageMasterColumns({
        t,
        sortBy,
        sortOrder,
        onSort: handleSort,
      }),
    [t, sortBy, sortOrder, handleSort]
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
    (row: GrievanceWorkflowStageMaster) => {
      confirm({
        variant: "delete",
        title: `${t("stageCode")}: ${row.stageCode}`,
        description: `${t("deleteConfirm")}`,
        meta: {
          name: row.stageName,
        },
        onConfirm: async () => {
          const fd = new FormData();
          fd.append("id", String(row.id));
          const res = await deleteGrievanceWorkflowStageMasterAction(fd);
          if (res?.success) {
            toast.success(t("form.messages.deleteSuccess"));
            startTransition(() => {
              const isLastItemOnCurrentPage = (totalCount - 1) <= (pageNumber - 1) * pageSize;
              if (pageNumber > 1 && isLastItemOnCurrentPage) {
                router.push(buildUrl(pageNumber - 1, pageSize, currentSearchTerm, sortBy, sortOrder));
              } else {
                router.refresh();
              }
            });
          } else {
            const errorMsg = getGrievanceWorkflowStageMasterErrorMessage(
              res?.message,
              res?.statusCode,
              t,
              tCommon
            );
            toast.error(errorMsg || tCommon("errors.deleteError"));
          }
        },
      });
    },
    [
      confirm,
      router,
      t,
      tCommon,
      toast,
      totalCount,
      pageNumber,
      pageSize,
      currentSearchTerm,
      sortBy,
      sortOrder,
      buildUrl,
    ]
  );

  const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalCount);

  return {
    router,
    locale,
    t,
    tCommon,
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
