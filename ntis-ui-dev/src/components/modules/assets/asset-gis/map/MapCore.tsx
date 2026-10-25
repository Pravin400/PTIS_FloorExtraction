/**
 * Map Core Component
 * Standard: Clean Architecture - handles map initialization and lifecycle.
 */

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { leafletMapRef } from './MapViewport';
import { applyLeafletPatches } from './LeafletPatches';
import { logger } from '@/lib/utils/logger';
import type { MapCoreProps } from '@/types/asset-gis.types';

export type { MapCoreProps };

export const MapCore = ({
    mapContainerRef,
    mapRef,
    markersLayerRef,
    highlightLayerRef,
    setBounds,
    onMapReady
}: MapCoreProps) => {
    const { center, setZoom, setSelectedProperty } = useCouncilBoundaryStore();

    const onMapReadyRef = useRef(onMapReady);
    const setBoundsRef = useRef(setBounds);

    useEffect(() => {
        onMapReadyRef.current = onMapReady;
        setBoundsRef.current = setBounds;
    }, [onMapReady, setBounds]);

    useEffect(() => {
        if (mapRef.current) return;
        if (!mapContainerRef.current) return;

        let active = true;
        applyLeafletPatches();

        // PERFORMANCE: Disabled verbose logging

        // Clean up stale leaflet instance if any
        const containerEl = mapContainerRef.current as (HTMLDivElement & { _leaflet_id?: number }) | null;
        if (containerEl?._leaflet_id) {
            delete containerEl._leaflet_id;
            mapContainerRef.current.innerHTML = '';
        }

        const initialCenter: [number, number] = center ? [center[0], center[1]] : [19.2183, 72.9781];
        const initialZoom = 13;

        try {
            const map = L.map(mapContainerRef.current, {
                minZoom: 10,
                maxZoom: 24,
                zoomControl: false,
                attributionControl: false,
                zoomSnap: 0.5,
                zoomDelta: 0.5,
                trackResize: true,
                boxZoom: true,
                preferCanvas: true,
                zoomAnimation: true,
                fadeAnimation: true,
                markerZoomAnimation: true,
                inertia: true,
            }).setView(initialCenter, initialZoom);

            L.control.zoom({ position: 'bottomright' }).addTo(map);
            L.control.scale({ position: 'bottomleft' }).addTo(map);

            markersLayerRef.current = L.layerGroup().addTo(map);
            highlightLayerRef.current = L.layerGroup().addTo(map);
            mapRef.current = map;
            leafletMapRef.current = map;
            if (onMapReadyRef.current) onMapReadyRef.current();

            const updateState = () => {
                if (active && map && map.getContainer()) {
                    const b = map.getBounds();
                    const bbox: [number, number, number, number] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
                    setBoundsRef.current(bbox);
                    setZoom(map.getZoom());

                    // PERFORMANCE_FIX: Sync BBox to store for view-aware API fetching
                    useCouncilBoundaryStore.getState().setMapBBox(bbox);
                }
            };

            map.on('moveend', updateState);
            map.on('click', (e: L.LeafletMouseEvent) => {
                const target = e.originalEvent?.target as HTMLElement;
                const isMapBackground = target?.classList.contains('leaflet-container') ||
                    (target?.tagName === 'DIV' && target?.parentElement?.classList.contains('leaflet-pane'));

                if (isMapBackground) setSelectedProperty(null);
            });

            updateState();
        } catch (error) {
            logger.error('[MapCore] Leaflet initialization error:', { error: error as Error });
        }

        const container = mapContainerRef.current;
        const resizeObserver = new ResizeObserver(() => {
            if (active && mapRef.current) {
                try { mapRef.current.invalidateSize(); } catch (_e) { }
            }
        });
        if (container) {
            resizeObserver.observe(container);
        }

        // --- FIX: Multiple staged invalidations for complex layouts ---
        const timeoutIds = [100, 500, 1000, 2000].map(delay => {
            return setTimeout(() => {
                if (active && mapRef.current) {
                    mapRef.current.invalidateSize();
                }
            }, delay);
        });

        return () => {
            active = false;
            resizeObserver.disconnect();
            timeoutIds.forEach(id => clearTimeout(id));
            if (!mapRef.current) return;
            const m = mapRef.current;
            mapRef.current = null;
            leafletMapRef.current = null;

            try {
                m.off();
                m.stop();
                m.remove();
            } catch (e) {
                logger.warn('Map cleanup bypass:', { error: e as Error });
            }
        };
    }, [center, mapContainerRef, mapRef, markersLayerRef, highlightLayerRef, setZoom, setSelectedProperty]);

    return null;
};
