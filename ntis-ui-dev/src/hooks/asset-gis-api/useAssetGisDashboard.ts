'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '../useDebounce';
import { GisSearchParams, GisFilters, gisQueryKeys } from './query-keys';
import { useKpiSummary, useUnifiedData, usePropertyGroups, usePropertyTypes, useDashboardInit } from './useAssetGisDashboardQueries';
import { useGisConfig, useGisHeader } from './useAssetGisMapQueries';

/**
 * Master hook that combines KPI + Ward + Property Groups
 * Fetches all dashboard data in parallel for faster loading
 */
export function useAssetGisDashboard(filters: GisFilters = {}, options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const isEnabled = options.enabled ?? true;

  const searchParams: GisSearchParams = useMemo(() => ({
    category: filters.category,
    propertyTypeGroup: filters.propertyTypeGroup,
    PropertyTypeID: filters.PropertyTypeID,
    zoneId: filters.zoneId,
    blockId: filters.blockId,
    wardNo: filters.wardNo,
    statusType: filters.statusType,
    ownerIdListCsv: filters.ownerIdListCsv,
    assessmentSubCategory: filters.assessmentSubCategory,
    documentSubmittedStatus: filters.documentSubmittedStatus,
    searchTerm: filters.searchTerm,
    taxStatus: filters.taxStatus,
  }), [
    filters.category,
    filters.propertyTypeGroup,
    filters.PropertyTypeID,
    filters.zoneId,
    filters.blockId,
    filters.wardNo,
    filters.statusType,
    filters.ownerIdListCsv,
    filters.assessmentSubCategory,
    filters.documentSubmittedStatus,
    filters.searchTerm,
    filters.taxStatus
  ]);

  // DEBOUNCE: Split timing for faster counts and lighter server footprints
  const debouncedParamsKpi = useDebounce(searchParams, 100);
  const debouncedParamsHeavy = useDebounce(searchParams, 400);

  // PERFORMANCE: Snappy, instant counts (100ms) + progressive dashboard loading (400ms)
  const kpiQuery = useKpiSummary(debouncedParamsKpi, { enabled: isEnabled });
  const unifiedQuery = useUnifiedData(debouncedParamsHeavy, { enabled: isEnabled });
  const groupsQuery = usePropertyGroups({ enabled: isEnabled });
  // Context-aware: Pass current zone/block so counts are accurate
  const typesQuery = usePropertyTypes(
    filters.propertyTypeGroup || undefined,
    { zoneId: filters.zoneId, blockId: filters.blockId },
    { enabled: isEnabled && !!filters.propertyTypeGroup && filters.propertyTypeGroup !== 'all' }
  );

  const data = unifiedQuery.data;
  const kpiSummaryData = kpiQuery.data || data?.kpiSummary;
  
  // Combine property groups with KPI counts
  const propertyGroupsWithCounts = (groupsQuery.data || []).map((group) => {
    const kpi = kpiSummaryData as Record<string, unknown> | undefined;
    if (!kpi) return group;

    const val = String(group.value || group.id || '').toUpperCase();
    let total = 0;

    if (val === 'C' || val === 'COMMERCIAL') total = Number(kpi.commercialCount ?? kpi.CommercialCount ?? 0);
    else if (val === 'R' || val === 'RESIDENTIAL') total = Number(kpi.residentialCount ?? kpi.ResidentialCount ?? 0);
    else if (val === 'N' || val === 'GOVERNMENTAL' || val === 'GOVERNMENT') total = Number(kpi.governmentPropertyCount ?? kpi.GovernmentPropertyCount ?? 0);
    else if (val === 'R-C' || val === 'MIXED') total = Number(kpi.mixCount ?? kpi.MixCount ?? 0);
    else if (val === 'I' || val === 'INDUSTRIAL') total = Number(kpi.industryCount ?? kpi.IndustryCount ?? 0);

    return { ...group, total };
  });

  const isLoading = kpiQuery.isLoading || unifiedQuery.isLoading || groupsQuery.isLoading || typesQuery.isLoading;
  const isFetching = kpiQuery.isFetching || unifiedQuery.isFetching || groupsQuery.isFetching || typesQuery.isFetching;
  const error = kpiQuery.error || unifiedQuery.error || groupsQuery.error || typesQuery.error;

  // Refetch all data
  const refetchAll = async () => {
    await Promise.all([
      kpiQuery.refetch(),
      unifiedQuery.refetch(),
      groupsQuery.refetch(),
      typesQuery.refetch(),
    ]);
  };

  // Invalidate all dashboard queries
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: gisQueryKeys.all });
  };

  return {
    kpiSummary: kpiSummaryData,
    wardSummary: data?.wardSummary || [],
    properties: data?.properties || [],
    propertyGroups: propertyGroupsWithCounts,
    propertyTypeMasterList: typesQuery.data || [],
    isLoading,
    isFetching,
    error,
    refetchAll,
    invalidateAll,
  };
}

/**
 * Hook for initializing the GIS module
 * Prefetches all static data for faster subsequent loads
 */
export function useGisInit(params: GisSearchParams = {}) {
  const initQuery = useDashboardInit(params);
  const groupsQuery = usePropertyGroups();
  const configQuery = useGisConfig();
  const headerQuery = useGisHeader();

  const isLoading = initQuery.isLoading || groupsQuery.isLoading;
  const error = initQuery.error || groupsQuery.error;

  return {
    // Init Data
    initData: initQuery.data,
    propertyGroups: groupsQuery.data || [],
    config: configQuery.data,
    header: headerQuery.data,

    // States
    isLoading,
    error,

    // Individual queries
    queries: {
      init: initQuery,
      groups: groupsQuery,
      config: configQuery,
      header: headerQuery,
    },
  };
}

/**
 * Hook for optimistic updates on filter changes
 */
export function useOptimisticFilters() {
  const queryClient = useQueryClient();

  const setFilters = (filters: GisFilters) => {
    queryClient.cancelQueries({ queryKey: gisQueryKeys.kpiSummary() });
    queryClient.cancelQueries({ queryKey: gisQueryKeys.wardSummary() });

    queryClient.invalidateQueries({
      queryKey: gisQueryKeys.kpiSummary(filters as GisSearchParams),
    });
    queryClient.invalidateQueries({
      queryKey: gisQueryKeys.wardSummary(filters as GisSearchParams),
    });
  };

  return { setFilters };
}
