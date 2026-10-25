'use client';

import { useMemo } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { gisQueryKeys } from './query-keys';
import {
  getConfigAction,
  getHeaderAction,
  getBasemapsAction,
  getBoundaryLayersAction,
  getBoundariesAction,
  getFilteredPropertiesGeoJsonAction,
  getEnrichedGeoJsonAction,
  getStatusMappingAction
} from '@/app/[locale]/assets/gismapviewer/actions';

/**
 * Hook to fetch GIS Config via Server Action
 */
export function useGisConfig(options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: gisQueryKeys.config(),
    queryFn: async () => {
      const res = await getConfigAction();
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to fetch GIS config');
      return res.data;
    },
    staleTime: 60 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Header Config via Server Action
 */
export function useGisHeader(options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: gisQueryKeys.header(),
    queryFn: async () => {
      const res = await getHeaderAction();
      if (!res.success || !res.data) return null;
      return res.data;
    },
    staleTime: 60 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Basemaps via Server Action
 */
export function useBasemaps(options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: gisQueryKeys.basemaps(),
    queryFn: async () => {
      const res = await getBasemapsAction();
      if (!res.success || !res.data) return [];
      return res.data;
    },
    staleTime: 60 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Boundary Layers config via Server Action
 */
export function useBoundaryLayers(options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: gisQueryKeys.boundaryLayers(),
    queryFn: async () => {
      const res = await getBoundaryLayersAction();
      if (!res.success || !res.data) return [];
      return res.data;
    },
    staleTime: 60 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Boundaries GeoJSON by type via Server Action
 */
export function useBoundaries(type: string, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: gisQueryKeys.boundaries(type),
    queryFn: async () => {
      const res = await getBoundariesAction(type);
      if (!res.success || !('data' in res) || !res.data) {
        const errorMsg = ('error' in res ? res.error : undefined) || ('message' in res ? (res as { message?: string }).message : undefined) || 'Failed to fetch boundaries';
        throw new Error(errorMsg);
      }
      return res.data;
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    enabled: !!type,
    ...options,
  });
}

/**
 * Hook to fetch Properties GeoJSON (View-Aware) via Server Action
 */
export function usePropertiesGeoJson(params: Record<string, unknown> = {}, options?: Partial<UseQueryOptions>) {
  const mapBBox = useCouncilBoundaryStore(state => state.mapBBox);

  const combinedParams = useMemo(() => ({
    ...params,
    bbox: mapBBox ? mapBBox.join(',') : undefined
  }), [params, mapBBox]);

  return useQuery({
    queryKey: gisQueryKeys.propertiesGeoJson(combinedParams),
    queryFn: async () => {
      const res = await getFilteredPropertiesGeoJsonAction(combinedParams);
      if (!res.success || !res.data) return { type: 'FeatureCollection', features: [] };
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Enriched GeoJSON (View-Aware) via Server Action
 */
export function useEnrichedGeoJson(params: Record<string, unknown> = {}, options?: Partial<UseQueryOptions>) {
  const mapBBox = useCouncilBoundaryStore(state => state.mapBBox);
  const performanceMode = useCouncilBoundaryStore(state => state.performanceMode);

  const combinedParams = useMemo(() => ({
    ...params,
    bbox: (performanceMode && mapBBox) ? mapBBox.join(',') : undefined
  }), [params, mapBBox, performanceMode]);

  return useQuery({
    queryKey: gisQueryKeys.enrichedGeoJson(combinedParams),
    queryFn: async () => {
      const res = await getEnrichedGeoJsonAction(combinedParams);
      if (!res.success || !res.data) return { type: 'FeatureCollection', features: [] };
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch Status Mapping via Server Action
 */
export function useStatusMapping(params: Record<string, unknown> = {}, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: gisQueryKeys.statusMapping(params),
    queryFn: async () => {
      const res = await getStatusMappingAction(params);
      if (!res.success || !res.data) return {};
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}
