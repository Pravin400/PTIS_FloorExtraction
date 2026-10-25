'use server';

/**
 * Server Actions for Grievance GIS.
 * Exposes server-side fetch logic to client components securely.
 * Standard: Clean Architecture / ntis-ui
 */

import { grievanceGisServerService } from '@/lib/api/grievance/gis/grievance-gis.service';
import type { ApiResponse } from '@/types/common.types';
import type {
  GisGrievanceKpiSummaryResponseDto,
  GisGrievanceFilterGroupDto,
  GisGrievancePopupDetailsDto,
  GisGrievanceQueryParameters,
  GisCorporationConfigDto,
  GisLayerItemDto,
} from '@/types/grievance/grievance-gis.types';
import { createLogger } from '@/lib/utils/server-logger';
import {
  findWardAndZoneFromCoordsSync,
  type ResolvedWardZone,
} from '@/lib/utils/grievance/gis/gis-point-in-polygon';

export type { ResolvedWardZone };

const logger = createLogger('grievance-gis-actions');

function unwrapPayload<T>(res: ApiResponse<unknown>): ApiResponse<T> {
  if (!res.success) return res as ApiResponse<T>;
  const raw = res.data;
  const items =
    raw && typeof raw === 'object' && 'items' in raw && (raw as { items: unknown }).items !== undefined && (raw as { items: unknown }).items !== null
      ? (raw as { items: unknown }).items
      : raw;
  return {
    ...res,
    data: items as T,
  };
}

export async function fetchGrievanceGisKpisAction(
  filters?: GisGrievanceQueryParameters
): Promise<ApiResponse<GisGrievanceKpiSummaryResponseDto>> {
  try {
    const res = await grievanceGisServerService.getKpis(filters);
    return unwrapPayload<GisGrievanceKpiSummaryResponseDto>(res);
  } catch (error) {
    logger.error('Failed to fetch Grievance GIS KPIs from backend', { error: (error as Error).message });
    return {
      success: false,
      message: (error as Error).message || 'Failed to load KPI summary',
    };
  }
}

export async function fetchGrievanceGisFiltersAction(
  zoneId?: number,
  departmentId?: number
): Promise<ApiResponse<GisGrievanceFilterGroupDto[]>> {
  try {
    const res = await grievanceGisServerService.getFilters(zoneId, departmentId);
    return unwrapPayload<GisGrievanceFilterGroupDto[]>(res);
  } catch (error) {
    logger.error('Failed to fetch Grievance GIS filters from backend', { error: (error as Error).message });
    return {
      success: false,
      message: (error as Error).message || 'Failed to load filter groups',
    };
  }
}

export async function fetchGrievanceGisPopupDetailsAction(
  grievanceId: number
): Promise<ApiResponse<GisGrievancePopupDetailsDto>> {
  try {
    const res = await grievanceGisServerService.getPopupDetails(grievanceId);
    return unwrapPayload<GisGrievancePopupDetailsDto>(res);
  } catch (error) {
    logger.error('Failed to fetch grievance GIS popup details from backend', { grievanceId, error: (error as Error).message });
    return {
      success: false,
      message: (error as Error).message || 'Failed to load grievance details',
    };
  }
}

export async function identifyGrievanceAtPointAction(
  lat: number,
  lng: number,
  toleranceMeters: number = 50.0
): Promise<ApiResponse<unknown>> {
  try {
    const res = await grievanceGisServerService.identifyAtPoint(lat, lng, toleranceMeters);
    return unwrapPayload<unknown>(res);
  } catch (error) {
    logger.error('Failed to identify grievance at point via backend', { lat, lng, error: (error as Error).message });
    return {
      success: false,
      message: (error as Error).message || 'Failed to identify grievance',
    };
  }
}

/**
 * Fetches corporation map viewport configuration from backend API
 */
