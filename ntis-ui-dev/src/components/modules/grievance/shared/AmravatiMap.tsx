'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AMRAVATI_CENTER,
  AMRAVATI_DEFAULT_ZOOM,
  AMRAVATI_BOUNDARY_COORDS,
  CIVIC_CITY_CONFIG,
  type CivicCityConfig,
} from '@/lib/constants/grievance';
import type { IssueCategory, MapMarker } from '@/types/grievance';
import {
  createCategoryMarkerIcon,
  createActiveRedMarkerIcon,
} from './map/map-marker-icons';
import { SCREENSHOT_PINS, isValidCoord, isValidPoint } from './map/map-pins.data';
import { createBaseTileLayer } from './map/map-tile-layers';

export { SCREENSHOT_PINS };

export type MapLayerType = 'default' | 'satellite' | 'terrain';

export interface AmravatiMapProps {
  activeCategory: IssueCategory;
  selectedPinId?: string | null;
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  activeLayer?: MapLayerType;
  showBoundary?: boolean;
  cityConfig?: CivicCityConfig;
  useIframe?: boolean;
}

export interface AmravatiMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  locateMe: () => void;
  panTo: (lat: number, lng: number) => void;
}

export const AmravatiMap = React.forwardRef<AmravatiMapHandle, AmravatiMapProps>(
  (
    {
      activeCategory,
      selectedPinId,
      onMarkerClick,
      className = '',
      activeLayer = 'default',
      showBoundary = true,
      cityConfig = CIVIC_CITY_CONFIG,
      useIframe = false,
    },
    ref
  ) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const baseTileLayerRef = useRef<L.TileLayer | null>(null);
    const boundaryPolygonRef = useRef<L.Polygon | null>(null);
    const initialCenterRef = useRef(cityConfig?.center);
    const initialZoomRef = useRef(cityConfig?.zoom);
    const showBoundaryRef = useRef(showBoundary);
    showBoundaryRef.current = showBoundary;

    // Initialize map
    useEffect(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      if (mapContainerRef.current.clientWidth === 0 || mapContainerRef.current.clientHeight === 0) {
        return;
      }

      const initialCenter = initialCenterRef.current;
      const initialZoom = initialZoomRef.current;
      const safeCenter: [number, number] =
        initialCenter && isValidPoint(initialCenter)
          ? initialCenter
          : isValidPoint(AMRAVATI_CENTER)
          ? AMRAVATI_CENTER
          : [20.9374, 77.7796];
      const safeZoom = initialZoom || AMRAVATI_DEFAULT_ZOOM || 13;

      const map = L.map(mapContainerRef.current, {
        center: safeCenter,
        zoom: safeZoom,
        zoomControl: false,
        attributionControl: false,
        trackResize: false,
      });

      baseTileLayerRef.current = createBaseTileLayer('default').addTo(map);

      const initTimer = setTimeout(() => {
        if (
          mapContainerRef.current &&
          mapContainerRef.current.clientWidth > 0 &&
          mapContainerRef.current.clientHeight > 0
        ) {
          map.invalidateSize();
        }
      }, 150);

      let resizeObserver: ResizeObserver | null = null;
      if (typeof window !== 'undefined' && 'ResizeObserver' in window && mapContainerRef.current) {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0 && mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      const safePolygon = Array.isArray(AMRAVATI_BOUNDARY_COORDS)
        ? AMRAVATI_BOUNDARY_COORDS.filter(isValidPoint)
        : [];
      if (safePolygon.length >= 3) {
        boundaryPolygonRef.current = L.polygon(safePolygon, {
          color: '#C084FC',
          weight: 2,
          opacity: 0.85,
          fillColor: '#DDD6FE',
          fillOpacity: 0.05,
          dashArray: '4, 4',
        });
        if (showBoundaryRef.current) {
          boundaryPolygonRef.current.addTo(map);
        }
      }

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      return () => {
        clearTimeout(initTimer);
        resizeObserver?.disconnect();
        map.remove();
        mapInstanceRef.current = null;
      };
    }, []);

    // Dynamically switch base tile layer
    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (baseTileLayerRef.current) {
        map.removeLayer(baseTileLayerRef.current);
        baseTileLayerRef.current = null;
      }

      baseTileLayerRef.current = createBaseTileLayer(activeLayer).addTo(map);
    }, [activeLayer]);

    // Dynamically toggle Ward Boundary polygon
    useEffect(() => {
      const map = mapInstanceRef.current;
      const poly = boundaryPolygonRef.current;
      if (!map || !poly) return;

      if (showBoundary) {
        if (!map.hasLayer(poly)) poly.addTo(map);
      } else {
        if (map.hasLayer(poly)) map.removeLayer(poly);
      }
    }, [showBoundary]);

    // Smoothly pan/fly map to selected pin whenever selectedPinId changes
    useEffect(() => {
      if (!selectedPinId || !mapInstanceRef.current) return;
      const targetPin = SCREENSHOT_PINS.find((p) => p.id === selectedPinId);
      if (targetPin && isValidCoord(targetPin.lat) && isValidCoord(targetPin.lng)) {
        mapInstanceRef.current.flyTo([targetPin.lat, targetPin.lng], 15, {
          duration: 0.9,
          easeLinearity: 0.25,
        });
      }
    }, [selectedPinId]);

    // Update markers based on active category & selected pin
    useEffect(() => {
      if (!markersLayerRef.current || !mapInstanceRef.current) return;

      markersLayerRef.current.clearLayers();

      const filteredPins =
        activeCategory === 'all'
          ? SCREENSHOT_PINS
          : SCREENSHOT_PINS.filter((p) => p.category === activeCategory);

      filteredPins.forEach((pin) => {
        if (!isValidCoord(pin.lat) || !isValidCoord(pin.lng)) return;

        const isSelected = pin.id === selectedPinId;
        const marker = L.marker([pin.lat, pin.lng], {
          icon: isSelected
            ? createActiveRedMarkerIcon(pin.type)
            : createCategoryMarkerIcon(pin.type),
          zIndexOffset: isSelected ? 2000 : 100,
        });

        marker.on('click', () => {
          if (isValidCoord(pin.lat) && isValidCoord(pin.lng)) {
            mapInstanceRef.current?.flyTo([pin.lat, pin.lng], 15, {
              duration: 0.9,
              easeLinearity: 0.25,
            });
          }
          onMarkerClick?.({
            id: pin.id,
            lat: pin.lat,
            lng: pin.lng,
            category: pin.category,
            title: pin.title,
            status: 'pending',
          });
        });

        marker.bindTooltip(`<strong>${pin.title}</strong>`, {
          direction: 'top',
          offset: [0, isSelected ? -26 : -18],
          className: 'text-xs rounded-lg shadow-sm',
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }, [activeCategory, selectedPinId, onMarkerClick]);

    // Imperative map controls
    const zoomIn = useCallback(() => mapInstanceRef.current?.zoomIn(), []);
    const zoomOut = useCallback(() => mapInstanceRef.current?.zoomOut(), []);
    const locateMe = useCallback(() => {
      if (!mapInstanceRef.current) return;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (isValidCoord(pos.coords.latitude) && isValidCoord(pos.coords.longitude)) {
              mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 15, {
                duration: 1.2,
              });
            }
          },
          () => mapInstanceRef.current?.flyTo(AMRAVATI_CENTER, AMRAVATI_DEFAULT_ZOOM, { duration: 1 })
        );
      } else {
        mapInstanceRef.current.flyTo(AMRAVATI_CENTER, AMRAVATI_DEFAULT_ZOOM, { duration: 1 });
      }
    }, []);
    const panTo = useCallback((lat: number, lng: number) => {
      if (isValidCoord(lat) && isValidCoord(lng) && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
      }
    }, []);

    React.useImperativeHandle(ref, () => ({ zoomIn, zoomOut, locateMe, panTo }), [
      zoomIn,
      zoomOut,
      locateMe,
      panTo,
    ]);

    if (useIframe) {
      const cityName = cityConfig?.name || 'Amravati, Maharashtra';
      const zoomLevel = cityConfig?.zoom || 13;
      return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>
          <iframe
            title="Google Hybrid City Map"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(cityName)}&t=h&z=${zoomLevel}&output=embed`}
            className="w-full h-full border-0 pointer-events-auto"
            loading="lazy"
            allowFullScreen
          />
        </div>
      );
    }

    return (
      <div className={`relative w-full h-full ${className}`}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>
    );
  }
);

AmravatiMap.displayName = 'AmravatiMap';
