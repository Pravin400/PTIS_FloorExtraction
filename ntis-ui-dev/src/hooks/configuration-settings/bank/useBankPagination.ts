'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseBankPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale: string;
  currentSearchTerm: string;
  filterState?: string;
  startTransition: (callback: () => void) => void;
}

export function useBankPagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  currentSearchTerm,
  filterState,
  startTransition,
}: UseBankPaginationProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (page: number, size: number, searchTerm?: string, state?: string) => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(size));
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      if (state && state !== 'all') {
        params.set('state', state);
      }
      return `/${locale}/configuration-settings/bank-master?${params.toString()}`;
    },
    [locale]
  );

  const changePage = useCallback(
    (p: number): void => {
      startTransition(() => {
        router.push(buildUrl(p, pageSize, currentSearchTerm, filterState));
      });
    },
    [pageSize, currentSearchTerm, filterState, buildUrl, router, startTransition]
  );

  const handlePageSizeChange = useCallback(
    (value: string) => {
      startTransition(() => {
        router.push(buildUrl(1, Number(value), currentSearchTerm, filterState));
      });
    },
    [buildUrl, currentSearchTerm, filterState, startTransition, router]
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
