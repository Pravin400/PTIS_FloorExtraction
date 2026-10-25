/**
 * Map Popup and Highlight Coordinator
 * Standard: Clean Architecture / Leaflet-React Bridge
 *
 * GEOMETRY-FIRST NAVIGATION:
 * This coordinator always fetches the real polygon geometry from the tile server FIRST,
 * then uses map.fitBounds() to zoom to the actual physical building boundary.
 * This avoids the "Surveyor Home Location Mismatch" bug where DB lat/lng is inaccurate
 * because surveyors submitted data from home after field collection.
 *
 * Navigation priority:
 *   1. Tile polygon bounds (from /GisTile/geometry?id=ownerId) — always preferred
 *   2. Inline geometry already attached to selected property — second choice
 *   3. DB lat/lng fallback — only used if no tile geometry exists for this property
 */

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { GeoJsonObject, Feature } from 'geojson';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { logger } from '@/lib/utils/logger';
import {
    getAssetGeometryDetailsAction,
    getGeometryAction,
} from '@/app/[locale]/assets/gismapviewer/actions';
import type { MapPopupCoordinatorProps } from '@/types/asset-gis.types';

export type { MapPopupCoordinatorProps };

// Shared highlight style for all polygon renders with smooth breathing animation
const HIGHLIGHT_STYLE = {
    fill: true,
    fillColor: '#3b82f6',
    fillOpacity: 0.55,
    color: '#1d4ed8',       // Royal blue border
    weight: 4,              // Thick outline so the polygon is clearly visible
    className: 'breathing-polygon-highlight',
} as L.PathOptions;

/** Helper to check if Leaflet map instance is fully mounted and ready for DOM operations */
const isMapValid = (m: L.Map | null | undefined): m is L.Map => {
    if (!m) return false;
    try {
        const internalMap = m as unknown as { _container?: HTMLElement; _loaded?: boolean; _mapPane?: HTMLElement };
        const container = typeof m.getContainer === 'function' ? m.getContainer() : internalMap._container;
        return Boolean(container && internalMap._loaded && internalMap._mapPane);
    } catch {
        return false;
    }
};

