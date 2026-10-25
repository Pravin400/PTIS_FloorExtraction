"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UsePenaltyRulePaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale: string;
  startTransition: (callback: () => void) => void;
  basePath?: string;
  currentSearchTerm?: string;
}

export function usePenaltyRulePagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  startTransition,
  basePath = "/water-bill/penalty-rule-master",
  currentSearchTerm,
}: UsePenaltyRulePaginationProps) {
  const router = useRouter();

  const changePage = useCallback(
    (page: number): void => {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const params = new URLSearchParams(search);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (currentSearchTerm) {
        params.set("q", currentSearchTerm);
      }
      startTransition(() => {
        router.push(`/${locale}${basePath}?${params.toString()}`);
      });
    },
    [pageSize, locale, basePath, currentSearchTerm, router, startTransition]
  );

  const handlePageSizeChange = useCallback(
    (newSize: string | number): void => {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const params = new URLSearchParams(search);
      params.set("page", "1");
      params.set("pageSize", String(newSize));
      if (currentSearchTerm) {
        params.set("q", currentSearchTerm);
      }
      startTransition(() => {
        router.push(`/${locale}${basePath}?${params.toString()}`);
      });
    },
    [locale, basePath, currentSearchTerm, router, startTransition]
  );

  const start = totalCount === 0 ? 0 : ((pageNumber || 1) - 1) * (pageSize || 10) + 1;
  const end = Math.min(start + (pageSize || 10) - 1, totalCount);
  const total = totalCount || 0;

  return {
    changePage,
    handlePageSizeChange,
    paginationInfo: {
      start,
      end,
      total,
    },
  };
}
