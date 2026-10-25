'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { type WaybackRelease } from '@/lib/api/wayback.service';
import { HistoricalPingPongController } from './HistoricalPingPongController';

interface LeafletDefaultIconPrototype {
  _getIconUrl?: () => string;
}

interface TimelapseMapProps {
  lat: number;
  lng: number;
  activeRelease: WaybackRelease | null;
  showLabels: boolean;
  playing: boolean;
  speed: number;
  waybackReleases: WaybackRelease[];
  onLoadChange: (loading: boolean) => void;
  onActiveYearChange: (year: number) => void;
  onReleaseError?: (releaseId: number) => void;
  onStopPlaying?: () => void;
}

const LABELS_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

/**
 * Module-level singletons — intentional design for Leaflet map lifecycle.
 * Leaflet maps cannot be destroyed/recreated during React drawer transitions
 * without causing DOM leaks and flickering. Only ONE TimelapseMap instance
 * may be mounted at a time (enforced by the PhotoPlan drawer architecture).
 */
let cachedMapContainer: HTMLDivElement | null = null;
let cachedMapInstance: L.Map | null = null;
let cachedLabelsLayer: L.TileLayer | null = null;
let cachedMarker: L.CircleMarker | null = null;
let cachedHighlight: L.Rectangle | null = null;
let mountCount = 0;

export const TimelapseMap = React.memo(function TimelapseMap({
  lat,
  lng,
  activeRelease,
  showLabels,
  playing,
  speed,
  waybackReleases,
  onLoadChange,
  onActiveYearChange,
  onReleaseError,
  onStopPlaying,
}: TimelapseMapProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const initRef = useRef({ lat, lng, showLabels });

  useEffect(() => {
    mountCount++;
    if (mountCount > 1) console.warn('[TimelapseMap] Multiple instances detected — singleton pattern expects exactly one.');
    return () => { mountCount--; };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const initial = initRef.current;

    if (!cachedMapContainer) {
      const DefaultIcon = L.Icon.Default as unknown as { prototype: LeafletDefaultIconPrototype };
      delete DefaultIcon.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      cachedMapContainer = document.createElement('div');
      cachedMapContainer.className = 'absolute inset-0 w-full h-full';
      const map = L.map(cachedMapContainer, {
        zoomControl: true, zoomAnimation: true, fadeAnimation: true,
        minZoom: 15, maxZoom: 21, scrollWheelZoom: false,
        doubleClickZoom: false, touchZoom: false, attributionControl: false,
      }).setView([initial.lat, initial.lng], 17);
      map.scrollWheelZoom.disable(); map.doubleClickZoom.disable(); map.touchZoom.disable();
      const tapMap = map as unknown as { tap?: { disable: () => void } };
      if (tapMap.tap) tapMap.tap.disable();

      cachedMapInstance = map;

      cachedLabelsLayer = L.tileLayer(LABELS_URL, {
        maxNativeZoom: 19, maxZoom: 21, opacity: 0.9, keepBuffer: 12, attribution: 'Labels © Esri',
      });
      const layerWithCreateTile = cachedLabelsLayer as unknown as {
        createTile: (coords: L.Coords, done: L.DoneCallback) => HTMLElement;
      };
      const originalCreateTile = layerWithCreateTile.createTile;
      layerWithCreateTile.createTile = function (coords: L.Coords, done: L.DoneCallback) {
        const tile = originalCreateTile.call(this, coords, done) as HTMLImageElement;
        tile.setAttribute('fetchpriority', 'high');
        tile.setAttribute('loading', 'eager');
        tile.setAttribute('decoding', 'async');
        return tile;
      };
      if (initial.showLabels) cachedLabelsLayer.addTo(map);

      cachedMarker = L.circleMarker([initial.lat, initial.lng], { radius: 6, color: '#ff2200', fillColor: '#ff3300', fillOpacity: 1, weight: 2 }).addTo(map);

      cachedHighlight = L.rectangle([[initial.lat - 0.0005, initial.lng - 0.0005], [initial.lat + 0.0005, initial.lng + 0.0005]], {
        color: '#ff2200', weight: 2.5, opacity: 0.9, fillColor: '#ff5500', fillOpacity: 0.07, className: 'property-highlight',
      }).addTo(map);
    }

    containerRef.current.appendChild(cachedMapContainer);
    setMapInstance(cachedMapInstance);

    const resizeObserver = new ResizeObserver(() => cachedMapInstance?.invalidateSize());
    resizeObserver.observe(containerRef.current);
    const timer = setTimeout(() => cachedMapInstance?.invalidateSize(), 100);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (cachedMapContainer && cachedMapContainer.parentNode) {
        cachedMapContainer.parentNode.removeChild(cachedMapContainer);
      }
      setMapInstance(null);
    };
  }, []);

  useEffect(() => {
    if (!mapInstance || !(mapInstance as unknown as { _container?: HTMLElement })._container) return;
    let active = true;

    const timer = setTimeout(() => {
      if (!active) return;
      try {
        mapInstance.invalidateSize({ animate: false });
        mapInstance.setView([lat, lng], 17);

        const boundsPadding = 0.05;
        const maxBounds = L.latLngBounds(
          [lat - boundsPadding, lng - boundsPadding],
          [lat + boundsPadding, lng + boundsPadding]
        );
        mapInstance.setMaxBounds(maxBounds);

        if (cachedMarker) cachedMarker.setLatLng([lat, lng]);

        const delta = 0.0005;
        if (cachedHighlight) {
          cachedHighlight.setBounds([
            [lat - delta, lng - delta],
            [lat + delta, lng + delta],
          ]);
        }
      } catch {
        // Safe fallback
      }
    }, 50);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [mapInstance, lat, lng]);

  useEffect(() => {
    if (!mapInstance || !(mapInstance as unknown as { _container?: HTMLElement })._container || !cachedLabelsLayer) return;

    try {
      if (showLabels && !playing) {
        if (!mapInstance.hasLayer(cachedLabelsLayer)) {
          cachedLabelsLayer.addTo(mapInstance);
        }
        cachedLabelsLayer.bringToFront();
        if (cachedHighlight) cachedHighlight.bringToFront();
      } else {
        if (mapInstance.hasLayer(cachedLabelsLayer)) {
          mapInstance.removeLayer(cachedLabelsLayer);
        }
      }
    } catch {
      // Safe fallback
    }
  }, [mapInstance, showLabels, playing]);

  return (
    <>
      <style>{`.timelapse-tile-layer { transition: opacity 0.5s ease-in-out !important; }`}</style>
      <div ref={containerRef} className="absolute inset-0 w-full h-full border border-slate-700 rounded-lg overflow-hidden bg-slate-950" />
      <HistoricalPingPongController
        map={mapInstance}
        releases={waybackReleases}
        activeYear={activeRelease?.year ?? 0}
        lat={lat}
        lng={lng}
        onLoadChange={onLoadChange}
        playing={playing}
        speed={speed}
        onActiveYearChange={onActiveYearChange}
        onStopPlaying={onStopPlaying}
        onReleaseError={onReleaseError}
      />
    </>
  );
});
