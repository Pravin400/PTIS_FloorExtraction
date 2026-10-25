import 'server-only';

/**
 * GIS Map & Boundary Endpoints
 * Standard: Clean Architecture / Next.js Client-Server Compatible
 * Features: Multi-tier Caching (In-Memory + SessionStorage + In-Flight Request Deduplication)
 */

import { apiClient } from '@/services/api.service';
import { buildQueryString } from './helpers';
import { ApiResponse } from '@/types/common.types';
import type { GisLayerMasterDto } from '@/types/asset-gis-asset.types';
import type { GeoJsonObject } from '@/types/asset-gis.types';
import { createLogger } from '@/lib/utils/server-logger';

const logger = createLogger('GisMapService');

// ── In-Memory Caching & In-Flight Request Deduplication ─────────────────────
const boundaryMemoryCache = new Map<string, unknown>();
const pendingBoundaryRequests = new Map<string, Promise<ApiResponse<unknown>>>();
let layerMasterMemoryCache: GisLayerMasterDto[] | null = null;
let pendingLayerMasterRequest: Promise<ApiResponse<GisLayerMasterDto[]>> | null = null;

function utm43NToLatLng(easting: number, northing: number): [number, number] {
  const a = 6378137.0;
  const f = 1.0 / 298.257223563;
  const b = a * (1.0 - f);
  const e = Math.sqrt(1.0 - (b * b) / (a * a));
  const ePrimeSquared = (e * e) / (1.0 - (e * e));
  const k0 = 0.9996;


  const x = easting - 500000.0;
  const y = northing;

  const m = y / k0;
  const mu = m / (a * (1.0 - (e * e) / 4.0 - (3.0 * e * e * e * e) / 64.0 - (5.0 * e * e * e * e * e * e) / 256.0));

  const e1 = (1.0 - Math.sqrt(1.0 - e * e)) / (1.0 + Math.sqrt(1.0 - e * e));
  const j1 = (3.0 * e1 / 2.0 - 27.0 * Math.pow(e1, 3.0) / 32.0);
  const j2 = (21.0 * e1 * e1 / 16.0 - 55.0 * Math.pow(e1, 4.0) / 32.0);
  const j3 = (151.0 * Math.pow(e1, 3.0) / 96.0);
  const j4 = (1097.0 * Math.pow(e1, 4.0) / 512.0);

  const fp = mu + j1 * Math.sin(2.0 * mu) + j2 * Math.sin(4.0 * mu) + j3 * Math.sin(6.0 * mu) + j4 * Math.sin(8.0 * mu);

  const C1 = ePrimeSquared * Math.cos(fp) * Math.cos(fp);
  const T1 = Math.tan(fp) * Math.tan(fp);
  const R1 = a * (1.0 - e * e) / Math.pow(1.0 - e * e * Math.sin(fp) * Math.sin(fp), 1.5);
  const N1 = a / Math.sqrt(1.0 - e * e * Math.sin(fp) * Math.sin(fp));
  const D = x / (N1 * k0);

  const lat = (
    fp -
    (N1 * Math.tan(fp) / R1) *
      (D * D / 2.0 -
        (5.0 + 3.0 * T1 + 10.0 * C1 - 4.0 * C1 * C1 - 9.0 * ePrimeSquared) * Math.pow(D, 4.0) / 24.0 +
        (61.0 + 90.0 * T1 + 298.0 * C1 + 45.0 * T1 * T1 - 252.0 * ePrimeSquared - 3.0 * C1 * C1) * Math.pow(D, 6.0) / 720.0)
  ) * (180.0 / Math.PI);

  const lng = 75.0 + (
    D -
    (1.0 + 2.0 * T1 + C1) * Math.pow(D, 3.0) / 6.0 +
    (5.0 - 2.0 * C1 + 28.0 * T1 - 3.0 * C1 * C1 + 8.0 * ePrimeSquared + 24.0 * T1 * T1) * Math.pow(D, 5.0) / 120.0
  ) / Math.cos(fp) * (180.0 / Math.PI);

  return [lng, lat];
}

