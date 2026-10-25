'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { logger } from '@/lib/utils/logger';
import { WAYBACK_MAP_TILE_URL, type WaybackRelease } from '@/lib/api/wayback.service';

interface HistoricalPingPongControllerProps {
  map: L.Map | null;
  releases: WaybackRelease[];
  activeYear: number;
  lat?: number;
  lng?: number;
  onLoadChange?: (loading: boolean) => void;
  playing: boolean;
  speed: number;
  onActiveYearChange?: (year: number) => void;
  onStopPlaying?: () => void;
  onReleaseError?: (releaseId: number) => void;
}
const mapTileLayersCache = new WeakMap<L.Map, Map<number, L.TileLayer>>();
const getMapCache = (map: L.Map): Map<number, L.TileLayer> => {
  if (!mapTileLayersCache.has(map)) mapTileLayersCache.set(map, new Map());
  return mapTileLayersCache.get(map)!;
};

export function HistoricalPingPongController({
  map,
  releases,
  activeYear,
  lat,
  lng,
  onLoadChange,
  playing,
  speed,
  onActiveYearChange,
  onStopPlaying,
  onReleaseError,
}: HistoricalPingPongControllerProps): null {
  const years = useMemo(() => releases.map((r) => r.year), [releases]);
  const lruOrderRef = useRef<number[]>([]);
  const layerLoadingStateRef = useRef<Map<number, boolean>>(new Map());
  const loopRef = useRef<number | null>(null);
  const stateRef = useRef({ playing, speed, years, activeYear, onActiveYearChange, onStopPlaying, onReleaseError });
  useEffect(() => {
    stateRef.current = { playing, speed, years, activeYear, onActiveYearChange, onStopPlaying, onReleaseError };
  }, [playing, speed, years, activeYear, onActiveYearChange, onStopPlaying, onReleaseError]);
  useEffect(() => {
    if (!map) return;
    const cache = getMapCache(map);
    cache.forEach((layer) => map.hasLayer(layer) && map.removeLayer(layer));
    cache.clear();
    lruOrderRef.current = [];
    layerLoadingStateRef.current.clear();
  }, [map, lat, lng]);
  const updateLoadingState = useCallback(() => {
    if (!onLoadChange || stateRef.current.years.length === 0) return;
    const active = stateRef.current.activeYear;
    const idx = stateRef.current.years.indexOf(active);
    if (idx === -1) return;
    const next = idx < stateRef.current.years.length - 1 ? stateRef.current.years[idx + 1] : null;
    onLoadChange(!!layerLoadingStateRef.current.get(active) || (next !== null && !!layerLoadingStateRef.current.get(next)));
  }, [onLoadChange]);

  const getOrCreateLayer = useCallback((year: number): L.TileLayer => {
    if (!map) return L.tileLayer('');
    const cache = getMapCache(map);
    let layer = cache.get(year);
    if (!layer) {
      const release = releases.find((r) => r.year === year);
      const releaseId = release?.releaseId ?? 0;
      layer = L.tileLayer(WAYBACK_MAP_TILE_URL(releaseId), {
        maxNativeZoom: 19,
        maxZoom: 21,
        keepBuffer: 16,
        updateWhenIdle: false,
        updateWhenZooming: true,
        className: 'timelapse-tile-layer',
        attribution: '© Esri, Wayback, Maxar',
      });

      const layerWithCreateTile = layer as unknown as {
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

      const setLoad = (loading: boolean) => {
        layerLoadingStateRef.current.set(year, loading);
        updateLoadingState();
      };
      layer.on('loading', () => setLoad(true));
      layer.on('load', () => setLoad(false));
      layer.on('tileerror', () => {
        setLoad(false);
        if (stateRef.current.onReleaseError && releaseId) stateRef.current.onReleaseError(releaseId);
      });
      cache.set(year, layer);
    }
    return layer;
  }, [map, releases, updateLoadingState]);

  useEffect(() => {
    if (!map || !map.getContainer()) return;
    const cache = getMapCache(map);

    if (years.length === 0) {
      const fallbackLayerUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      let layer = cache.get(-1);
      if (!layer) {
        layer = L.tileLayer(fallbackLayerUrl, {
          maxZoom: 21,
          attribution: '© Esri',
        });
        // Set loading="eager" on fallback tiles to avoid LCP warnings
        const layerWithCreateTile = layer as unknown as {
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
        cache.set(-1, layer);
      }
      if (!map.hasLayer(layer)) {
        layer.addTo(map);
      }
      layer.setOpacity(1.0);

      // Clear all other Wayback layers from map and cache to prevent stale overlay
      cache.forEach((l, y) => {
        if (y !== -1) {
          if (map.hasLayer(l)) {
            map.removeLayer(l);
          }
          layerLoadingStateRef.current.delete(y);
        }
      });
      for (const key of Array.from(cache.keys())) {
        if (key !== -1) {
          cache.delete(key);
        }
      }
      updateLoadingState();
      return;
    }

    // Clean up fallback layer if switching back to Wayback releases
    const fallbackLayer = cache.get(-1);
    if (fallbackLayer) {
      if (map.hasLayer(fallbackLayer)) {
        map.removeLayer(fallbackLayer);
      }
      cache.delete(-1);
    }

    const activeIdx = years.indexOf(activeYear);
    if (activeIdx === -1) return;

    // Prefetch ±2 adjacent years for smoother transitions
    const adjacentYears: number[] = [];
    for (let offset = -2; offset <= 2; offset++) {
      const idx = activeIdx + offset;
      if (idx >= 0 && idx < years.length && idx !== activeIdx) {
        adjacentYears.push(years[idx]);
      }
    }

    try {
      const activeLayer = getOrCreateLayer(activeYear);
      activeLayer.setOpacity(1.0);
      if (typeof (activeLayer as unknown as { setZIndex: (z: number) => void }).setZIndex === 'function') {
        (activeLayer as unknown as { setZIndex: (z: number) => void }).setZIndex(100);
      }
      if (!map.hasLayer(activeLayer)) {
        activeLayer.addTo(map);
      }

      // Explicitly remove all non-active year tile layers from map so previous maps never linger
      cache.forEach((layer, y) => {
        if (y !== activeYear && y !== -1) {
          if (map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
          if (layerLoadingStateRef.current.get(y)) {
            layerLoadingStateRef.current.set(y, false);
          }
        }
      });

      const idx = lruOrderRef.current.indexOf(activeYear);
      if (idx !== -1) lruOrderRef.current.splice(idx, 1);
      lruOrderRef.current.push(activeYear);

      while (lruOrderRef.current.length > 15) {
        const oldest = lruOrderRef.current.shift();
        if (oldest !== undefined && oldest !== stateRef.current.activeYear) {
          const oldLayer = cache.get(oldest);
          if (oldLayer) {
            oldLayer.off();
            if (map.hasLayer(oldLayer)) map.removeLayer(oldLayer);
            cache.delete(oldest);
            layerLoadingStateRef.current.delete(oldest);
          }
        }
      }
      updateLoadingState();
    } catch (err) {
      logger.error('Error updating map layers in controller', { error: err as Error });
    }
  }, [map, activeYear, years, getOrCreateLayer, updateLoadingState]);

  useEffect(() => {
    if (!playing) {
      if (loopRef.current) { clearTimeout(loopRef.current); loopRef.current = null; }
      return;
    }

    let active = true;
    const run = async () => {
      if (!active || !stateRef.current.playing) return;
      const currentYear = stateRef.current.activeYear;
      const currentIdx = stateRef.current.years.indexOf(currentYear);
      if (currentIdx === -1) return;

      await new Promise((resolve) => {
        loopRef.current = setTimeout(resolve, stateRef.current.speed) as unknown as number;
      });

      if (!active || !stateRef.current.playing) return;

      if (stateRef.current.activeYear !== currentYear) { run(); return; }

      if (layerLoadingStateRef.current.get(currentYear)) {
        await new Promise<void>((resolve) => {
          const startTime = Date.now();
          const check = () => {
            const timePassed = Date.now() - startTime;
            if (!active || !stateRef.current.playing || !layerLoadingStateRef.current.get(currentYear) || timePassed > 1500) {
              resolve();
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      }

      if (!active || !stateRef.current.playing) return;

      if (stateRef.current.activeYear !== currentYear) { run(); return; }

      const nextIdx = currentIdx + 1;
      if (nextIdx >= stateRef.current.years.length) { stateRef.current.onStopPlaying?.(); return; }
      stateRef.current.onActiveYearChange?.(stateRef.current.years[nextIdx]);
      run();
    };

    run();

    return () => {
      active = false;
      if (loopRef.current) { clearTimeout(loopRef.current); loopRef.current = null; }
    };
  }, [playing]);

  return null;
}
