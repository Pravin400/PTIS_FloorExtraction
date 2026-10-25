import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseSocialAttributePaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale: string;
  currentSearchTerm: string;
  sortBy?: string;
  sortOrder?: string;
  startTransition: (callback: () => void) => void;
}

export function useSocialAttributePagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  currentSearchTerm,
  sortBy,
  sortOrder,
  startTransition,
}: UseSocialAttributePaginationProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (
      page: number,
      size: number,
      searchTerm?: string,
      newSortBy?: string,
      newSortOrder?: string
    ) => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(size));
      if (searchTerm) {
        params.set('q', searchTerm);
      }
      if (newSortBy) {
        params.set('sortBy', newSortBy);
      }
      if (newSortOrder) {
        params.set('sortOrder', newSortOrder);
      }
      return `/${locale}/property-tax/social-attribute-master?${params.toString()}`;
    },
    [locale]
  );

  const changePage = useCallback(
    (p: number): void => {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('pageSize', String(pageSize));

      if (currentSearchTerm) {
        params.set('q', currentSearchTerm);
      }
      if (sortBy) {
        params.set('sortBy', sortBy);
      }
      if (sortOrder) {
        params.set('sortOrder', sortOrder);
      }

      startTransition(() => {
        router.push(`/${locale}/property-tax/social-attribute-master?${params.toString()}`);
      });
    },
    [pageSize, currentSearchTerm, sortBy, sortOrder, locale, router, startTransition]
  );

  const handlePageSizeChange = useCallback(
    (value: string) => {
      startTransition(() => {
        router.push(buildUrl(1, Number(value), currentSearchTerm, sortBy, sortOrder));
      });
    },
    [router, buildUrl, currentSearchTerm, sortBy, sortOrder, startTransition]
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
