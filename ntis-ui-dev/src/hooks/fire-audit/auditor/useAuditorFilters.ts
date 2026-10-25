"use client";

import { useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { AuditorDashboardFilters } from "@/types/fire-audit/auditor.types";
import {
  parseFiltersFromSearchParams,
  serializeFiltersToParams,
} from "@/lib/utils/fire-audit/auditor-params";

export { serializeFiltersToParams, parseFiltersFromSearchParams };

export interface UseAuditorFiltersReturn {
  isPending: boolean;
  updateUrlFilters: (newFilters: AuditorDashboardFilters) => void;
  handleSelectStatus: (statusValue: string) => void;
  handleResetFilters: () => void;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (pageSize: number) => void;
  handleSort: (columnKey: string) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useAuditorFilters(
  rawFilters: AuditorDashboardFilters = {}
): UseAuditorFiltersReturn {
  const currentFilters = parseFiltersFromSearchParams(rawFilters);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrlFilters = useCallback(
    (newFilters: AuditorDashboardFilters) => {
      const validated = parseFiltersFromSearchParams({
        pageSize: currentFilters.pageSize,
        ...newFilters,
        page: 1,
      });
      const params = serializeFiltersToParams(validated, searchParams ?? undefined, 1);

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [currentFilters.pageSize, searchParams, pathname, router]
  );

  const handleSelectStatus = useCallback(
    (statusValue: string) => {
      const nextStatus = currentFilters.status === statusValue ? "" : statusValue;
      updateUrlFilters({ ...currentFilters, status: nextStatus });
    },
    [currentFilters, updateUrlFilters]
  );

  const handleResetFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (currentFilters.pageSize && currentFilters.pageSize !== 10) {
      params.set("pageSize", String(currentFilters.pageSize));
    }
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }, [currentFilters.pageSize, pathname, router]);

  const handlePageChange = useCallback(
    (page: number) => {
      const validated = parseFiltersFromSearchParams({ ...currentFilters, page });
      const params = serializeFiltersToParams(
        validated,
        searchParams ?? undefined,
        validated.page
      );
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [currentFilters, searchParams, pathname, router]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      const validated = parseFiltersFromSearchParams({
        ...currentFilters,
        pageSize,
        page: 1,
      });
      const params = serializeFiltersToParams(
        validated,
        searchParams ?? undefined,
        1
      );
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [currentFilters, searchParams, pathname, router]
  );

  const handleSort = useCallback(
    (columnKey: string) => {
      let nextSortOrder: "asc" | "desc" | undefined = "asc";
      let nextSortBy: string | undefined = columnKey;

      if (currentFilters.sortBy === columnKey) {
        if (currentFilters.sortOrder === "asc") {
          nextSortOrder = "desc";
        } else if (currentFilters.sortOrder === "desc") {
          nextSortBy = undefined;
          nextSortOrder = undefined;
        }
      }

      const validated = parseFiltersFromSearchParams({
        ...currentFilters,
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
        page: 1,
      });
      const params = serializeFiltersToParams(
        validated,
        searchParams ?? undefined,
        1
      );
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [currentFilters, searchParams, pathname, router]
  );

  return {
    isPending,
    updateUrlFilters,
    handleSelectStatus,
    handleResetFilters,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    sortBy: currentFilters.sortBy,
    sortOrder: currentFilters.sortOrder,
  };
}
