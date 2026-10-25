/**
 * Leaflet Operational Map
 * Standard: Clean Architecture / ntis-ui-main
 * This component acts as a coordinator for map core, layers, and interactions.
 */

'use client';

import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { MapCore } from './MapCore';
import { MapLayers } from './MapLayers';
import { MapInteractions } from './MapInteractions';
import { useMapStyling, useMapNavigation } from '@/hooks/asset-gis-map';
import { MapPopupCoordinator } from './MapPopupCoordinator';

export default function LeafletOperationalMap() {
    // 1. References (Shared across sub-components)
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const highlightLayerRef = useRef<L.LayerGroup | null>(null);
    const isMounted = useRef(true);
    const layersRef = useRef<{ [key: string]: L.Layer | null }>({});
    const turboLayerRef = useRef<L.Layer | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    // 2. State & Store
    const [isMapReady, setIsMapReady] = useState(false);
    const handleMapReady = useCallback(() => {
        setIsMapReady(true);
    }, []);
    const [, setBounds] = useState<[number, number, number, number] | null>(null);
    const filters = useCouncilBoundaryStore(s => s.filters);
    const apiFilteredPropertyIds = useCouncilBoundaryStore(s => s.apiFilteredPropertyIds);
    const loadingDashboardData = useCouncilBoundaryStore(s => s.loadingDashboardData);
    const isFetchingGridData = useCouncilBoundaryStore(s => s.isFetchingGridData);
    const selectedZone = useCouncilBoundaryStore(s => s.selectedZone);
    const selectedZoneNo = useCouncilBoundaryStore(s => s.selectedZoneNo);
    const selectedZoneLabel = useCouncilBoundaryStore(s => s.selectedZoneLabel);
    const selectedWard = useCouncilBoundaryStore(s => s.selectedWard);
    const selectedBlock = useCouncilBoundaryStore(s => s.selectedBlock);
    const selectedWardNo = useCouncilBoundaryStore(s => s.selectedWardNo);
    const selectedBlockLabel = useCouncilBoundaryStore(s => s.selectedBlockLabel);
    const activeKpiFilter = useCouncilBoundaryStore(s => s.activeKpiFilter);
    const propertyStatusMapping = useCouncilBoundaryStore(s => s.propertyStatusMapping);
    const assessmentSubCategory = useCouncilBoundaryStore(s => s.assessmentSubCategory);
    const taxStatus = useCouncilBoundaryStore(s => s.taxStatus);
    const selectedPropertyTypeGroup = useCouncilBoundaryStore(s => s.selectedPropertyTypeGroup);
    const selectedPropertyTypeId = useCouncilBoundaryStore(s => s.selectedPropertyTypeId);
    const documentSubmittedStatus = useCouncilBoundaryStore(s => s.documentSubmittedStatus);
    const selectedProperty = useCouncilBoundaryStore(s => s.selectedProperty);
    const selectionSource = useCouncilBoundaryStore(s => s.selectionSource);
    const heatMapType = useCouncilBoundaryStore(s => s.heatMapType);
    const heatMapIntensity = useCouncilBoundaryStore(s => s.heatMapIntensity);
    const blocks = useCouncilBoundaryStore(s => s.blocks);
    const geoJsonLayers = useCouncilBoundaryStore(s => s.geoJsonLayers);

    const loadAllGeoJsonLayers = useCouncilBoundaryStore(s => s.loadAllGeoJsonLayers);

    useEffect(() => {
        loadAllGeoJsonLayers();
    }, [loadAllGeoJsonLayers]);

    // 3. Specialized Logic Hooks
    const filterConfig = useMemo(() => ({
        ...filters,
        apiMatchedIdsSet: new Set(apiFilteredPropertyIds),
        loadingDashboardData: loadingDashboardData,
        isFetchingGridData: isFetchingGridData,
        selectedZone: selectedZone,
        selectedZoneNo: selectedZoneNo,
        selectedZoneLabel: selectedZoneLabel,
        selectedWard: selectedWard,
        selectedBlock: selectedBlock,
        selectedWardNo: selectedWardNo,
        selectedBlockLabel: selectedBlockLabel,
        activeKpiFilter: activeKpiFilter,
        propertyStatusMapping: propertyStatusMapping,
        assessmentSubCategory: assessmentSubCategory || 'all',
        documentSubmittedStatus: documentSubmittedStatus || 'all',
        propertyTypeGroup: selectedPropertyTypeGroup || filters?.propertyTypeGroup || null,
        PropertyTypeID: selectedPropertyTypeId || filters?.PropertyTypeID || null,
        taxStatus: taxStatus,
        selectionSource: selectionSource,
    }), [
        filters,
        selectedZone,
        selectedZoneNo,
        selectedZoneLabel,
        selectedWard,
        selectedBlock,
        selectedWardNo,
        selectedBlockLabel,
        activeKpiFilter,
        apiFilteredPropertyIds,
        loadingDashboardData,
        isFetchingGridData,
        propertyStatusMapping,
        assessmentSubCategory,
        documentSubmittedStatus,
        selectedPropertyTypeGroup,
        selectedPropertyTypeId,
        taxStatus,
        selectionSource
    ]);

    const { getFeatureStyle } = useMapStyling(
        filterConfig as unknown as Parameters<typeof useMapStyling>[0],
        selectedProperty as unknown as Parameters<typeof useMapStyling>[1],
        activeKpiFilter,
        heatMapType,
        heatMapIntensity,
        blocks as unknown as Parameters<typeof useMapStyling>[5],
        geoJsonLayers as unknown as Parameters<typeof useMapStyling>[6]
    );
    useMapNavigation(
        geoJsonLayers as unknown as Parameters<typeof useMapNavigation>[0],
        selectedBlock,
        selectedZone,
        mapRef,
        blocks as unknown as Parameters<typeof useMapNavigation>[4],
        selectedWardNo,
        selectedZoneNo,
        selectedZoneLabel
    );

    return (
        <div className="w-full h-full relative group">
            {/* The Map Canvas Container */}
            <div ref={mapContainerRef} className="w-full h-full outline-none border-none" style={{ backgroundColor: 'transparent', border: 'none' }} />

            {/* Sub-Components (Headless - they only handle logic/layers) */}
            <MapCore
                mapContainerRef={mapContainerRef}
                mapRef={mapRef}
                markersLayerRef={markersLayerRef}
                highlightLayerRef={highlightLayerRef}
                isMounted={isMounted}
                setBounds={setBounds}
                onMapReady={handleMapReady}
            />

            {isMapReady && (
                <MapLayers
                    mapRef={mapRef}
                    turboLayerRef={turboLayerRef}
                    layersRef={layersRef}
                    tileLayerRef={tileLayerRef}
                    getFeatureStyle={getFeatureStyle as (feature: unknown, layerKey: string) => import('leaflet').PathOptions}
                    filterConfig={filterConfig as unknown as Parameters<typeof MapLayers>[0]['filterConfig']}
                />
            )}

            {isMapReady && (
                <MapInteractions
                    mapRef={mapRef}
                    turboLayerRef={turboLayerRef}
                    isMounted={isMounted}
                />
            )}

            {isMapReady && (
                <MapPopupCoordinator
                    mapRef={mapRef}
                    highlightLayerRef={highlightLayerRef}
                />
            )}

        </div>
    );
}