export async function fetchGrievanceGisConfigAction(): Promise<ApiResponse<GisCorporationConfigDto | null>> {
  try {
    const res = await grievanceGisServerService.getCorporationConfig();
    const unwrapped = unwrapPayload<GisCorporationConfigDto | GisCorporationConfigDto[]>(res);
    const item = Array.isArray(unwrapped.data) ? unwrapped.data[0] : unwrapped.data;
    return {
      ...unwrapped,
      data: item || null,
    };
  } catch (error) {
    logger.error('Failed to fetch GIS corporation config from backend', { error: (error as Error).message });
    return {
      success: false,
      message: (error as Error).message || 'Failed to load corporation config',
    };
  }
}

/**
 * Fetches active GIS boundary layers from backend API
 */
export async function fetchGrievanceGisLayersAction(departmentId?: number): Promise<ApiResponse<GisLayerItemDto[]>> {
  try {
    const res = await grievanceGisServerService.getLayers(departmentId);
    const unwrapped = unwrapPayload<GisLayerItemDto[]>(res);
    const list: GisLayerItemDto[] = Array.isArray(unwrapped.data) ? unwrapped.data : [];

    const layersWithGeoJson = await Promise.all(
      list.map(async (l) => {
        try {
          const geoJson = await grievanceGisServerService.getLayerGeoJson(l.id);
          return { ...l, geoJsonData: geoJson };
        } catch {
          return l;
        }
      })
    );

    return {
      ...unwrapped,
      data: layersWithGeoJson,
    };
  } catch (error) {
    logger.error('Failed to fetch GIS layers from backend', { error: (error as Error).message });
    return {
      success: false,
      message: (error as Error).message || 'Failed to load GIS layers',
    };
  }
}

/**
 * Fetches GeoJSON data for Ward Boundary Layer (Layer 4) from backend API
 */
export async function fetchWardLayerGeoJsonAction(): Promise<ApiResponse<GeoJSON.FeatureCollection>> {
  try {
    const geoJsonStr = await grievanceGisServerService.getLayerGeoJson(4);
    const parsed = (typeof geoJsonStr === 'string' ? JSON.parse(geoJsonStr) : geoJsonStr) as GeoJSON.FeatureCollection;
    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    logger.error('Failed to fetch Ward GeoJSON layer from backend', { error: (error as Error).message });
    return {
      success: false,
      message: (error as Error).message || 'Failed to load Ward GeoJSON',
    };
  }
}

let serverCachedWardGeoJson: GeoJSON.FeatureCollection | null = null;
let serverCachedFilterGroups: GisGrievanceFilterGroupDto[] = [];

/**
 * Server Action: Resolves GPS coordinates (Lat, Lng) to Municipal Ward & Zone
 * Executes Point-In-Polygon against Layer 4 GeoJSON purely on the server.
 */
export async function resolveSpatialWardZoneAction(
  lat: number,
  lng: number
): Promise<ApiResponse<ResolvedWardZone | null>> {
  try {
    if (!serverCachedWardGeoJson) {
      const geoJsonStr = await grievanceGisServerService.getLayerGeoJson(4);
      serverCachedWardGeoJson = typeof geoJsonStr === 'string' ? JSON.parse(geoJsonStr) : geoJsonStr;
    }
    if (serverCachedFilterGroups.length === 0) {
      const filterRes = await grievanceGisServerService.getFilters();
      const unwrapped = unwrapPayload<GisGrievanceFilterGroupDto[]>(filterRes);
      if (unwrapped.success && Array.isArray(unwrapped.data)) {
        serverCachedFilterGroups = unwrapped.data;
      }
    }
    const result = findWardAndZoneFromCoordsSync(lat, lng, serverCachedWardGeoJson, serverCachedFilterGroups);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error('Spatial PIP resolution failed on server', { lat, lng, error: (error as Error).message });
    return {
      success: false,
      message: (error as Error).message || 'Failed to resolve ward/zone',
    };
  }
}
