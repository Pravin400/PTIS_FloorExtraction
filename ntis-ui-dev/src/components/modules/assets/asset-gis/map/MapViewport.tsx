'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { MapLegend } from './MapLegend';
import { AnimatePresence } from 'motion/react';

const LeafletOperationalMap = dynamic(() => import('./LeafletOperationalMap'), { ssr: false });

import type { Map as LeafletMap } from 'leaflet';

// Expose leaflet map ref for invalidateSize calls
export const leafletMapRef: { current: LeafletMap | null } = { current: null };

export const MapViewport = ({ showSidebar }: { showSidebar: boolean }) => {
    const { geoJsonLoaded } = useCouncilBoundaryStore();

    useEffect(() => {
        const trigger = () => {
            const map = leafletMapRef.current;
            if (map) {
                try {
                    map.invalidateSize();
                } catch (_e) { }
            }
        };

        // Multi-stage invalidation to catch all layout shifts during sidebar transitions
        trigger();
        const timeouts = [100, 500, 1000, 2000, 5000].map(ms => setTimeout(trigger, ms));

        return () => timeouts.forEach(t => clearTimeout(t));
    }, [showSidebar, geoJsonLoaded]);

    const selectedProperty = useCouncilBoundaryStore(state => state.selectedProperty);

    return (
        <div className="relative w-full h-full overflow-hidden bg-white">
            {/* Leaflet Dashboard */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    visibility: 'visible',
                    opacity: 1
                }}
            >
                <LeafletOperationalMap />
            </div>

            {/* FLOATING MAP TOOLS */}
            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-4">
                <AnimatePresence>
                    {!selectedProperty && <MapLegend />}
                </AnimatePresence>
            </div>
        </div>
    );
};
