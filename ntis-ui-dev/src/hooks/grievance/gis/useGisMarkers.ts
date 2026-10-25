import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type {
  GisGrievanceQueryParameters,
  GisGrievanceFilterGroupDto,
} from '@/types/grievance/grievance-gis.types';
import type { PublicGrievanceApplication } from '@/types/grievance/public-dashboard.types';
import {
  createRadarBeaconIcon,
  filterGrievances,
  computeDispersedPositions,
  resolveMarkerStatus,
  buildMarkerTooltipHtml,
} from '@/lib/utils/grievance/gis';

interface UseGisMarkersProps {
  mapRef: React.MutableRefObject<L.Map | null>;
  markersLayerRef: React.MutableRefObject<L.LayerGroup | null>;
  grievances?: PublicGrievanceApplication[];
  filters: GisGrievanceQueryParameters;
  filterGroups?: GisGrievanceFilterGroupDto[];
  selectedGrievanceId?: number;
  onSelectGrievanceId: (grievanceId: number) => void;
  currentZoom: number;
}

export function useGisMarkers({
  mapRef,
  markersLayerRef,
  grievances,
  filters,
  filterGroups,
  selectedGrievanceId,
  onSelectGrievanceId,
  currentZoom,
}: UseGisMarkersProps) {
  const activeTooltipMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const map = mapRef.current;
    const activeList = grievances || [];

    if (activeTooltipMarkerRef.current) {
      activeTooltipMarkerRef.current.closeTooltip();
      activeTooltipMarkerRef.current = null;
    }

    if (activeList.length === 0) {
      markersLayerRef.current.clearLayers();
      return;
    }

    const filtered = filterGrievances(activeList, filters);
    const dispersed = computeDispersedPositions(filtered);
    const newMarkers: L.Marker[] = [];

    dispersed.forEach(({ item, lat, lng }) => {

      const { dynamicStatusColor, statusColor, dept, gtype, status } = resolveMarkerStatus(item, filterGroups);
      const isSelected = selectedGrievanceId === item.id;
      const icon = createRadarBeaconIcon(
        item.currentStateName,
        item.isResolved,
        item.isEscalated,
        isSelected,
        currentZoom,
        dynamicStatusColor
      );

      const marker = L.marker([lat, lng], {
        icon,
        interactive: true,
        riseOnHover: true,
        zIndexOffset: isSelected ? 4000 : 2500,
      });

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onSelectGrievanceId(item.id);
      });

      marker.bindTooltip(
        buildMarkerTooltipHtml(item, statusColor, dept, gtype, status),
        {
          direction: 'top',
          offset: [0, -12],
          className: 'amc-leaflet-tooltip',
          opacity: 1,
        }
      );

      // Enforce single tooltip open on map at any time
      marker.on('mouseover', () => {
        if (activeTooltipMarkerRef.current && activeTooltipMarkerRef.current !== marker) {
          activeTooltipMarkerRef.current.closeTooltip();
          activeTooltipMarkerRef.current = null;
        }
      });

      marker.on('tooltipopen', () => {
        if (activeTooltipMarkerRef.current && activeTooltipMarkerRef.current !== marker) {
          activeTooltipMarkerRef.current.closeTooltip();
        }
        activeTooltipMarkerRef.current = marker;
      });

      marker.on('mouseout', () => {
        marker.closeTooltip();
        if (activeTooltipMarkerRef.current === marker) {
          activeTooltipMarkerRef.current = null;
        }
      });

      marker.on('tooltipclose', () => {
        if (activeTooltipMarkerRef.current === marker) {
          activeTooltipMarkerRef.current = null;
        }
      });

      newMarkers.push(marker);
    });

    markersLayerRef.current.clearLayers();
    if (newMarkers.length > 0) {
      const batchGroup = L.layerGroup(newMarkers);
      markersLayerRef.current.addLayer(batchGroup);
    }

    const handleMapMovement = () => {
      if (activeTooltipMarkerRef.current) {
        activeTooltipMarkerRef.current.closeTooltip();
        activeTooltipMarkerRef.current = null;
      }
    };
    map.on('dragstart zoomstart click', handleMapMovement);

    return () => {
      map.off('dragstart zoomstart click', handleMapMovement);
      if (activeTooltipMarkerRef.current) {
        activeTooltipMarkerRef.current.closeTooltip();
        activeTooltipMarkerRef.current = null;
      }
    };
  }, [filters, selectedGrievanceId, onSelectGrievanceId, currentZoom, grievances, filterGroups, mapRef, markersLayerRef]);
}
