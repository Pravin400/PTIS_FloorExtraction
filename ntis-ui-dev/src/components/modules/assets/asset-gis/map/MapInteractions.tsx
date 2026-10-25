/**
 * Map Interactions Component
 * Standard: Clean Architecture - handles events, search zoom, and user interactions.
 */

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { normalizeOwnerId } from '@/lib/utils/asset-gis-utils';
import { logger } from '@/lib/utils/logger';
import type { MapInteractionsProps } from '@/types/asset-gis.types';

export type { MapInteractionsProps };

export const MapInteractions = ({ mapRef, turboLayerRef }: MapInteractionsProps) => {
    const {
        setSelectedPropertyWithSource,
        prefetchPropertyDetail,
        activeModule
    } = useCouncilBoundaryStore();

    const prefetchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastHoveredIdRef = useRef<string | null>(null);

    // Note: Search zooming and polygon highlighting is handled exclusively by MapPopupCoordinator (geometry-first navigation)


    // 2. Mouse Move / Hover Handling
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        let lastMoveTime = 0;
        const onMapMove = (e: L.LeafletMouseEvent) => {
            const map = mapRef.current;
            if (!map) return;

            const zoom = map.getZoom();
            const now = Date.now();

            // GIS_PERF: Increase throttle to 100ms and disable lookups at city-level (Zoom < 13)
            if (now - lastMoveTime < 100 || zoom < 13) {
                if (zoom < 13) {
                    map.getContainer().style.cursor = '';
                }
                return;
            }
            lastMoveTime = now;

            const turboLayer = turboLayerRef.current as (L.Layer & { getFeatureAt?: (latlng: L.LatLng) => GeoJSON.Feature | null }) | null;
            const feat = turboLayer?.getFeatureAt ? turboLayer.getFeatureAt(e.latlng) : null;

            const id = feat && feat.properties ? normalizeOwnerId(feat.properties.OwnerID || feat.properties.ownerid || '') : '';
            const isUnlinked = !id || id === '0' || id === 'null' || id.startsWith('-') || feat?.properties?.StatusType === 'UNLINKED';

            const container = map.getContainer();
            container.style.cursor = feat && !isUnlinked ? 'pointer' : '';

            if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
            if (feat && feat.properties && !isUnlinked) {
                if (id && id !== lastHoveredIdRef.current) {
                    prefetchTimerRef.current = setTimeout(() => {
                        lastHoveredIdRef.current = id;
                        if (activeModule !== 'ASSET') prefetchPropertyDetail(id);
                    }, 250); // Increased delay for prefetch
                }
            } else {
                lastHoveredIdRef.current = null;
            }
        };

        const onMapClick = async (e: L.LeafletMouseEvent) => {
            const turboLayer = turboLayerRef.current as (L.Layer & { getFeatureAt?: (latlng: L.LatLng) => GeoJSON.Feature | null }) | null;
            const feat = turboLayer?.getFeatureAt ? turboLayer.getFeatureAt(e.latlng) : null;

            if (activeModule === 'ASSET') {
                const assetId = feat?.properties?.assetMasterId || feat?.properties?.assetId || feat?.properties?.AssetId || feat?.properties?.MPMS_ID || feat?.properties?.MpmsId || feat?.properties?.OwnerID || feat?.properties?.MPMS_OWNER || feat?.properties?.CON || String(feat?.properties?.id || feat?.properties?.Id || '');

                // Query identify endpoint
                try {
                    const { identifyAssetAction } = await import('@/app/[locale]/assets/gismapviewer/actions');
                    const res = await identifyAssetAction(e.latlng.lat, e.latlng.lng);
                    const resRecord = res as unknown as Record<string, unknown> | null | undefined;
                    const raw = (resRecord?.data ?? resRecord) as Record<string, unknown> | null | undefined;
                    const item = (raw?.items ?? raw?.data ?? raw) as Record<string, unknown> | null | undefined;

                    if (item && (item.assetMasterId || item.assetNo || item.assetName || item.buildingId || item.id)) {
                        let parsedGeometry = null;
                        if (item.geoJson) {
                            try {
                                parsedGeometry = typeof item.geoJson === 'string' ? JSON.parse(item.geoJson) : item.geoJson;
                            } catch {
                                parsedGeometry = item.geoJson;
                            }
                        } else if (item.geometry || item.polygonGeometry) {
                            parsedGeometry = item.geometry || item.polygonGeometry;
                        }

                        const parsedAssetId = Number(item.assetMasterId || item.assetId || item.id || feat?.properties?.assetMasterId);
                        const payload = {
                            ...(feat?.properties || {}),
                            ...item,
                            assetMasterId: !isNaN(parsedAssetId) && parsedAssetId > 0 ? parsedAssetId : (item.assetMasterId || undefined),
                            assetId: !isNaN(parsedAssetId) && parsedAssetId > 0 ? parsedAssetId : (item.assetMasterId || item.assetNo || assetId),
                            id: !isNaN(parsedAssetId) && parsedAssetId > 0 ? parsedAssetId : (item.assetMasterId || item.assetNo || assetId),
                            targetId: item.assetMasterId || item.assetNo || assetId,
                            MPMS_ID: item.assetNo || item.buildingId || assetId,
                            assetNo: item.assetNo || item.buildingId || assetId,
                            assetName: item.assetName || feat?.properties?.assetName || feat?.properties?.AssetName,
                            categoryName: item.categoryName || feat?.properties?.categoryName || feat?.properties?.CategoryName,
                            typeName: item.typeName || item.assetTypeName || feat?.properties?.typeName || feat?.properties?.TypeName,
                            assetTypeName: item.typeName || item.assetTypeName || feat?.properties?.typeName || feat?.properties?.TypeName,
                            departmentName: item.departmentName || feat?.properties?.departmentName,
                            inChargeName: item.inChargeName || feat?.properties?.inChargeName,
                            inChargeMobile: item.inChargeMobile || feat?.properties?.inChargeMobile,
                            encroachmentStatus: item.encroachmentStatus || feat?.properties?.encroachmentStatus,
                            capitalValue: item.capitalValue ?? feat?.properties?.capitalValue,
                            annualRevenue: item.annualRevenue ?? feat?.properties?.annualRevenue,
                            buildingId: item.buildingId || feat?.properties?.buildingId,
                            totalAreaSqMeter: item.totalAreaSqMeter ?? feat?.properties?.totalAreaSqMeter,
                            totalAreaSqFeet: item.totalAreaSqFeet ?? feat?.properties?.totalAreaSqFeet,
                            googleMapLink: item.googleMapLink || feat?.properties?.googleMapLink,
                            link360: item.link360 || feat?.properties?.link360,
                            latitude: item.centroidY || feat?.properties?.centroidY || e.latlng.lat,
                            longitude: item.centroidX || feat?.properties?.centroidX || e.latlng.lng,
                            geometry: parsedGeometry || feat?.geometry
                        };

                        setSelectedPropertyWithSource(payload, 'map');
                        useCouncilBoundaryStore.setState({ propertyDetail: payload, polygonReady: true });

                        try {
                            map.panTo(e.latlng, { animate: true, duration: 0.3 });
                        } catch (_err) { }
                        return;
                    }
                } catch (err) {
                    logger.warn('[MapInteractions] identify query error:', { error: err as Error });
                }

                if (assetId && assetId !== '0' && assetId !== 'null') {
                    const payload = {
                        assetId: Number(assetId) || assetId,
                        id: Number(assetId) || assetId,
                        MPMS_ID: assetId,
                        OwnerID: assetId,
                        ownerID: assetId,
                        ...(feat?.properties || {}),
                        latitude: e.latlng.lat,
                        longitude: e.latlng.lng,
                        geometry: feat?.geometry
                    };
                    setSelectedPropertyWithSource(payload, 'map');
                    useCouncilBoundaryStore.setState({ propertyDetail: payload, polygonReady: true });
                    try {
                        map.panTo(e.latlng, { animate: true, duration: 0.3 });
                    } catch (_err) { }
                }
                return;
            }

            if (feat && feat.properties) {
                const id = normalizeOwnerId(feat.properties.OwnerID || feat.properties.ownerid || '');
                const isUnlinked = !id || id === '0' || id === 'null' || id.startsWith('-') || feat.properties?.StatusType === 'UNLINKED';

                if (!isUnlinked && id) {
                    const payload = {
                        ...feat.properties,
                        ownerID: id,
                        latitude: e.latlng.lat,
                        longitude: e.latlng.lng,
                        geometry: feat.geometry
                    };
                    setSelectedPropertyWithSource(payload, 'map');
                    useCouncilBoundaryStore.setState({ propertyDetail: payload, polygonReady: true });
                    try {
                        map.panTo(e.latlng, { animate: true, duration: 0.3 });
                    } catch (err) {
                        logger.warn('[MapInteractions] panTo failed:', { error: err as Error });
                    }
                }
            }
        };

        const onMapMouseOut = () => {
            // Keep cursor standard
        };

        map.on('mousemove', onMapMove);
        map.on('click', onMapClick);
        map.on('mouseout', onMapMouseOut);

        return () => {
            map.off('mousemove', onMapMove);
            map.off('click', onMapClick);
            map.off('mouseout', onMapMouseOut);
            if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
        };
    }, [mapRef, turboLayerRef, activeModule, prefetchPropertyDetail, setSelectedPropertyWithSource]);

    return null;
};
