"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

interface UseDesignationPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale: string;
  currentSearchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useDesignationPagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  currentSearchTerm,
  sortBy,
  sortOrder,
}: UseDesignationPaginationProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (page: number, size: number, query?: string, sort?: string, order?: string) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));
      if (query?.trim()) params.set("q", query.trim());
      if (sort) params.set("sortBy", sort);
      if (order) params.set("sortOrder", order);
      return `/${locale}/assets/configuration/master-data/designation-master?${params.toString()}`;
    },
    [locale]
  );

  const changePage = useCallback(
    (page: number) => {
      router.push(buildUrl(page, pageSize, currentSearchTerm, sortBy, sortOrder));
    },
    [buildUrl, pageSize, currentSearchTerm, sortBy, sortOrder, router]
  );

  const handlePageSizeChange = useCallback(
    (size: string) => {
      const newSize = parseInt(size, 10) || 10;
      router.push(buildUrl(1, newSize, currentSearchTerm, sortBy, sortOrder));
    },
    [buildUrl, currentSearchTerm, sortBy, sortOrder, router]
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
    changePage,
    handlePageSizeChange,
    paginationInfo,
  };
}
