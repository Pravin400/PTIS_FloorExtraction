import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UseFloorPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale: string;
  propertyId: number;
  startTransition: (callback: () => void) => void;
}

export function useFloorPagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  propertyId,
  startTransition,
}: UseFloorPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildUrl = useCallback(
    (page: number, size: number) => {
      // Preserve existing query parameters
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      params.set("pageSize", String(size));
      return `/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/OldDetails/floor-information?${params.toString()}`;
    },
    [locale, propertyId, searchParams]
  );

  const changePage = useCallback((p: number): void => {
    startTransition(() => {
      router.push(buildUrl(p, pageSize));
    });
  }, [pageSize, buildUrl, router, startTransition]);

  const handlePageSizeChange = useCallback((value: string) => {
    startTransition(() => {
      router.push(buildUrl(1, Number(value)));
    });
  }, [router, buildUrl, startTransition]);

  const handleSearchChange = useCallback((search: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search && search.trim()) {
        params.set("search", search.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // Reset to first page on search
      router.push(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/OldDetails/floor-information?${params.toString()}`);
    });
  }, [locale, propertyId, router, searchParams, startTransition]);

  // Footer pagination calculations
  const start = totalCount === 0 ? 0 : ((pageNumber || 1) - 1) * (pageSize || 10) + 1;
  const end = Math.min(start + (pageSize || 10) - 1, totalCount);
  const total = totalCount || 0;

  return {
    buildUrl,
    changePage,
    handlePageSizeChange,
    handleSearchChange,
    paginationInfo: {
      start,
      end,
      total,
    },
  };
}