export const MapPopupCoordinator = ({ mapRef, highlightLayerRef }: MapPopupCoordinatorProps) => {
    const selectedProperty = useCouncilBoundaryStore(s => s.selectedProperty) as Record<string, unknown> | null;
    const propertyDetail = useCouncilBoundaryStore(s => s.propertyDetail) as Record<string, unknown> | null;
    const activeModule = useCouncilBoundaryStore(s => s.activeModule);
    const setPolygonReady = useCouncilBoundaryStore(s => s.setPolygonReady);
    const popupRef = useRef<L.Popup | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        const highlightLayer = highlightLayerRef?.current;
        let active = true;

        // ── 0. CHILD ASSET SWITCH: Keep panel statically in place without re-animating ──
        if (selectedProperty?.isChildSwitch) {
            setPolygonReady(true);
            return;
        }

        // A new property was selected (or none) — the previous polygon, if any, no longer
        // matches, so the details panel (gated on polygonReady) must wait again until this
        // one is drawn/positioned before it reappears.
        setPolygonReady(false);

        // ── 1. DESELECT: Clear highlight & popup when nothing is selected ──────────
        if (!selectedProperty) {
            if (popupRef.current) {
                if (isMapValid(map)) {
                    try {
                        map.closePopup(popupRef.current);
                    } catch (e) {
                        logger.warn('[PopupCoordinator] closePopup failed:', { error: e as Error });
                    }
                }
                popupRef.current = null;
            }
            if (highlightLayer) {
                highlightLayer.clearLayers();
            }
            return;
        }

        // ── 2. Gather IDs from the selected property ──────────────────────────────
        const ownerId: string = String(
            selectedProperty.ownerID ||
            selectedProperty.OwnerID ||
            selectedProperty.ownerId ||
            propertyDetail?.OwnerID ||
            propertyDetail?.ownerID ||
            propertyDetail?.ownerId ||
            ''
        );

        const builId: string = String(
            selectedProperty.Buil_ID ||
            selectedProperty.Buil_Id ||
            selectedProperty.builId ||
            selectedProperty.buil_id ||
            selectedProperty.BuildingID ||
            selectedProperty.buildingID ||
            propertyDetail?.Buil_ID ||
            propertyDetail?.Buil_Id ||
            ''
        );

        // Inline geometry already attached to the feature (e.g. clicked directly on tile)
        const inlineGeometry =
            selectedProperty.geometry ||
            selectedProperty.Geometry ||
            propertyDetail?.geometry ||
            propertyDetail?.Geometry;

        // ── 3. Fallback DB coordinates (only used if tile geometry is not found) ──
        //    Named "Fallback" to make it clear these are the last resort.
        //    They can be inaccurate for properties where surveyors submitted data from home.
        const fallbackLat = Number(
            selectedProperty.fallbackLatitude || selectedProperty.FallbackLatitude ||
            selectedProperty.latitude || selectedProperty.Latitude || selectedProperty.lat ||
            selectedProperty.centroidY || selectedProperty.CentroidY ||
            propertyDetail?.centroidY || propertyDetail?.CentroidY ||
            propertyDetail?.ASS_Latitude || propertyDetail?.assLatitude ||
            propertyDetail?.latitude || propertyDetail?.Latitude || 0
        );
        const fallbackLng = Number(
            selectedProperty.fallbackLongitude || selectedProperty.FallbackLongitude ||
            selectedProperty.longitude || selectedProperty.Longitude || selectedProperty.lng ||
            selectedProperty.centroidX || selectedProperty.CentroidX ||
            propertyDetail?.centroidX || propertyDetail?.CentroidX ||
            propertyDetail?.ASS_Longitude || propertyDetail?.assLongitude ||
            propertyDetail?.longitude || propertyDetail?.Longitude || 0
        );

        // Helper to parse geometry from string, GeoJSON object or wrapped response
        const parseGeometry = (raw: unknown): GeoJsonObject | null => {
            if (!raw) return null;
            if (typeof raw === 'string') {
                try {
                    const parsed = JSON.parse(raw);
                    if (parsed && (parsed.type || parsed.coordinates || parsed.geometry || parsed.geoJson)) {
                        return parseGeometry(parsed);
                    }
                } catch {}
            }
            const record = raw as Record<string, unknown>;
            if (record.type && record.coordinates) return raw as GeoJsonObject;
            if (record.geoJson) return parseGeometry(record.geoJson);
            if (record.geometry) return parseGeometry(record.geometry);
            if (record.polygonGeometry) return parseGeometry(record.polygonGeometry);
            if (record.rawGeoJson) return parseGeometry(record.rawGeoJson);
            if (record.items) return parseGeometry(record.items);
            if (record.data) return parseGeometry(record.data);
            return null;
        };

        // ── Helper: Draw an exact GeoJSON polygon ─────────────────────────────────
        const drawPolygon = (geom: unknown): L.GeoJSON | null => {
            const parsed = parseGeometry(geom);
            if (!parsed || !highlightLayer) return null;
            try {
                const svgRenderer = L.svg();
                const layer = L.geoJSON(parsed, {
                    style: () => ({ ...HIGHLIGHT_STYLE, renderer: svgRenderer })
                }).addTo(highlightLayer);
                return layer;
            } catch (e) {
                logger.warn('[PopupCoordinator] Error rendering highlight geoJSON:', { error: e as Error });
                return null;
            }
        };

        // ── Helper: Zoom map to fit the drawn polygon ─────────────────────────────
        const fitToLayer = (layer: L.GeoJSON) => {
            if (!active || !map) return;
            const tryFit = () => {
                try {
                    const bounds = layer.getBounds();
                    if (bounds && bounds.isValid() && map) {
                        map.invalidateSize();
                        map.fitBounds(bounds, {
                            padding: [60, 60],
                            maxZoom: 20,
                            animate: true,
                            duration: 0.6
                        });
                    }
                } catch (e) {
                    logger.warn('[PopupCoordinator] fitBounds failed:', { error: e as Error });
                }
            };

            tryFit();
            setTimeout(tryFit, 250);
            setTimeout(tryFit, 600);
        };

        // ── Helper: Approximate point fallback (only when no polygon geometry exists) ─
        const drawApproximateAndFly = (lat: number, lng: number) => {
            if (lat === 0 || lng === 0) return;
            if (!active || !map) return;
            const tryFly = () => {
                try {
                    map.invalidateSize();
                    map.flyTo([lat, lng], Math.max(map.getZoom(), 18), {
                        animate: true,
                        duration: 0.6
                    });
                } catch (e) {
                    logger.warn('[PopupCoordinator] flyTo failed:', { error: e as Error });
                }
            };

            tryFly();
            setTimeout(tryFly, 250);
            setTimeout(tryFly, 600);
        };

        // ── 4. MAIN FLOW: Geometry-first navigation ───────────────────────────────
        if (highlightLayer) {
            highlightLayer.clearLayers();

            // ASSET MANAGEMENT PORTAL: Direct geometry handling from tblGisAssetGeometry & boundary layers
            if (activeModule === 'ASSET') {
                const targetAssetId = selectedProperty.assetId ?? selectedProperty.AssetId ?? selectedProperty.targetId ?? selectedProperty.TargetId ?? selectedProperty.id ?? selectedProperty.Id ?? selectedProperty.MPMS_ID ?? selectedProperty.mpmsId ?? selectedProperty.assetNo ?? selectedProperty.AssetNo ?? selectedProperty.OwnerID ?? selectedProperty.ownerID ?? ownerId;
                const altAssetNo = selectedProperty.assetNo ?? selectedProperty.AssetNo ?? selectedProperty.MPMS_ID ?? selectedProperty.mpmsId;

                const parsedInline = parseGeometry(inlineGeometry || selectedProperty.geoJson || propertyDetail?.geoJson);
                if (parsedInline) {
                    const layer = drawPolygon(parsedInline);
                    if (layer) fitToLayer(layer);
                    setPolygonReady(true);
                    return;
                }

                // 1. Search in pre-loaded GeoJSON layers (e.g. zone, ward, citysurvey, nazulsheet)
                const state = useCouncilBoundaryStore.getState();
                const layersObj = (state.geoJsonLayers || {}) as Record<string, { features?: Feature[] }>;
                let matchedFeature: Feature | null = null;

                if (targetAssetId || altAssetNo) {
                    const idNorm = String(targetAssetId || altAssetNo).trim().toLowerCase();
                    const cleanNumericId = idNorm.replace(/^mpms-?/, '');

                    for (const layerKey of Object.keys(layersObj)) {
                        const geoData = layersObj[layerKey];
                        if (geoData && Array.isArray(geoData.features)) {
                            const feat = geoData.features.find((f) => {
                                const p = (f.properties || {}) as Record<string, unknown>;
                                const fields = [
                                    p.assetId, p.AssetId, p.id, p.Id,
                                    p.MPMS_ID, p.mpmsId, p.OwnerID, p.ownerID, p.ownerId,
                                    p.assetNo, p.AssetNo,
                                    p.PTAX_BUIL_ID, p.ptaxBuilId, p.Buil_ID, p.builId, p.Buil_Id,
                                    p.BuildingID, p.buildingID, p.PropertyNo, p.propertyNo, f.id
                                ];
                                return fields.some(val => {
                                    if (!val) return false;
                                    const vNorm = String(val).trim().toLowerCase();
                                    const vClean = vNorm.replace(/^mpms-?/, '');
                                    return vNorm === idNorm || vClean === cleanNumericId;
                                });
                            });
                            if (feat) {
                                matchedFeature = feat;
                                break;
                            }
                        }
                    }
                }

                if (matchedFeature && matchedFeature.geometry) {
                    const layer = drawPolygon(matchedFeature.geometry);
                    if (layer) {
                        fitToLayer(layer);
                        setPolygonReady(true);
                        return;
                    }
                }

                // 2. Fetch from asset geometry endpoints (checks asset code e.g. MPMS11-35, numeric ID, and tile geometry)
                const candidates = [altAssetNo, targetAssetId, ownerId].filter(Boolean).map(v => String(v).trim());
                const uniqueCandidates = Array.from(new Set(candidates));

                const fetchAssetGeometryData = async () => {
                    for (const cand of uniqueCandidates) {
                        // Attempt 1: Server action getAssetGeometryDetailsAction
                        try {
                            const res = await getAssetGeometryDetailsAction(cand);
                            if (res && res.success && res.data) {
                                const resp = res.data;
                                const geom = parseGeometry(resp);
                                const resLat = Number(resp.centroidY ?? 0);
                                const resLng = Number(resp.centroidX ?? 0);
                                if (geom || (resLat && resLng)) {
                                    return { geom, lat: resLat || fallbackLat, lng: resLng || fallbackLng };
                                }
                            }
                        } catch {}

                        // Attempt 2: Server action getGeometryAction
                        try {
                            const res = await getGeometryAction(cand);
                            if (res && res.success && res.data) {
                                const geom = parseGeometry(res.data);
                                if (geom) {
                                    return { geom, lat: fallbackLat, lng: fallbackLng };
                                }
                            }
                        } catch {}
                    }
                    return null;
                };

                fetchAssetGeometryData().then(result => {
                    if (!active) return;
                    if (result?.geom) {
                        const layer = drawPolygon(result.geom);
                        if (layer) fitToLayer(layer);
                    } else if ((result?.lat && result?.lng) || (fallbackLat && fallbackLng)) {
                        const finalLat = result?.lat || fallbackLat;
                        const finalLng = result?.lng || fallbackLng;
                        if (finalLat !== 0 && finalLng !== 0) {
                            drawApproximateAndFly(finalLat, finalLng);
                        }
                    }
                    if (active) setPolygonReady(true);
                }).catch(() => {
                    if (!active) return;
                    if (fallbackLat && fallbackLng && fallbackLat !== 0 && fallbackLng !== 0) {
                        drawApproximateAndFly(fallbackLat, fallbackLng);
                    }
                    if (active) setPolygonReady(true);
                });
                return;
            }

            // PROPERTY TAX PORTAL: Geometry-first navigation
            const primaryId = ownerId || builId;

            if (!primaryId) {
                if (inlineGeometry) {
                    drawPolygon(inlineGeometry);
                } else {
                    drawApproximateAndFly(fallbackLat, fallbackLng);
                }
                setPolygonReady(true);
                return;
            }

            // Attempt A: Fetch by ownerId via Server Action
            const fetchGeometry = (id: string): Promise<unknown> =>
                getGeometryAction(id)
                    .then((res: { success?: boolean; data?: unknown }) => (res && res.success ? res.data : null))
                    .catch(() => null);

            const resolveGeom = (response: unknown): GeoJsonObject | null => {
                if (!response) return null;
                const rec = response as Record<string, unknown>;
                const inner = (rec?.data ?? rec?.items ?? response) as Record<string, unknown>;
                if (inner && (inner.type || inner.coordinates)) return inner as unknown as GeoJsonObject;
                return null;
            };

            // Start with ownerId lookup
            fetchGeometry(primaryId).then(async (resp) => {
                if (!active || !isMapValid(map)) return;
                let geom = resolveGeom(resp);

                if (!geom && builId && builId !== primaryId) {
                    const resp2 = await fetchGeometry(builId);
                    if (!active || !isMapValid(map)) return;
                    geom = resolveGeom(resp2);
                }

                if (!active || !isMapValid(map)) return;

                if (geom) {
                    const layer = drawPolygon(geom);
                    if (layer) {
                        fitToLayer(layer);
                    }
                } else if (inlineGeometry) {
                    const layer = drawPolygon(inlineGeometry);
                    if (layer) {
                        fitToLayer(layer);
                    }
                } else {
                    drawApproximateAndFly(fallbackLat, fallbackLng);
                }
                if (active) setPolygonReady(true);
            });
        } else {
            // No highlight layer to draw into yet (e.g. map still initializing) — there's
            // nothing left to wait for, so don't leave the panel hidden indefinitely.
            setPolygonReady(true);
        }

        // 5. Popup tooltip handling: removed per user request
        //    (Only the right-side property analysis panel is used)
        return () => {
            active = false;
        };
    }, [selectedProperty, propertyDetail, activeModule, mapRef, highlightLayerRef, setPolygonReady]);

    return null;
};

