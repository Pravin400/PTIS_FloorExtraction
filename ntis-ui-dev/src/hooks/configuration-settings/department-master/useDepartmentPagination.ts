"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UseDepartmentPaginationProps {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  currentSearchTerm: string;
  startTransition: (callback: () => void) => void;
  status: string;
}

export function useDepartmentPagination({
  totalCount,
  pageNumber,
  pageSize,
  currentSearchTerm,
  startTransition,
  status,
}: UseDepartmentPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildUrl = useCallback((
    page: number,
    size: number,
    search: string,
    stat: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    params.set("pageSize", String(size));
    
    if (search) params.set("search", search);
    else params.delete("search");
    
    if (stat) params.set("status", stat);
    else params.delete("status");

    return `${pathname}?${params.toString()}`;
  }, [pathname, searchParams]);

  const changePage = (page: number) => {
    startTransition(() => {
      router.push(buildUrl(page, pageSize, currentSearchTerm, status));
    });
  };

  const handlePageSizeChange = (size: string) => {
    startTransition(() => {
      router.push(buildUrl(1, Number(size), currentSearchTerm, status));
    });
  };

  const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const end = Math.min(pageNumber * pageSize, totalCount);

  return {
    buildUrl,
    changePage,
    handlePageSizeChange,
    paginationInfo: { start, end },
  };
}
