"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface UseUserDepartmentAllocationPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale?: string;
  currentSearchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useUserDepartmentAllocationPagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  currentSearchTerm,
  sortBy,
  sortOrder,
}: UseUserDepartmentAllocationPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // If currentSearchTerm was not passed in props, fallback to searchParams
  const effectiveSearchTerm =
    currentSearchTerm ?? (searchParams.get("q") || searchParams.get("search") || "");

  const buildUrl = useCallback(
    (page: number, size: number, query?: string, sort?: string, order?: string) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));
      if (query?.trim()) params.set("q", query.trim());
      if (sort) params.set("sortBy", sort);
      if (order) params.set("sortOrder", order);
      return locale
        ? `/${locale}/assets/configuration/master-data/user-department-allocation?${params.toString()}`
        : `${pathname}?${params.toString()}`;
    },
    [locale, pathname]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      router.push(buildUrl(newPage, pageSize, effectiveSearchTerm, sortBy, sortOrder));
    },
    [buildUrl, pageSize, effectiveSearchTerm, sortBy, sortOrder, router]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      router.push(buildUrl(1, newSize, effectiveSearchTerm, sortBy, sortOrder));
    },
    [buildUrl, effectiveSearchTerm, sortBy, sortOrder, router]
  );

  const handleSort = useCallback(
    (columnKey: string) => {
      const isCurrent = sortBy === columnKey;
      const newOrder = isCurrent && sortOrder === "asc" ? "desc" : "asc";
      router.push(buildUrl(1, pageSize, effectiveSearchTerm, columnKey, newOrder));
    },
    [buildUrl, pageSize, effectiveSearchTerm, sortBy, sortOrder, router]
  );

  const paginationInfo = useMemo(() => {
    const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);
    return {
      start,
      end,
      total: totalCount,
    };
  }, [pageNumber, pageSize, totalCount]);

  return {
    buildUrl,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    paginationInfo,
  };
}