function normalizeGeoJsonCoordinates(geoJson: unknown): unknown {
  if (!geoJson || typeof geoJson !== 'object') return geoJson;
  const gObj = geoJson as GeoJsonObject;
  if (!gObj.features || !Array.isArray(gObj.features)) return geoJson;

  const transformCoords = (coords: unknown): unknown => {
    if (!Array.isArray(coords)) return coords;
    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const x = coords[0];
      const y = coords[1];

      // 1. UTM Zone 43N (Easting ~ 600000..900000, Northing ~ 2000000..2500000)
      if (x > 180 || x < -180 || y > 90 || y < -90) {
        if (x > 1000000 && y < 1000000) {
          // Inverted Northing/Easting: [Northing, Easting] -> swap and project
          return utm43NToLatLng(y, x);
        }
        return utm43NToLatLng(x, y);
      }

      // 2. Swapped [Latitude, Longitude] instead of standard GeoJSON [Longitude, Latitude]
      // India Latitude is ~ 8° to 38° N, Longitude is ~ 68° to 98° E (Akola ~ 20.7° Lat, 77.0° Lng)
      if (x >= 8 && x <= 38 && y >= 68 && y <= 98) {
        return [y, x];
      }

      return [x, y];
    }
    return coords.map(transformCoords);
  };

  try {
    for (const feature of gObj.features) {
      if (feature && feature.geometry && feature.geometry.coordinates) {
        feature.geometry.coordinates = transformCoords(feature.geometry.coordinates);
      }
    }
  } catch (err) {
    logger.warn('[gis-map] Coordinate normalization skipped', { operation: 'normalizeGeoJsonCoordinates' }, err);
  }

  return geoJson;
}

