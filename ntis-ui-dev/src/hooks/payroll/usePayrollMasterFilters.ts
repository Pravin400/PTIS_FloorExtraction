'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PAYROLL_LIMITS } from '@/lib/constants/payroll.constants';

export type MasterStatusFilter = 'all' | 'active' | 'inactive';

export interface UsePayrollMasterFiltersOptions {
  defaultPageSize?: number;
  debounceMs?: number;
  defaultPage?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
}

export function usePayrollMasterFilters(options: UsePayrollMasterFiltersOptions = {}) {
  const {
    defaultPageSize = 10,
    debounceMs = 300,
    defaultPage = 1,
    defaultSortBy,
    defaultSortOrder,
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Read current URL state
  const urlPage = parseInt(searchParams.get('page') || String(defaultPage), 10);
  const pageNumber = Number.isFinite(urlPage) && urlPage > 0 ? urlPage : defaultPage;
  const urlPageSize = parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10);
  const pageSize = Number.isFinite(urlPageSize) && urlPageSize > 0 ? Math.min(PAYROLL_LIMITS.MAX_PAGE_SIZE, Math.max(1, urlPageSize)) : defaultPageSize;
  const urlSearch = searchParams.get('q') || '';
  const rawStatus = (searchParams.get('status') || 'all').toLowerCase() as MasterStatusFilter;
  const statusFilter: MasterStatusFilter = ['all', 'active', 'inactive'].includes(rawStatus) ? rawStatus : 'all';
  const sortBy = searchParams.get('sortBy') || defaultSortBy || undefined;
  const rawSortOrder = searchParams.get('sortOrder') || defaultSortOrder || undefined;
  const sortOrder = rawSortOrder && ['asc', 'desc'].includes(rawSortOrder.toLowerCase())
    ? (rawSortOrder.toLowerCase() as 'asc' | 'desc')
    : undefined;

  // Local search draft state for instant responsiveness while typing
  const [searchDraft, setSearchDraft] = useState(urlSearch);
  const prevUrlSearchRef = useRef(urlSearch);

  useEffect(() => {
    if (prevUrlSearchRef.current !== urlSearch) {
      prevUrlSearchRef.current = urlSearch;
      setSearchDraft(urlSearch);
    }
  }, [urlSearch]);

  // Local status draft state for instant responsiveness and mock router support
  const [statusDraft, setStatusDraft] = useState<MasterStatusFilter>(statusFilter);
  const prevUrlStatusRef = useRef(statusFilter);

  useEffect(() => {
    if (prevUrlStatusRef.current !== statusFilter) {
      prevUrlStatusRef.current = statusFilter;
      setStatusDraft(statusFilter);
    }
  }, [statusFilter]);

  // Central URL update helper using useTransition
  const updateUrl = useCallback(
    (updates: {
      page?: number;
      pageSize?: number;
      q?: string;
      status?: MasterStatusFilter;
      sortBy?: string | null;
      sortOrder?: 'asc' | 'desc' | null;
    }) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (updates.page !== undefined) {
        if (updates.page > 1) nextParams.set('page', String(updates.page));
        else nextParams.delete('page');
      }

      if (updates.pageSize !== undefined) {
        if (updates.pageSize !== defaultPageSize) nextParams.set('pageSize', String(updates.pageSize));
        else nextParams.delete('pageSize');
      }

      if (updates.q !== undefined) {
        const trimmed = updates.q.trim();
        if (trimmed) nextParams.set('q', trimmed);
        else nextParams.delete('q');
      }

      if (updates.status !== undefined) {
        if (updates.status !== 'all') nextParams.set('status', updates.status);
        else nextParams.delete('status');
      }

      if (updates.sortBy !== undefined) {
        if (updates.sortBy) nextParams.set('sortBy', updates.sortBy);
        else nextParams.delete('sortBy');
      }

      if (updates.sortOrder !== undefined) {
        if (updates.sortOrder) nextParams.set('sortOrder', updates.sortOrder);
        else nextParams.delete('sortOrder');
      }

      if (nextParams.toString() === searchParams.toString()) {
        return;
      }

      const qs = nextParams.toString();
      const target = qs ? `${pathname}?${qs}` : pathname;

      startTransition(() => {
        router.replace(target, { scroll: false });
      });
    },
    [router, pathname, searchParams, defaultPageSize]
  );

  // Debounced search commit
  useEffect(() => {
    const trimmedDraft = searchDraft.trim();
    const trimmedUrl = urlSearch.trim();

    if (trimmedDraft === trimmedUrl) {
      return;
    }

    const timer = setTimeout(() => {
      updateUrl({ q: trimmedDraft, page: 1 });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchDraft, urlSearch, debounceMs, updateUrl]);

  const handleSearchChange = (value: string) => {
    const sanitized = value.replace(/^\s+/, '').replace(/\s+/g, ' ');
    setSearchDraft(sanitized);
  };

  const handleStatusChange = (status: MasterStatusFilter | string) => {
    const normalized = String(status || 'all').toLowerCase() as MasterStatusFilter;
    const finalStatus: MasterStatusFilter = ['all', 'active', 'inactive'].includes(normalized) ? normalized : 'all';
    setStatusDraft(finalStatus);
    updateUrl({ status: finalStatus, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateUrl({ pageSize: newPageSize, page: 1 });
  };

  const handleSort = (columnKey: string) => {
    let nextOrder: 'asc' | 'desc' | null = 'asc';
    let nextSortBy: string | null = columnKey;

    if (sortBy === columnKey) {
      if (sortOrder === 'asc') {
        nextOrder = 'desc';
      } else if (sortOrder === 'desc') {
        nextSortBy = null;
        nextOrder = null;
      }
    }

    updateUrl({ sortBy: nextSortBy, sortOrder: nextOrder, page: 1 });
  };

  return {
    isPending,
    search: searchDraft,
    statusFilter: statusDraft,
    pageNumber,
    pageSize,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleStatusChange,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  };
}
