import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRevenueUrlFilters } from './useRevenueUrlFilters';
import type { RevenueRecordsData, RevenueCategoryDistribution } from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

const ALL = 'all';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRevenueAssetRecordsView(data: RevenueRecordsData | undefined, searchTerm: string = '', copy: any) {
  const router = useRouter();
  const { setParams, searchParams } = useRevenueUrlFilters();
  const [searchInput, setSearchInput] = useState(searchTerm);

  const parsedData = useMemo(() => {
    if (!data) return null;
    const { categories, summary, list, zones, wards, selectedCategoryId } = data;
    const totalAssets = categories.reduce((sum, c) => sum + c.assetCount, 0);
    const activeCategory: RevenueCategoryDistribution | null =
      selectedCategoryId != null
        ? categories.find((c) => c.assetCategoryId === selectedCategoryId) ?? null
        : null;

    const stats = activeCategory
      ? {
        demand: activeCategory.demand,
        collected: activeCategory.collection,
        pending: activeCategory.pending,
      }
      : {
        demand: summary.totalDemand,
        collected: summary.totalCollection,
        pending: summary.totalPending,
      };

    const headerName = activeCategory ? activeCategory.categoryName : copy.records.allCategories;

    return {
      categories, summary, list, zones, wards, selectedCategoryId,
      totalAssets, activeCategory, stats, headerName
    };
  }, [data, copy]);

  const currentType = (searchParams.get('type') as string) || ALL;
  const currentStatus = (searchParams.get('status') as string) || ALL;
  const currentZoneId = searchParams.get('zoneId') ? Number(searchParams.get('zoneId')) : null;
  const currentWardId = searchParams.get('wardId') ? Number(searchParams.get('wardId')) : null;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ q: searchInput.trim() || null }, { resetPage: true });
  };

  const startIndex = parsedData ? (parsedData.list.pageNumber - 1) * parsedData.list.pageSize : 0;

  return {
    router,
    setParams,
    searchInput,
    setSearchInput,
    parsedData,
    currentType,
    currentStatus,
    currentZoneId,
    currentWardId,
    submitSearch,
    startIndex,
    ALL,
  };
}
