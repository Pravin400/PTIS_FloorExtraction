import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UseGeographyTypePaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale: string;
  currentSearchTerm: string;
  startTransition: (callback: () => void) => void;
}

export function useGeographyTypePagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  currentSearchTerm,
  startTransition,
}: UseGeographyTypePaginationProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (page: number, size: number, searchTerm?: string) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));
      if (searchTerm) {
        params.set("q", searchTerm);
      }
      return `/${locale}/water-bill/geography-type-master?${params.toString()}`;
    },
    [locale]
  );

  useEffect(() => {
    const currentPage = pageNumber || 1;
    const currentPageSize = pageSize || 10;

    const maxPage = Math.max(1, Math.ceil(totalCount / currentPageSize));

    if (currentPage > maxPage) {
      startTransition(() => {
        router.push(buildUrl(maxPage, currentPageSize, currentSearchTerm));
      });
    }
  }, [pageNumber, pageSize, totalCount, currentSearchTerm, router, buildUrl, startTransition]);

  const changePage = useCallback(
    (p: number): void => {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("pageSize", String(pageSize));

      if (currentSearchTerm) {
        params.set("q", currentSearchTerm);
      }

      startTransition(() => {
        router.push(`/${locale}/water-bill/geography-type-master?${params.toString()}`);
      });
    },
    [pageSize, currentSearchTerm, locale, router, startTransition]
  );

  const handlePageSizeChange = useCallback(
    (value: string) => {
      startTransition(() => {
        router.push(buildUrl(1, Number(value), currentSearchTerm));
      });
    },
    [router, buildUrl, currentSearchTerm, startTransition]
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
