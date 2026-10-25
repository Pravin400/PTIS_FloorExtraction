import { StateCreator } from 'zustand';
import { getGisLayerMastersAction, getBoundariesAction } from '@/app/[locale]/assets/gismapviewer/actions';
import type { MapSlice } from '@/types/asset-gis.types';

export type { MapSlice };

// Loaded eagerly on mount — these are visible by default, so the user sees them immediately.
const EAGER_LAYER_KEYS = new Set(['1', '2', '5', '6', 'zone', 'ward', 'zone_boundary_layer', 'ward_boundary_layer']);

function isEagerLayer(layer: Record<string, unknown>): boolean {
    const id = String(layer.id || '').trim();
    const key = String(layer.layerKey || '').toLowerCase().trim();
    const name = String(layer.layerName || '').toLowerCase().trim();
    const code = String(layer.layerCode || '').toLowerCase().trim();

    if (EAGER_LAYER_KEYS.has(id) || EAGER_LAYER_KEYS.has(key) || EAGER_LAYER_KEYS.has(code)) return true;
    if (key.includes('zone') || name.includes('zone') || code.includes('zone')) return true;
    if (key.includes('ward') || name.includes('ward') || code.includes('ward')) return true;
    return false;
}

// Loaded lazily, on first toggle — hidden by default, and citysurvey in particular is a large
// (multi-MB) file, so fetching it unconditionally on every page load only slows things down.


