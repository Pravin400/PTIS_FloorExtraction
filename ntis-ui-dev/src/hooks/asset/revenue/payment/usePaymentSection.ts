import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { LeaseRentPaymentDetail } from '@/types/asset/revenue/payment/leaseRentPayment.types';

export interface PaymentRecordsPageData {
  query: {
    pageSize: number;
    pageNumber: number;
    zone?: string;
    ward?: string;
    assetCategory?: string;
    leaseRentType?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  records: LeaseRentPaymentDetail[];
  totalEntries: number;
  totalPages: number;
  startIndex: number;
}

export function usePaymentSection(pageData: PaymentRecordsPageData) {
  const t = useTranslations('AssetPayment.records');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const { query, records, totalEntries, totalPages, startIndex } = pageData;
  const [smartSearch, setSmartSearch] = useState(query.search);
  const debouncedSearch = useDebounce(smartSearch, 500);

  const updateRoute = useCallback((updates: Record<string, string>) => {
    const merged = {
      PageSize: String(query.pageSize),
      PageNumber: String(query.pageNumber),
      ZoneId: query.zone,
      WardId: query.ward,
      AssetCategoryId: query.assetCategory,
      LeaseRentType: query.leaseRentType,
      Status: query.status,
      Search: query.search,
      SortBy: query.sortBy,
      SortOrder: query.sortOrder,
      ...updates,
    };

    const filterKeys = new Set(['ZoneId', 'WardId', 'AssetCategoryId', 'LeaseRentType', 'Status']);
    const next = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (!value) return;
      if (key === 'PageSize' || key === 'PageNumber') {
        next.set(key, String(value));
      } else if (filterKeys.has(key)) {
        if (value !== 'all') next.set(key, String(value));
      } else {
        next.set(key, String(value));
      }
    });

    router.push(`/${params.locale}/assets/revenue/payment?${next.toString()}`);
  }, [query.pageSize, query.pageNumber, query.zone, query.ward, query.assetCategory, query.leaseRentType, query.status, query.search, query.sortBy, query.sortOrder, router, params.locale]);

  useEffect(() => {
    if ((debouncedSearch ?? '').trim() !== (query.search ?? '').trim()) {
      updateRoute({ Search: (debouncedSearch ?? '').trim(), PageNumber: '1' });
    }
  }, [debouncedSearch, query.search, updateRoute]);

  const listQueryString = (() => {
    const next = new URLSearchParams();
    if (query.pageSize) next.set('PageSize', String(query.pageSize));
    if (query.pageNumber) next.set('PageNumber', String(query.pageNumber));
    if (query.zone && query.zone !== 'all') next.set('ZoneId', String(query.zone));
    if (query.ward && query.ward !== 'all') next.set('WardId', String(query.ward));
    if (query.assetCategory && query.assetCategory !== 'all') next.set('AssetCategoryId', String(query.assetCategory));
    if (query.leaseRentType && query.leaseRentType !== 'all') next.set('LeaseRentType', String(query.leaseRentType));
    if (query.status && query.status !== 'all') next.set('Status', String(query.status));
    if (query.search) next.set('Search', String(query.search));
    if (query.sortBy) next.set('SortBy', String(query.sortBy));
    if (query.sortOrder) next.set('SortOrder', String(query.sortOrder));
    return next.toString();
  })();

  const handleSort = (column: string) => {
    if (query.sortBy !== column) {
      updateRoute({ SortBy: column, SortOrder: 'asc', PageNumber: '1' });
      return;
    }

    const nextOrder = query.sortOrder === 'asc' ? 'desc' : 'asc';
    updateRoute({ SortBy: column, SortOrder: nextOrder, PageNumber: '1' });
  };

  return {
    t,
    query,
    records,
    totalEntries,
    totalPages,
    startIndex,
    smartSearch,
    setSmartSearch,
    listQueryString,
    updateRoute,
    handleSort,
    router,
    params,
  };
}
