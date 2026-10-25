'use client';

import type { GisSearchParams, GisFilters } from '@/types/asset-gis.types';
export type { GisSearchParams, GisFilters };

// Centralized query keys for cache management
export const gisQueryKeys = {
  all: ['gis'] as const,

  // Dashboard
  dashboardInit: (params?: GisSearchParams) => [...gisQueryKeys.all, 'dashboard', 'init', params] as const,
  kpiSummary: (params?: GisSearchParams) => [...gisQueryKeys.all, 'dashboard', 'kpi', params] as const,
  wardSummary: (params?: GisSearchParams) => [...gisQueryKeys.all, 'dashboard', 'ward', params] as const,
  unifiedData: (params?: Record<string, unknown>) => [...gisQueryKeys.all, 'dashboard', 'unified', params] as const,
  propertyGroups: () => [...gisQueryKeys.all, 'dashboard', 'property-groups'] as const,
  propertyTypes: (type?: string, filters?: { zoneId?: string; blockId?: string }) => [...gisQueryKeys.all, 'dashboard', 'property-types', type, filters] as const,
  propertyDictionary: () => [...gisQueryKeys.all, 'dashboard', 'property-dictionary'] as const,

  // Config
  config: () => [...gisQueryKeys.all, 'config'] as const,
  header: () => [...gisQueryKeys.all, 'header'] as const,
  basemaps: () => [...gisQueryKeys.all, 'basemaps'] as const,
  boundaryLayers: () => [...gisQueryKeys.all, 'boundary-layers'] as const,
  boundaries: (type: string) => [...gisQueryKeys.all, 'boundaries', type] as const,

  // Property Detail
  propertyDetail: (ownerId: string | number) => [...gisQueryKeys.all, 'property', 'detail', ownerId] as const,

  // Map
  propertiesGeoJson: (params?: Record<string, unknown>) => [...gisQueryKeys.all, 'map', 'geojson', params] as const,
  enrichedGeoJson: (params?: Record<string, unknown>) => [...gisQueryKeys.all, 'map', 'enriched', params] as const,
  statusMapping: (params?: Record<string, unknown>) => [...gisQueryKeys.all, 'map', 'status-mapping', params] as const,
} as const;
