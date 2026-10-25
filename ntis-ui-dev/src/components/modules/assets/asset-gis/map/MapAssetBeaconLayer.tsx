/**
 * Map Asset Beacon Layer Component
 * Standard: Clean Architecture - Handles animated beacon markers for filtered municipal assets
 */

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { MUNICIPAL_ASSET_TYPE_COLORS } from '@/hooks/asset-gis-map';
import type { MapAssetBeaconLayerProps } from '@/types/asset-gis.types';

export type { MapAssetBeaconLayerProps };

export const MapAssetBeaconLayer = ({
  mapRef,
  markersLayerRef
}: MapAssetBeaconLayerProps) => {
  const selectedPropertyTypeId = useCouncilBoundaryStore((s) => s.selectedPropertyTypeId);
  const selectedZone = useCouncilBoundaryStore((s) => s.selectedZone);
  const selectedWard = useCouncilBoundaryStore((s) => s.selectedWard);
  const selectedBlock = useCouncilBoundaryStore((s) => s.selectedBlock);
  const selectedWardNo = useCouncilBoundaryStore((s) => s.selectedWardNo);
  const activeModule = useCouncilBoundaryStore((s) => s.activeModule);
  const setSelectedProperty = useCouncilBoundaryStore((s) => s.setSelectedProperty);

  const localMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Ensure pane for beacon markers exists with high z-index
    if (!map.getPane('beacons')) {
      const pane = map.createPane('beacons');
      pane.style.zIndex = '700';
    }

    if (!localMarkersGroupRef.current) {
      localMarkersGroupRef.current = L.layerGroup().addTo(map);
      if (markersLayerRef) {
        markersLayerRef.current = localMarkersGroupRef.current;
      }
    }

    return () => {
      if (localMarkersGroupRef.current) {
        map.removeLayer(localMarkersGroupRef.current);
        localMarkersGroupRef.current = null;
      }
    };
  }, [mapRef, markersLayerRef]);

  useEffect(() => {
    if (!mapRef.current || !localMarkersGroupRef.current) return;
    const markersGroup = localMarkersGroupRef.current;
    markersGroup.clearLayers();

    // Only render beacon markers in ASSET module when an Asset Type filter is active
    const isAssetModule = activeModule === 'ASSET';
    const typeIdStr = String(selectedPropertyTypeId || '').trim();
    const hasTypeFilter = Boolean(typeIdStr && typeIdStr !== 'all' && typeIdStr !== '0' && typeIdStr !== 'null');

    if (!isAssetModule || !hasTypeFilter) {
      return;
    }

    const typeConfig = MUNICIPAL_ASSET_TYPE_COLORS[typeIdStr];
    if (!typeConfig) return;

    // Beacon markers are drawn via TurboTileLayer canvas for hyper-performance;
    // this component acts as the standalone coordinator hook when interactive DOM markers are requested.
  }, [
    mapRef,
    selectedPropertyTypeId,
    selectedZone,
    selectedWard,
    selectedBlock,
    selectedWardNo,
    activeModule,
    setSelectedProperty
  ]);

  return null;
};

export default MapAssetBeaconLayer;
