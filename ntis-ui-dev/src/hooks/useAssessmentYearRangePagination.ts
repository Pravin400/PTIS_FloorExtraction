"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AssessmentYearRangeConfig } from "@/types/assessment-year-range.types";

interface UseAssessmentYearRangePaginationProps {
  config: AssessmentYearRangeConfig;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  sortBy?: string;
  sortOrder?: string;
  locale: string;
  startTransition: (callback: () => void) => void;
}

export function useAssessmentYearRangePagination({
  config,
  pageNumber,
  pageSize,
  totalCount,
  sortBy,
  sortOrder,
  locale,
  startTransition,
}: UseAssessmentYearRangePaginationProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (page: number, size: number, sort?: string, order?: string) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));
      if (sort) params.set("sortBy", sort);
      if (order) params.set("sortOrder", order);
      return `/${locale}${config.routePath}?${params.toString()}`;
    },
    [locale, config.routePath]
  );

  const changePage = useCallback(
    (p: number): void => {
      startTransition(() => {
        router.push(buildUrl(p, pageSize, sortBy, sortOrder));
      });
    },
    [pageSize, sortBy, sortOrder, router, startTransition, buildUrl]
  );

  const handlePageSizeChange = useCallback(
    (value: string) => {
      startTransition(() => {
        router.push(buildUrl(1, Number(value), sortBy, sortOrder));
      });
    },
    [sortBy, sortOrder, router, buildUrl, startTransition]
  );

  const handleSort = useCallback(
    (key: string) => {
      const isSameField = sortBy === key;
      const nextOrder = isSameField && sortOrder === "asc" ? "desc" : "asc";
      
      startTransition(() => {
        router.push(buildUrl(1, pageSize, key, nextOrder));
      });
    },
    [sortBy, sortOrder, pageSize, router, buildUrl, startTransition]
  );

  // Footer pagination calculations
  const start = totalCount === 0 ? 0 : ((pageNumber || 1) - 1) * (pageSize || 10) + 1;
  const end = Math.min(start + (pageSize || 10) - 1, totalCount);
  const total = totalCount || 0;

  return {
    buildUrl,
    changePage,
    handlePageSizeChange,
    handleSort,
    paginationInfo: {
      start,
      end,
      total,
    },
  };
}
