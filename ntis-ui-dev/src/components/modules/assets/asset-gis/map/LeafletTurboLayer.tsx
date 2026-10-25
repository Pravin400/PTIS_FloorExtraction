import L from 'leaflet';
import { normalizeId, normalizeOwnerId } from '@/lib/utils/asset-gis-utils';
import { logger } from '@/lib/utils/logger';
import type { GeoJsonGeometry, TurboFeature, TurboTileLayerOptions } from '@/types/asset-gis.types';
import {
    globalTileRenderQueue,
    globalGisRequestQueue,
    getDeviceCapabilities,
    fetchWithRetry,
} from './turboQueues';
import { globalGisTileCache, clearGisTileCache } from './turboTileCache';
import {
    renderGeometry,
    containsPoint,
    drawAssetBeaconPins,
    drawTileLabels,
    getFeatureLatLngCentroid,
} from './turboGeometryUtils';

export type { GeoJsonGeometry, TurboFeature, TurboTileLayerOptions };
export { globalGisTileCache, clearGisTileCache };

export const TurboTileLayer = L.GridLayer.extend({
    options: {
        baseUrl: '',
        filterConfig: {},
        getFeatureStyle: (_feature: TurboFeature) => ({}),
        onFeatureClick: (_feature: TurboFeature) => { },
        tileSize: 256,
        minZoom: 15,
        maxZoom: 24,
        maxNativeZoom: 24,
        keepBuffer: 2,
        updateWhenZooming: false,
        updateWhenIdle: true,
    },

    initialize: function (options: TurboTileLayerOptions) {
        const caps = getDeviceCapabilities();
        if (caps.isLowEnd) {
            options = {
                ...options,
                keepBuffer: Math.min(options?.keepBuffer ?? 2, 1)
            };
            logger.info('[TurboTileLayer] Low-end hardware detected. keepBuffer optimized to 1.');
        }
        (L.GridLayer.prototype as unknown as { initialize: (options?: unknown) => void }).initialize.call(this, options);
        this._tileData = new Map<string, TurboFeature[]>();
    },

    onAdd: function (map: L.Map) {
        (L.GridLayer.prototype as unknown as { onAdd: (map: L.Map) => void }).onAdd.call(this, map);
    },

    onRemove: function (map: L.Map) {
        globalTileRenderQueue.clear();
        this._tileData.clear();
        (L.GridLayer.prototype as unknown as { onRemove: (map: L.Map) => void }).onRemove.call(this, map);
    },

    _removeTile: function (key: string) {
        this._tileData.delete(key);
        (L.GridLayer.prototype as unknown as { _removeTile: (key: string) => void })._removeTile.call(this, key);
    },

    getFeatureAt: function (latlng: L.LatLng) {
        if (!this._map) return null;
        const tileSize = this.getTileSize();

        for (const [, features] of this._tileData.entries()) {
            const coords = (features[0] as TurboFeature & { _nativeCoords?: L.Coords })?._nativeCoords;
            if (!coords) continue;
            for (const feature of features) {
                if (feature.geometry && containsPoint(feature.geometry, latlng, coords, tileSize)) {
                    const style = this.options.getFeatureStyle(feature, 'footprints');
                    if (!style || (style.fill === false && style.stroke === false)) {
                        continue;
                    }
                    return feature;
                }
            }
        }
        return null;
    },

    createTile: function (coords: L.Coords, done: L.DoneCallback) {
        const tile = document.createElement('canvas');
        const size = this.getTileSize();
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        tile.width = size.x * dpr;
        tile.height = size.y * dpr;
        tile.style.width = size.x + 'px';
        tile.style.height = size.y + 'px';

        const tileKey = `${coords.z}:${coords.x}:${coords.y}`;
        const ctx = tile.getContext('2d');
        if (!ctx) { done(undefined, tile); return tile; }
        ctx.scale(dpr, dpr);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        this._tileData.delete(tileKey);
        if (coords.z < 0) { setTimeout(() => done(undefined, tile), 0); return tile; }

        let fetchZ = Math.round(coords.z);
        let fetchX = Math.round(coords.x);
        let fetchY = Math.round(coords.y);

        if (fetchZ > 19) {
            const diff = fetchZ - 19;
            fetchZ = 19;
            fetchX = Math.floor(fetchX / Math.pow(2, diff));
            fetchY = Math.floor(fetchY / Math.pow(2, diff));
        }

        const url = (this.options.baseUrl || '')
            .replace('{z}', String(fetchZ))
            .replace('{x}', String(fetchX))
            .replace('{y}', String(fetchY));
        const fullUrl = url;
        const queryClient = this.options.queryClient;

        const fetchTile = async () => {
            if (this._tileDataCache?.[fullUrl]) {
                return this._tileDataCache[fullUrl];
            }

            const cached = await globalGisTileCache.get(fullUrl);
            if (cached) {
                if (!this._tileDataCache) this._tileDataCache = {};
                this._tileDataCache[fullUrl] = cached;
                return cached;
            }

            const executeQuery = async (sig?: AbortSignal) => {
                const data = await fetchWithRetry(fullUrl, sig);
                if (data) {
                    if (!this._tileDataCache) this._tileDataCache = {};
                    this._tileDataCache[fullUrl] = data;
                    globalGisTileCache.set(fullUrl, data);
                }
                return data;
            };

            if (queryClient) {
                return queryClient.fetchQuery({
                    queryKey: ['gis-tile', fullUrl],
                    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
                        return globalGisRequestQueue.run((sig) => executeQuery(sig), signal);
                    },
                    staleTime: 30000
                });
            }

            return globalGisRequestQueue.run((sig) => executeQuery(sig));
        };

        fetchTile().then((rawData: unknown) => {
            const data = rawData as { features?: TurboFeature[] } | null;
            const internalKey = this._tileCoordsToKey ? this._tileCoordsToKey(coords) : `${coords.x}:${coords.y}:${coords.z}`;
            if (!this._map || !this._tiles || !this._tiles[internalKey]) {
                return;
            }

            if (!data?.features?.length) { done(undefined, tile); return; }

            globalTileRenderQueue.add(() => {
                const activeKey = this._tileCoordsToKey ? this._tileCoordsToKey(coords) : `${coords.x}:${coords.y}:${coords.z}`;
                if (!this._map || !this._tiles || !this._tiles[activeKey]) {
                    done(undefined, tile);
                    return;
                }

                const rawFeatures = (data?.features || []) as TurboFeature[];
                const mappedFeatures = rawFeatures.map((f: TurboFeature) => {
                    if (!f.properties) f.properties = {};
                    const props = f.properties;
                    const rawOwnerId = props.OwnerID || props.ownerid || '';
                    const rawId = (!rawOwnerId || rawOwnerId === '0' || rawOwnerId === 'null')
                        ? (props.Buil_ID || props.buil_id || props._id || '')
                        : rawOwnerId;
                    f.properties._normalizedOwnerId = normalizeOwnerId(rawId);

                    const rawZoneRaw = props.NewZoneNo || props.newZoneNo || props.Zone || props.zone || props.ZoneName || props.zoneName || '';
                    f.properties._normalizedZone = normalizeId(rawZoneRaw);

                    const rawWardRaw = props.WARD_NO || props.ward_no || props.WardNo || props.wardNo || props.NewWardNo || props.newWardNo || props.Ward || props.ward || props.BlockNo || props.Short_ID || props.Ward_No || props.WardName || props.MPMS_ID || props.mpms_id || props.mpmsId || '';
                    let normWard = normalizeId(rawWardRaw);

                    if (normWard && /^\d+$/.test(normWard) && rawZoneRaw) {
                        const zCode = f.properties._normalizedZone;
                        normWard = normalizeId(zCode + normWard);
                    }
                    f.properties._normalizedWard = normWard;
                    f._centroid = getFeatureLatLngCentroid(f.geometry);

                    return f;
                });
                data.features = mappedFeatures;

                this._tileData.set(tileKey, mappedFeatures.map((f: TurboFeature) => ({ ...f, _nativeCoords: { x: coords.x, y: coords.y, z: coords.z } })));

                const groups = new Map<string, { style: L.PathOptions; features: TurboFeature[] }>();
                for (const f of mappedFeatures) {
                    const style = this.options.getFeatureStyle(f, 'footprints');
                    if (!style || (style.fill === false && style.stroke === false)) continue;
                    const key = `${style.fillColor || '#22C55E'}_${style.fillOpacity ?? 0.85}`;
                    if (!groups.has(key)) groups.set(key, { style, features: [] });
                    groups.get(key)!.features.push(f);
                }

                for (const g of groups.values()) {
                    ctx.fillStyle = g.style.fillColor || '#22C55E';
                    ctx.globalAlpha = g.style.fillOpacity ?? 0.85;

                    ctx.beginPath();
                    for (const f of g.features) {
                        renderGeometry(ctx, f.geometry, coords, size);
                    }
                    ctx.fill();

                    if (g.style.stroke !== false && (g.style.weight ?? 0.5) > 0) {
                        ctx.strokeStyle = g.style.color || '#ffffff';
                        ctx.lineWidth = g.style.weight || 0.5;
                        ctx.globalAlpha = g.style.opacity ?? 1;

                        ctx.beginPath();
                        for (const f of g.features) {
                            renderGeometry(ctx, f.geometry, coords, size);
                        }
                        ctx.stroke();
                    }
                }

                const isAssetDept = (this.options.baseUrl || '').toLowerCase().includes('asset') ||
                                    (this.options.baseUrl || '').includes('GisAssetTile') ||
                                    this.options.activeModule === 'ASSET';

                const filterConfig = this.options.filterConfig || {};
                const activeTypeId = String(filterConfig.selectedPropertyTypeId || filterConfig.PropertyTypeID || filterConfig.AssetTypeId || '').trim();
                const hasTypeFilter = Boolean(activeTypeId && activeTypeId !== 'all' && activeTypeId !== 'null' && activeTypeId !== '');

                if (isAssetDept && hasTypeFilter) {
                    drawAssetBeaconPins(ctx, data.features, coords, size, activeTypeId, this.options.getFeatureStyle);
                }

                const labelMinZoom = isAssetDept ? (hasTypeFilter ? 13 : 17) : 18;
                if (coords.z >= labelMinZoom) {
                    drawTileLabels(ctx, data.features, coords, size, isAssetDept, this.options.getFeatureStyle);
                }

                ctx.globalAlpha = 1;
                done(undefined, tile);
            });
        }).catch((err: unknown) => {
            const internalKey = this._tileCoordsToKey ? this._tileCoordsToKey(coords) : `${coords.x}:${coords.y}:${coords.z}`;
            if (!this._map || !this._tiles || !this._tiles[internalKey]) {
                return;
            }
            const errObj = err as Error | undefined;
            const isAbort = errObj?.name === 'AbortError' || errObj?.message?.includes('aborted') || errObj?.message?.includes('AbortError');
            if (!isAbort) {
                logger.error('[TurboTileLayer] Fetch error:', { error: err as Error });
                done(errObj || new Error('Tile fetch failed'), tile);
            } else {
                done(undefined, tile);
            }
        });
        return tile;
    },

    forceRefresh: function () {
        this._tileData.clear();
        this._tileDataCache = {};
        if (this._tiles) {
            for (const key in this._tiles) {
                if (Object.prototype.hasOwnProperty.call(this._tiles, key)) {
                    const tile = this._tiles[key];
                    if (tile && tile.el) {
                        this._removeTile(key);
                    }
                }
            }
        }
        this.redraw();
    }
});
