'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { gisQueryKeys } from './query-keys';
import {
  getPropertyDetailAction,
  searchPropertiesAction,
  getTopDefaultersAction,
  exportExcelAction,
} from '@/app/[locale]/assets/gismapviewer/actions';

/**
 * Hook to fetch Property Detail via Server Action
 */
export function usePropertyDetail(ownerId: string | number | null, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: gisQueryKeys.propertyDetail(ownerId || ''),
    queryFn: async () => {
      const res = await getPropertyDetailAction(String(ownerId!));
      if (!res.success || !('data' in res) || !res.data) {
        const errorMsg = ('error' in res ? res.error : undefined) || ('message' in res ? (res as { message?: string }).message : undefined) || 'Failed to fetch property detail';
        throw new Error(errorMsg);
      }
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!ownerId,
    ...options,
  });
}

/**
 * Hook for prefetching property detail on hover via Server Action
 */
export function usePrefetchPropertyDetail() {
  const queryClient = useQueryClient();

  return (ownerId: string | number) => {
    queryClient.prefetchQuery({
      queryKey: gisQueryKeys.propertyDetail(ownerId),
      queryFn: async () => {
        const res = await getPropertyDetailAction(String(ownerId));
        if (!res.success || !('data' in res) || !res.data) {
          const errorMsg = ('error' in res ? res.error : undefined) || ('message' in res ? (res as { message?: string }).message : undefined) || 'Failed to prefetch property detail';
          throw new Error(errorMsg);
        }
        return res.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Hook for property search via Server Action
 */
export function usePropertySearch(query: string, type: string = 'all', options?: Partial<UseQueryOptions<unknown[]>>) {
  return useQuery({
    queryKey: [...gisQueryKeys.all, 'search', query, type] as const,
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await searchPropertiesAction(query, type);
      if (!res.success || !res.data) return [];
      return res.data;
    },
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook for top defaulters via Server Action
 */
export function useTopDefaulters(options?: Partial<UseQueryOptions<unknown[]>>) {
  return useQuery({
    queryKey: [...gisQueryKeys.all, 'top-defaulters'] as const,
    queryFn: async () => {
      const res = await getTopDefaultersAction();
      if (!res.success || !res.data) return [];
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook for exporting Excel via Server Action
 */
export function useExportExcel() {
  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const res = await exportExcelAction(params);
      if (!res.success || !res.data) throw new Error(res.error || 'Export failed');
      
      // Convert base64 back to blob on client side
      const byteCharacters = atob(res.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
  });
}

