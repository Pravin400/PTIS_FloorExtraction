"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseOfficePaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale: string;
  currentSearchTerm: string;
  sortBy?: string;
  sortOrder?: string;
  startTransition: (callback: () => void) => void;
  type?: string;
  status?: string;
}

export function useOfficePagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  currentSearchTerm,
  sortBy,
  sortOrder,
  startTransition,
  type,
  status,
}: UseOfficePaginationProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (page: number, size: number, searchTerm?: string, newSortBy?: string, newSortOrder?: string, newType?: string, newStatus?: string) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));
      if (searchTerm) {
        params.set("q", searchTerm);
      }
      if (newSortBy) {
        params.set("sortBy", newSortBy);
      }
      if (newSortOrder) {
        params.set("sortOrder", newSortOrder);
      }
      if (newType ?? type) {
        params.set("type", (newType ?? type)!);
      }
      if (newStatus ?? status) {
        params.set("status", (newStatus ?? status)!);
      }
      return `/${locale}/configuration-settings/office-master?${params.toString()}`;
    },
    [locale, type, status]
  );

  const changePage = useCallback((p: number): void => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("pageSize", String(pageSize));

    if (currentSearchTerm) {
      params.set("q", currentSearchTerm);
    }
    // Preserve sort params when paginating
    if (sortBy) {
      params.set("sortBy", sortBy);
    }
    if (sortOrder) {
      params.set("sortOrder", sortOrder);
    }
    if (type) {
      params.set("type", type);
    }
    if (status) {
      params.set("status", status);
    }

    startTransition(() => {
      router.push(`/${locale}/configuration-settings/office-master?${params.toString()}`);
    });
  }, [pageSize, currentSearchTerm, sortBy, sortOrder, type, status, locale, router, startTransition]);

  const handlePageSizeChange = useCallback((value: string) => {
    startTransition(() => {
      router.push(
        buildUrl(1, Number(value), currentSearchTerm, sortBy, sortOrder, type, status)
      );
    });
  }, [router, buildUrl, currentSearchTerm, sortBy, sortOrder, type, status, startTransition]);

  // Footer pagination calculations
  const start = totalCount === 0 ? 0 : ((pageNumber || 1) - 1) * (pageSize || 10) + 1;
  const end = Math.min(start + (pageSize || 10) - 1, totalCount);
  const total = totalCount || 0;

  return {
    buildUrl,
    changePage,
    handlePageSizeChange,
    paginationInfo: {
      start,
      end,
      total,
    },
  };
}
