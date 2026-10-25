import { useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseGisKpiPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  locale: string;
  currentSearchTerm: string;
  sortBy?: string;
  sortOrder?: string;
  departmentId?: string;
  startTransition: (callback: () => void) => void;
}

export function useGisKpiPagination({
  pageNumber,
  pageSize,
  totalCount,
  locale,
  currentSearchTerm,
  sortBy,
  sortOrder,
  departmentId,
  startTransition,
}: UseGisKpiPaginationProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (
      page: number,
      size: number,
      searchTerm?: string,
      newSortBy?: string,
      newSortOrder?: string,
      deptId?: string
    ) => {
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
      const activeDeptId = deptId !== undefined ? deptId : departmentId;
      if (activeDeptId && activeDeptId !== "all") {
        params.set("departmentId", activeDeptId);
      }
      return `/${locale}/configuration-settings/gis-master/gis-kpi-master?${params.toString()}`;
    },
    [locale, departmentId]
  );
  const changePage = useCallback(
    (p: number): void => {
      startTransition(() => {
        router.push(buildUrl(p, pageSize, currentSearchTerm, sortBy, sortOrder));
      });
    },
    [buildUrl, pageSize, currentSearchTerm, sortBy, sortOrder, router, startTransition]
  );

  const handlePageSizeChange = useCallback(
    (value: string | number): void => {
      startTransition(() => {
        router.push(buildUrl(1, Number(value), currentSearchTerm, sortBy, sortOrder));
      });
    },
    [buildUrl, currentSearchTerm, sortBy, sortOrder, router, startTransition]
  );

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
