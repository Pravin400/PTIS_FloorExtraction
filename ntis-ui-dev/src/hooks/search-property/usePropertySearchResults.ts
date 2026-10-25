"use client";

import React from "react";
import type { UsePropertySearchResultsProps } from "@/types/property-search";

const DEFAULT_PAGE_SIZE = 10;

type PaginationState = {
  resultsKey: string;
  pageNumber: number;
  pageSize: number;
};

function getResultsKey(results: UsePropertySearchResultsProps["results"]): string {
  if (!results?.length) return "";
  return `${results.length}:${results[0]?.id}:${results.at(-1)?.id}`;
}

/**
 * Slices the result list locally if in client-side mode (e.g. for units),
 * or delegates pagination to server-side query state if props are provided.
 */
export function usePropertySearchResults({
  results,
  totalCount,
  pageNumber,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: UsePropertySearchResultsProps) {
  const isClientSide =
    totalCount === undefined ||
    pageNumber === undefined ||
    pageSize === undefined;

  const resultsKey = React.useMemo(() => getResultsKey(results), [results]);
  const [pagination, setPagination] = React.useState<PaginationState>(() => ({
    resultsKey: getResultsKey(results),
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  }));

  if (pagination.resultsKey !== resultsKey) {
    setPagination((prev) => ({
      resultsKey,
      pageNumber: 1,
      pageSize: prev.pageSize,
    }));
  }

  const pageNum =
    pagination.resultsKey === resultsKey ? pagination.pageNumber : 1;
  const pageSz = pagination.pageSize;

  const filteredData = React.useMemo(() => results ?? [], [results]);
  const count = filteredData.length;
  const pages = Math.max(1, Math.ceil(count / pageSz));
  const safePage = Math.min(pageNum, pages);

  const paginatedData = React.useMemo(() => {
    const start = (safePage - 1) * pageSz;
    return filteredData.slice(start, start + pageSz);
  }, [filteredData, safePage, pageSz]);

  const handlePageChangeClient = React.useCallback(
    (page: number) => {
      setPagination((prev) => ({
        resultsKey,
        pageNumber: page,
        pageSize: prev.pageSize,
      }));
    },
    [resultsKey]
  );

  const handlePageSizeChangeClient = React.useCallback(
    (size: number) => {
      setPagination({
        resultsKey,
        pageNumber: 1,
        pageSize: size,
      });
    },
    [resultsKey]
  );

  const handlePageChangeServer = React.useCallback(
    (page: number) => {
      if (onPageChange) onPageChange(page);
    },
    [onPageChange]
  );

  const handlePageSizeChangeServer = React.useCallback(
    (size: number) => {
      if (onPageSizeChange) onPageSizeChange(size);
    },
    [onPageSizeChange]
  );

  if (isClientSide) {
    return {
      filteredData,
      paginatedData,
      pageNumber: safePage,
      pageSize: pageSz,
      totalCount: count,
      totalPages: pages,
      handlePageChange: handlePageChangeClient,
      handlePageSizeChange: handlePageSizeChangeClient,
    };
  }

  // Server-side mode
  const safePageNumber = pageNumber ?? 1;
  const safePageSize = pageSize ?? DEFAULT_PAGE_SIZE;
  const serverCount = totalCount ?? 0;
  const serverPages = Math.max(1, Math.ceil(serverCount / safePageSize));

  return {
    filteredData,
    paginatedData: results,
    pageNumber: safePageNumber,
    pageSize: safePageSize,
    totalCount: serverCount,
    totalPages: serverPages,
    handlePageChange: handlePageChangeServer,
    handlePageSizeChange: handlePageSizeChangeServer,
  };
}
