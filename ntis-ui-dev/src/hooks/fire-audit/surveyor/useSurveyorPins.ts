import { useCallback, useEffect } from 'react';
import L from 'leaflet';
import type { SurveyorInspectionItem } from '@/types/fire-audit';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  isValidCoord,
} from '@/lib/constants/fire-audit';
import { createSurveyorMarkerIcon } from '@/lib/constants/fire-audit/surveyor-marker-icons.constants';

export interface UseSurveyorPinsOptions {
  map: L.Map | null;
  markersLayer: L.LayerGroup | null;
  filteredPins: SurveyorInspectionItem[];
  selectedInspectionId?: string;
  onSelectInspection: (pin: SurveyorInspectionItem) => void;
}

export function useSurveyorPins({
  map,
  markersLayer,
  filteredPins,
  selectedInspectionId,
  onSelectInspection,
}: UseSurveyorPinsOptions) {
  // Drawer-aware Offset Pan: flies camera so selected pin is centered in remaining visible canvas
  const handleSelectPin = useCallback(
    (pin: SurveyorInspectionItem) => {
      window.dispatchEvent(
        new CustomEvent('ntis:map-moving', { detail: { isMoving: false } })
      );
      onSelectInspection(pin);

      if (!map) return;
      const targetZoom = Math.max(map.getZoom(), 15);
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
      const targetPoint = map.project([pin.latitude, pin.longitude], targetZoom);
      const offsetPoint = isDesktop
        ? targetPoint.add([190, 0])
        : targetPoint.add([0, 140]);

      const offsetLatLng = map.unproject(offsetPoint, targetZoom);
      map.flyTo(offsetLatLng, targetZoom, {
        duration: 0.85,
        easeLinearity: 0.25,
      });
    },
    [map, onSelectInspection]
  );

  // Renders individual status squircle pins matching KPI cards
  const renderMarkers = useCallback(() => {
    if (!map || !markersLayer) return;
    markersLayer.clearLayers();

    const validPins = filteredPins.filter((pin) =>
      isValidCoord(pin.latitude, pin.longitude)
    );

    const coordCounts = new Map<string, number>();
    validPins.forEach((pin) => {
      const key = `${pin.latitude.toFixed(5)},${pin.longitude.toFixed(5)}`;
      coordCounts.set(key, (coordCounts.get(key) || 0) + 1);
    });

    validPins.forEach((pin) => {
      const key = `${pin.latitude.toFixed(5)},${pin.longitude.toFixed(5)}`;
      const coLocatedCount = coordCounts.get(key) || 1;
      const isSelected = selectedInspectionId === pin.id;
      const markerIcon = createSurveyorMarkerIcon(
        pin.status,
        isSelected,
        coLocatedCount > 1 ? coLocatedCount : undefined
      );

      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: markerIcon,
        riseOnHover: true,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.on('click', () => handleSelectPin(pin));
      markersLayer.addLayer(marker);
    });
  }, [map, markersLayer, filteredPins, selectedInspectionId, handleSelectPin]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  // Synchronize camera bounds when filteredPins changes
  useEffect(() => {
    if (!map) return;
    const validPins = filteredPins.filter((pin) =>
      isValidCoord(pin.latitude, pin.longitude)
    );

    const syncBounds = () => {
      map.invalidateSize({ pan: false });
      if (validPins.length > 0) {
        const bounds = L.latLngBounds(
          validPins.map((p) => [p.latitude, p.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      } else {
        map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
      }
    };

    requestAnimationFrame(syncBounds);
    const timer = setTimeout(syncBounds, 250);
    return () => clearTimeout(timer);
  }, [map, filteredPins]);

  // Recenter camera view to encompass active pins
  const handleRecenter = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('ntis:map-moving', { detail: { isMoving: false } })
    );
    if (!map) return;
    map.invalidateSize({ pan: false });
    const validPins = filteredPins.filter((pin) =>
      isValidCoord(pin.latitude, pin.longitude)
    );

    if (validPins.length > 0) {
      const bounds = L.latLngBounds(
        validPins.map((p) => [p.latitude, p.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    } else {
      map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
    }
  }, [map, filteredPins]);

  return { handleSelectPin, handleRecenter };
}
