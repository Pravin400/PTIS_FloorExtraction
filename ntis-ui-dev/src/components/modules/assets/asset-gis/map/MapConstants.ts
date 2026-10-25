/**
 * GIS Map Runtime Configuration & Tile Performance Constants
 */

/**
 * Dynamic request queue network concurrency helper
 */
export const getNetworkConcurrency = (): number => {
    if (typeof navigator === 'undefined') return 10;
    const nav = navigator as unknown as { connection?: { effectiveType?: string } };
    const conn = nav.connection;
    if (!conn) return 10;
    const type: string = conn.effectiveType || '4g';
    if (type === 'slow-2g' || type === '2g') return 3;
    if (type === '3g') return 6;
    return 10; // 4g / wifi
};

export const TILE_RENDER_FRAME_BUDGET_MS = 8;
export const CACHE_DB_NAME = 'TurboTileCacheDB';
export const CACHE_STORE_NAME = 'tiles';
export const CACHE_MAX_KEYS = 150;

/**
 * Resolves current user scope from document cookie to isolate authenticated tile caches per user.
 */
export const getActiveUserCacheScope = (): string => {
    if (typeof document === 'undefined') return 'anon';
    const match = document.cookie.match(/(?:^|;\s*)(?:login_username|user_name)=([^;]+)/);
    return match && match[1] ? decodeURIComponent(match[1]).trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'anon';
};

/**
 * Returns user-scoped IndexedDB database name for authenticated tile caching.
 */
export const getTileCacheDbName = (): string => {
    const scope = getActiveUserCacheScope();
    return `${CACHE_DB_NAME}_${scope}`;
};
export { clearGisTileCache } from '@/lib/utils/asset-gis-utils';