export const GisMapService = {
  /**
   * Fetch All Master GIS Layers Definition with Caching & In-flight Deduplication
   * Endpoint: GET /api/GisLayerMaster
   */
  async getLayerMasters(options?: RequestInit & { forceRefresh?: boolean }): Promise<ApiResponse<GisLayerMasterDto[]>> {
    if (!options?.forceRefresh && layerMasterMemoryCache) {
      return { success: true, statusCode: 200, data: layerMasterMemoryCache };
    }

    if (pendingLayerMasterRequest) {
      return pendingLayerMasterRequest;
    }

    const requestPromise = (async () => {
      try {
        const res = await apiClient.get<GisLayerMasterDto[] | { items?: GisLayerMasterDto[]; Items?: GisLayerMasterDto[]; data?: GisLayerMasterDto[] }>('/GisLayerMaster', options);
        if (res.success && res.data) {
          const rawData = res.data;
          const layers: GisLayerMasterDto[] = Array.isArray(rawData)
            ? rawData
            : rawData.items || rawData.Items || rawData.data || [];
          layerMasterMemoryCache = layers;
          return { success: true, statusCode: 200, data: layers };
        }
        return { success: res.success, statusCode: res.statusCode, error: res.error, message: res.error, data: [] };
      } finally {
        pendingLayerMasterRequest = null;
      }
    })();

    pendingLayerMasterRequest = requestPromise;
    return requestPromise;
  },

  /**
   * Fetch GIS Configuration
   */
  async getConfig(options?: RequestInit): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>('/gis/config', options);
  },

  /**
   * Fetch Boundary GeoJSON with In-Memory Caching and Request Deduplication
   * Endpoint: GET /api/GisLayerMaster/{id}/geojson
   */
  async getBoundaries(
    layerKeyOrId: string | number,
    options?: RequestInit & { forceRefresh?: boolean }
  ): Promise<ApiResponse<unknown>> {
    const cacheKey = String(layerKeyOrId).toLowerCase().trim();

    // 1. Check In-Memory Cache
    if (!options?.forceRefresh && boundaryMemoryCache.has(cacheKey)) {
      return { success: true, statusCode: 200, data: boundaryMemoryCache.get(cacheKey) };
    }

    // 2. Deduplicate in-flight requests (Load Balancing)
    if (pendingBoundaryRequests.has(cacheKey)) {
      return pendingBoundaryRequests.get(cacheKey)!;
    }

    const fetchPromise = (async (): Promise<ApiResponse<unknown>> => {
      try {
        let numericId: number | null = null;

        if (!isNaN(Number(layerKeyOrId))) {
          numericId = Number(layerKeyOrId);
        } else {
          // Discover ID from Layer Master catalog
          const masterRes = await GisMapService.getLayerMasters(options);
          const layers = masterRes.data || [];

          const cleanKey = cacheKey.replace(/[^a-z0-9]/g, '');
          const matched = layers.find((l) => {
            const k = String(l.layerKey || l.layerName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return k === cleanKey || k.includes(cleanKey) || cleanKey.includes(k);
          });

          if (matched && matched.id) {
            numericId = matched.id;
          }
        }

        const targetEndpoint = numericId !== null
          ? `/GisLayerMaster/${encodeURIComponent(String(numericId))}/geojson`
          : `/GisLayerMaster/${encodeURIComponent(String(layerKeyOrId))}/geojson`;

        const res = await apiClient.get<unknown>(targetEndpoint, options);
        if (res.success && res.data) {
          const rawData = res.data as { data?: unknown } | string;
          let geoData: unknown = (typeof rawData === 'object' && rawData !== null && 'data' in rawData)
            ? rawData.data
            : res.data;

          if (typeof geoData === 'string') {
            try {
              geoData = JSON.parse(geoData);
            } catch {}
          }

          // Auto-normalize UTM/projected coordinates (e.g. EPSG:32643) to WGS84 LatLng
          geoData = normalizeGeoJsonCoordinates(geoData);
          
          // Cache under requested key and numeric ID
          boundaryMemoryCache.set(cacheKey, geoData);

          if (numericId !== null) {
            const numKey = String(numericId);
            boundaryMemoryCache.set(numKey, geoData);
          }

          return { success: true, statusCode: 200, data: geoData };
        }
        return res;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return { success: false, statusCode: 500, error: errMsg, message: errMsg };
      } finally {
        pendingBoundaryRequests.delete(cacheKey);
      }
    })();

    pendingBoundaryRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  },

  /**
   * Preload and Cache All Boundaries in Parallel for instant dashboard rendering
   */
  async preloadAllBoundaries(): Promise<Record<string, unknown>> {
    try {
      const masterRes = await GisMapService.getLayerMasters();
      const layers = masterRes.data || [];

      const results: Record<string, unknown> = {};

      await Promise.allSettled(
        layers.map(async (layer) => {
          if (!layer.id) return;
          const res = await GisMapService.getBoundaries(layer.id);
          if (res.success && res.data) {
            results[String(layer.id)] = res.data;
            if (layer.layerKey) results[layer.layerKey.toLowerCase()] = res.data;
          }
        })
      );

      return results;
    } catch (err) {
      logger.warn('[GisMapService] Failed to preload all boundaries', { operation: 'preloadAllBoundaries' }, err);
      return {};
    }
  },

  /**
   * Clear Boundary Cache (Memory)
   */
  clearBoundaryCache(layerIdOrKey?: string | number): void {
    if (layerIdOrKey) {
      const k = String(layerIdOrKey).toLowerCase().trim();
      boundaryMemoryCache.delete(k);
    } else {
      boundaryMemoryCache.clear();
      layerMasterMemoryCache = null;
    }
  },


  /**
   * Fetch Property Dictionary
   */
  async getPropertyDictionary(options?: RequestInit): Promise<ApiResponse<Record<string, string>>> {
    return apiClient.get<Record<string, string>>('/GisDashboard/property-dictionary', options);
  },

  /**
   * Get MVT Tile URL pattern
   */
  getTileUrl(): string {
    return '/api/gis-tile/{z}/{x}/{y}.mvt';
  },

  async getHeader(options?: RequestInit): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>('/gis/header', options);
  },

  async getBasemaps(options?: RequestInit): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>('/gis/basemaps', options);
  },

  async getBoundaryLayers(options?: RequestInit): Promise<ApiResponse<unknown>> {
    return apiClient.get<unknown>('/gis/boundary-layers', options);
  },

  async getFilteredPropertiesGeoJson(params: Record<string, unknown>, options?: RequestInit): Promise<ApiResponse<unknown>> {
    const query = buildQueryString(params);
    return apiClient.get<unknown>(`/GisDashboard/properties-geojson${query}`, options);
  },

  async getEnrichedGeoJson(params: Record<string, unknown>, options?: RequestInit): Promise<ApiResponse<unknown>> {
    const query = buildQueryString(params);
    return apiClient.get<unknown>(`/GisDashboard/enriched-geojson${query}`, options);
  },

  async getStatusMapping(params: Record<string, unknown>, options?: RequestInit): Promise<ApiResponse<unknown>> {
    const query = buildQueryString(params);
    return apiClient.get<unknown>(`/GisDashboard/status-mapping${query}`, options);
  },

  /**
   * Upload GeoJSON administrative files
   */
  async uploadGeoJson(formData: FormData, options?: RequestInit): Promise<ApiResponse<unknown>> {
    try {
      const response = await apiClient.fetch('/gis/upload-geojson', {
        ...options,
        method: 'POST',
        headers: {
          'X-Client-Timeout': '600000',
          ...(options?.headers as Record<string, string>),
        },
        body: formData,
      });
      if (!response.ok) {
        return { success: false, statusCode: response.status, error: response.statusText, message: response.statusText };
      }
      const data = await response.json();
      return { success: true, statusCode: response.status, data };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, statusCode: 500, error: errMsg, message: errMsg };
    }
  },

  /**
   * Fetch history log of administrative GeoJSON uploads
   */
  async getUploadHistory(options?: RequestInit): Promise<ApiResponse<unknown[]>> {
    const res = await apiClient.get<unknown[] | { items?: unknown[] }>('/gis/upload-history', options);
    if (res.success && res.data) {
      const raw = res.data;
      if (!Array.isArray(raw) && typeof raw === 'object' && raw !== null && 'items' in raw) {
        return { success: true, statusCode: res.statusCode, data: (raw as { items?: unknown[] }).items ?? [] };
      }
    }
    return res as ApiResponse<unknown[]>;
  },
};

export const gisMapService = GisMapService;
