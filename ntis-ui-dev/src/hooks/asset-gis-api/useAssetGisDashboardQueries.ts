'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GisSearchParams, GisKpiSummary, GisWardSummaryItem, PropertyGroup, PropertyTypeMasterItem, GisDashboardInitData, GisUnifiedDashboardData } from '@/types/asset-gis.types';
import { gisQueryKeys } from './query-keys';
import {
  getDashboardInitAction,
  getKpiSummaryAction,
  getWardSummaryAction,
  getPropertyGroupsAction,
  getPropertyTypeMasterListAction,
  getPropertyDictionaryAction,
  getUnifiedDataAction
} from '@/app/[locale]/assets/gismapviewer/actions';

/**
 * Hook to fetch Dashboard Init data (Zones, Blocks, Categories) via Server Action
 */
export function useDashboardInit(params: GisSearchParams = {}, options?: Partial<UseQueryOptions<GisDashboardInitData>>) {
  return useQuery({
    queryKey: gisQueryKeys.dashboardInit(params),
    queryFn: async (): Promise<GisDashboardInitData> => {
      const res = await getDashboardInitAction(params);
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to fetch dashboard init');
      return res.data as GisDashboardInitData;
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch KPI Summary via Server Action
 */
export function useKpiSummary(params: GisSearchParams = {}, options?: Partial<UseQueryOptions<GisKpiSummary>>) {
  return useQuery({
    queryKey: gisQueryKeys.kpiSummary(params),
    queryFn: async (): Promise<GisKpiSummary> => {
      const res = await getKpiSummaryAction(params);
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to fetch KPI summary');
      return res.data as GisKpiSummary;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
    ...options,
  });
}

/**
 * Hook to fetch Ward Summary via Server Action
 */
export function useWardSummary(params: GisSearchParams = {}, options?: Partial<UseQueryOptions<GisWardSummaryItem[]>>) {
  return useQuery({
    queryKey: gisQueryKeys.wardSummary(params),
    queryFn: async (): Promise<GisWardSummaryItem[]> => {
      const res = await getWardSummaryAction(params);
      if (!res.success || !res.data) return [];
      return res.data as GisWardSummaryItem[];
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
    ...options,
  });
}

/**
 * Hook to fetch ALL Ward Summaries (unfiltered) for block dropdown via Server Action
 */
export function useAllWardSummary(options?: Partial<UseQueryOptions<GisWardSummaryItem[]>>) {
  return useQuery({
    queryKey: [...gisQueryKeys.all, 'all-wards'] as const,
    queryFn: async (): Promise<GisWardSummaryItem[]> => {
      const res = await getWardSummaryAction({});
      if (!res.success || !res.data) return [];
      return res.data as GisWardSummaryItem[];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Property Groups (C, R, R-C, I, N) via Server Action
 */
export function usePropertyGroups(options?: Partial<UseQueryOptions<PropertyGroup[]>>) {
  return useQuery({
    queryKey: gisQueryKeys.propertyGroups(),
    queryFn: async () => {
      const res = await getPropertyGroupsAction();
      const data = res.success ? (res.data as unknown as Array<Record<string, unknown>>) : [];
      return (data || []).map((g: Record<string, unknown>) => ({
        id: String(g.value || g.id || ''),
        value: String(g.value || g.id || ''),
        label: String(g.label || g.name || ''),
        labelMarathi: (g.labelMarathi || g.label_marathi) as string | undefined,
        total: 0,
      }));
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    ...options,
  });
}

export function useAllPropertyTypes(options?: Partial<UseQueryOptions<PropertyTypeMasterItem[]>>) {
  return useQuery({
    queryKey: gisQueryKeys.propertyTypes(undefined),
    queryFn: async (): Promise<PropertyTypeMasterItem[]> => {
      const res = await getPropertyTypeMasterListAction();
      if (!res.success || !res.data) return [];
      return res.data as PropertyTypeMasterItem[];
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Property Types by group via Server Action
 */
export function usePropertyTypes(type?: string, filters?: { zoneId?: string; blockId?: string }, options?: Partial<UseQueryOptions<PropertyTypeMasterItem[]>>) {
  return useQuery({
    queryKey: gisQueryKeys.propertyTypes(type, filters),
    queryFn: async (): Promise<PropertyTypeMasterItem[]> => {
      const res = await getPropertyTypeMasterListAction(type, filters);
      if (!res.success || !res.data) return [];
      return res.data as PropertyTypeMasterItem[];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!type,
    ...options,
  });
}

/**
 * Hook to fetch Property Dictionary via Server Action
 */
export function usePropertyDictionary(options?: Partial<UseQueryOptions<Record<string, unknown>>>) {
  return useQuery({
    queryKey: gisQueryKeys.propertyDictionary(),
    queryFn: async () => {
      const res = await getPropertyDictionaryAction();
      if (!res.success || !res.data) return {};
      return res.data as Record<string, unknown>;
    },
    staleTime: 15 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Unified Dashboard Data via Server Action
 */
export function useUnifiedData(params: Record<string, unknown> = {}, options?: Partial<UseQueryOptions<GisUnifiedDashboardData>>) {
  return useQuery({
    queryKey: gisQueryKeys.unifiedData(params),
    queryFn: async (): Promise<GisUnifiedDashboardData> => {
      const res = await getUnifiedDataAction(params);
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to fetch unified data');
      return res.data as GisUnifiedDashboardData;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    ...options,
  });
}
