/**
 * Asset GIS Utility Functions
 *
 * GIS-specific utility helpers extracted to keep shared utilities clean.
 * These functions are used exclusively by the Asset GIS module.
 */

import { getAppConfig } from '@/config/app.config';

/**
 * Normalizes an identifier string to an uppercase alphanumeric-only string.
 */
export const normalizeId = (val: unknown): string => {
  const str = String(val || '').toUpperCase().trim();
  return str.replace(/[^A-Z0-9]/gi, '');
};

/**
 * Builds standard URL search params string from key-value map.
 */
export const buildQueryString = (params: Record<string, unknown>): string => {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlParams.append(key, String(value));
    }
  });
  const query = urlParams.toString();
  return query ? `?${query}` : '';
};

/**
 * Resolves base API URL safely across client and server environments.
 */
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') return '/api';
  return getAppConfig().api.baseUrl;
};

/**
 * Normalizes an owner/property ID from various API response shapes.
 * Handles nested objects, numeric truncation, and placeholder values.
 */
export const normalizeOwnerId = (val: unknown): string => {
  if (val === null || val === undefined || val === '') return '';

  if (typeof val === 'object' && val !== null) {
    const record = val as Record<string, unknown>;
    const id =
      record.OwnerID ??
      record.ownerid ??
      record.owner_id ??
      record.Buil_ID ??
      record.OBJECTID ??
      record.PropertyId ??
      '';
    return normalizeOwnerId(id);
  }

  const raw = String(val).trim();
  if (!raw || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined') return '';

  const parsed = parseFloat(raw);
  if (!isNaN(parsed) && isFinite(parsed)) {
    return String(Math.trunc(parsed));
  }

  return raw;
};

export const GIS_ROUTES = {
  ASSET_REGISTER: '/assets/municipal-Asset/asset-register',
} as const;

export const CACHE_DB_NAME = 'TurboTileCacheDB';

export const clearGisTileCache = async (): Promise<void> => {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  try {
    const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)(?:login_username|user_name)=([^;]+)/) : null;
    const scope = match && match[1] ? decodeURIComponent(match[1]).trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'anon';
    window.indexedDB.deleteDatabase(CACHE_DB_NAME);
    window.indexedDB.deleteDatabase(`${CACHE_DB_NAME}_${scope}`);
    window.indexedDB.deleteDatabase(`${CACHE_DB_NAME}_anon`);

    if (typeof window.indexedDB.databases === 'function') {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name && db.name.startsWith(CACHE_DB_NAME)) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
    }
  } catch {
    // Ignore tile cache clearing errors in headless/unsupported environments
  }
};