export const createMapSlice: StateCreator<MapSlice, [], [], MapSlice> = (...a) => {
    const set = a[0];
    const get = a[1];
    return {
        center: [20.7002, 77.0082],
        zoom: 12.75,
        introVideoStatus: 'idle',
        refreshKey: 0,
        loadingGeoJson: false,
        geoJsonLoaded: false,
        geoJsonError: null,
        geoJsonLayers: {
            zone: null,
            ward: null,
            citysurvey: null,
            nazulsheet: null,
            footprints: null
        },
        polygonReady: false,

        setZoom: (zoom) => set({ zoom }),
        setIntroVideoStatus: (status) => set({ introVideoStatus: status }),
        triggerMapRefresh: () => set((state) => ({ refreshKey: ((state.refreshKey as number) || 0) + 1 })),
        setPolygonReady: (ready) => set({ polygonReady: ready }),

        loadAllGeoJsonLayers: async () => {
            if (get().loadingGeoJson || get().geoJsonLoaded) {
                return;
            }
            set({ loadingGeoJson: true, geoJsonError: null });

            try {
                // 1. Discover all layers from GET /api/GisLayerMaster
                const masterRes = await getGisLayerMastersAction();
                const masterData = (masterRes.success && 'data' in masterRes && masterRes.data) ? masterRes.data : [];
                const layers: Array<Record<string, unknown>> = Array.isArray(masterData)
                    ? (masterData as Array<Record<string, unknown>>)
                    : ((masterData as Record<string, unknown>)?.items as Array<Record<string, unknown>>) || ((masterData as Record<string, unknown>)?.Items as Array<Record<string, unknown>>) || ((masterData as Record<string, unknown>)?.data as Array<Record<string, unknown>>) || [];

                const loadedMap: Record<string, unknown> = {};

                // 2. Concurrently fetch and cache only eager visible boundary GeoJSON layers (e.g. Zone, Ward)
                // Large/hidden layers (e.g. CitySurvey, NazulSheet) are lazy-loaded via ensureGeoJsonLayerLoaded on toggle
                const eagerLayers = layers.filter(isEagerLayer);

                await Promise.allSettled(
                    eagerLayers.map(async (layer) => {
                        const id = layer.id as string | number | undefined;
                        if (!id) return;
                        const key = String(layer.layerKey || layer.layerName || id).toLowerCase();

                        try {
                            const geoRes = await getBoundariesAction(id);
                            if (geoRes.success && 'data' in geoRes && geoRes.data) {
                                let geoData = geoRes.data;
                                if (typeof geoData === 'string') {
                                    try { geoData = JSON.parse(geoData); } catch {}
                                }
                                loadedMap[String(id)] = geoData;
                                if (layer.layerKey) {
                                    loadedMap[String(layer.layerKey)] = geoData;
                                    loadedMap[String(layer.layerKey).toLowerCase()] = geoData;
                                }
                                if (layer.layerCode) {
                                    loadedMap[String(layer.layerCode)] = geoData;
                                    loadedMap[String(layer.layerCode).toLowerCase()] = geoData;
                                }
                                const codeLower = String(layer.layerCode || '').toLowerCase();
                                if (key.includes('zone') || codeLower.includes('zone')) loadedMap['zone'] = geoData;
                                if (key.includes('ward') || codeLower.includes('ward')) loadedMap['ward'] = geoData;
                            }
                        } catch (err) {
                            console.warn(`[MapSlice] Could not load GeoJSON for Layer ID ${id}:`, err);
                        }
                    })
                );

                // Fallback for eager layers if not discovered dynamically
                if (!loadedMap['zone']) {
                    try {
                        const res = await getBoundariesAction(1);
                        if (res.success && 'data' in res && res.data) {
                            let geoData = res.data;
                            if (typeof geoData === 'string') {
                                try { geoData = JSON.parse(geoData); } catch {}
                            }
                            loadedMap['zone'] = geoData;
                            loadedMap['1'] = geoData;
                        }
                    } catch {}
                }

                if (!loadedMap['ward']) {
                    for (const fallbackKey of [6, 5, 2, 'ward', 'WARD_BOUNDARY_LAYER']) {
                        try {
                            const res = await getBoundariesAction(fallbackKey);
                            if (res.success && 'data' in res && res.data) {
                                let geoData = res.data;
                                if (typeof geoData === 'string') {
                                    try { geoData = JSON.parse(geoData); } catch {}
                                }
                                loadedMap['ward'] = geoData;
                                loadedMap[String(fallbackKey)] = geoData;
                                break;
                            }
                        } catch {}
                    }
                }

                set((state) => ({
                    geoJsonLayers: {
                        ...(state.geoJsonLayers || {}),
                        ...loadedMap
                    } as MapSlice['geoJsonLayers'],
                    geoJsonLoaded: true,
                    loadingGeoJson: false
                }));
            } catch (e) {
                console.error('[MapSlice] Error loading master boundary catalog:', e);
                set({ geoJsonError: String(e), loadingGeoJson: false });
            }
        },

        ensureGeoJsonLayerLoaded: async (layerIdOrKey: string | number) => {
            const keyStr = String(layerIdOrKey).toLowerCase().trim();
            if (keyStr === 'footprints') return;
            const currentLayers = get().geoJsonLayers as Record<string, unknown>;
            if (currentLayers[keyStr] != null || currentLayers[String(layerIdOrKey)] != null) return; // already loaded
            const inFlightKey = `_loading_${keyStr}`;
            if ((get() as unknown as Record<string, unknown>)[inFlightKey]) return; // fetch already in flight

            set({ [inFlightKey]: true } as unknown as Partial<MapSlice>);
            try {
                const res = await getBoundariesAction(layerIdOrKey);
                if (res.success && 'data' in res && res.data) {
                    let geoData = res.data;
                    if (typeof geoData === 'string') {
                        try { geoData = JSON.parse(geoData); } catch {}
                    }
                    const numKey = String(layerIdOrKey);
                    const isWard = keyStr.includes('ward') || numKey === '6' || numKey === '5' || numKey === '2';
                    const isZone = keyStr.includes('zone') || numKey === '1';
                    const isSurvey = keyStr.includes('survey') || keyStr.includes('city') || numKey === '3';
                    const isNazul = keyStr.includes('nazul') || keyStr.includes('sheet') || numKey === '4';

                    set((state) => ({
                        geoJsonLayers: { 
                            ...(state.geoJsonLayers || {}), 
                            [keyStr]: geoData,
                            [numKey]: geoData,
                            ...(isWard ? { ward: geoData, WARD_BOUNDARY_LAYER: geoData } : {}),
                            ...(isZone ? { zone: geoData, ZONE_BOUNDARY_LAYER: geoData } : {}),
                            ...(isSurvey ? { citysurvey: geoData, CITY_SURVEY_BOUNDARY_LAYER: geoData } : {}),
                            ...(isNazul ? { nazulsheet: geoData, NAZUL_SHEET_LAYER: geoData } : {})
                        } as MapSlice['geoJsonLayers']
                    }));
                }
            } catch (e) {
                console.error(`[MapSlice] Fetch Error for '${layerIdOrKey}':`, e);
                set({ geoJsonError: `${layerIdOrKey}: ${String(e)}` });
            } finally {
                set({ [inFlightKey]: false } as unknown as Partial<MapSlice>);
            }
        }
    };
};
