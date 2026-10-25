'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseModulePaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale: string;
  currentSearchTerm: string;
  startTransition: (callback: () => void) => void;
}

export function useModulePagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  currentSearchTerm,
  startTransition,
}: UseModulePaginationProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (page: number, size: number, searchTerm?: string) => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(size));
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      return `/${locale}/configuration-settings/module-master?${params.toString()}`;
    },
    [locale]
  );

  const changePage = useCallback(
    (p: number): void => {
      startTransition(() => {
        router.push(buildUrl(p, pageSize, currentSearchTerm));
      });
    },
    [pageSize, currentSearchTerm, buildUrl, router, startTransition]
  );

  const handlePageSizeChange = useCallback(
    (value: string) => {
      startTransition(() => {
        router.push(buildUrl(1, Number(value), currentSearchTerm));
      });
    },
    [buildUrl, currentSearchTerm, startTransition, router]
  );

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
