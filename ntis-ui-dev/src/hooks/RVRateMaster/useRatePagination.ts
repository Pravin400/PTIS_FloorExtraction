import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { IZoneDescription } from "@/types/RVRateMaster";

interface UseRatePaginationProps {
  paginatedZonesData?: {
    items: IZoneDescription[];
    totalPages: number;
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
  zoneDescriptions: IZoneDescription[];
}

/**
 * Hook for managing matrix grid pagination
 */
export function useRatePagination({
  paginatedZonesData,
  zoneDescriptions,
}: UseRatePaginationProps) {
  const router = useRouter();

  const getCalculatedTotalPages = useCallback((totalCount?: number, pageSize?: number, fallbackTotalPages?: number) => {
    if (totalCount && pageSize && pageSize > 0) {
      return Math.max(1, Math.ceil(totalCount / pageSize));
    }
    return fallbackTotalPages ?? Math.max(1, Math.ceil(zoneDescriptions.length / (pageSize || 100)));
  }, [zoneDescriptions]);

  // Pagination state for matrix grid
  const [matrixPageNumber, setMatrixPageNumber] = useState(paginatedZonesData?.pageNumber ?? 1);
  const [matrixPageSize, setMatrixPageSize] = useState(paginatedZonesData?.pageSize ?? 100);
  const [matrixTotalPages, setMatrixTotalPages] = useState(
    getCalculatedTotalPages(paginatedZonesData?.totalCount, paginatedZonesData?.pageSize, paginatedZonesData?.totalPages)
  );
  const [matrixTotalCount, setMatrixTotalCount] = useState(paginatedZonesData?.totalCount ?? zoneDescriptions.length);
  const [paginatedZoneDescriptions, setPaginatedZoneDescriptions] = useState(paginatedZonesData?.items ?? zoneDescriptions.slice(0, 100));

  // Sync paginated zone data from server-provided props when they change
  useEffect(() => {
    if (paginatedZonesData) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setPaginatedZoneDescriptions(paginatedZonesData.items);
      const computedTotalPages = getCalculatedTotalPages(
        paginatedZonesData.totalCount,
        paginatedZonesData.pageSize,
        paginatedZonesData.totalPages
      );
      setMatrixTotalPages(computedTotalPages);
      setMatrixTotalCount(paginatedZonesData.totalCount);
      setMatrixPageNumber(paginatedZonesData.pageNumber);
      setMatrixPageSize(paginatedZonesData.pageSize);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [paginatedZonesData, getCalculatedTotalPages]);

  // Handle pagination changes via URL navigation
  const handleMatrixPaginationChange = (newPageNumber: number, newPageSize: number) => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    params.set('matrixPage', String(newPageNumber));
    params.set('matrixPageSize', String(newPageSize));
    
    setMatrixPageNumber(newPageNumber);
    setMatrixPageSize(newPageSize);
    
    const pathname = window.location.pathname;
    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl);
  };

  return {
    matrixPageNumber,
    matrixPageSize,
    matrixTotalPages,
    matrixTotalCount,
    paginatedZoneDescriptions,
    handleMatrixPaginationChange,
  };
}
