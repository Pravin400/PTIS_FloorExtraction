'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common';
import type { SurveyorInspectionItem } from '@/types/fire-audit';
import { useSurveyorPins } from '@/hooks/fire-audit/surveyor/useSurveyorPins';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  type SurveyorMapLayerType,
} from '@/lib/constants/fire-audit';
import { createSurveyorTileLayer } from '@/lib/constants/fire-audit/surveyor-tile-layers.constants';
import { SurveyorMapLayerSwitcher } from './map/SurveyorMapLayerSwitcher';
import { SurveyorMapZoomControls } from './map/SurveyorMapZoomControls';
import { InspectionDocketDrawer } from './InspectionDocketDrawer';

const STATUS_LABELS: Record<string, string> = {
  overdue: 'Overdue',
  due_today: 'Due Today',
  dueToday: 'Due Today',
  assigned: 'Assigned',
  pending: 'Pending',
  re_inspection: 'Re-Inspection',
  reInspection: 'Re-Inspection',
  completed: 'Completed',
  in_progress: 'In Progress',
};

export interface SurveyorMapViewProps {
  inspections?: SurveyorInspectionItem[];
}

export function SurveyorMapView({ inspections = [] }: SurveyorMapViewProps) {
  const t = useTranslations('fireAuditSurveyor.map');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramStatus = searchParams.get('status');

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [markersLayer, setMarkersLayer] = useState<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<SurveyorMapLayerType>('default');
  const [selectedInspection, setSelectedInspection] = useState<SurveyorInspectionItem | null>(null);

  // Filter pins based on active status URL search param
  const filteredPins = useMemo(() => {
    if (!paramStatus) return inspections;
    return inspections.filter((pin) => pin.status === paramStatus);
  }, [inspections, paramStatus]);

  // Clear active filter
  const handleClearFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    mapRef.current = map;
    const markers = L.layerGroup().addTo(map);
    setMarkersLayer(markers);
    setMapInstance(map);

    const initTimer = setTimeout(() => {
      if (mapContainerRef.current?.clientWidth && mapContainerRef.current?.clientHeight) {
        map.invalidateSize({ pan: false });
      }
    }, 150);

    // Broadcast map motion to shrink floating dock
    let idleTimer: NodeJS.Timeout | null = null;
    map.on('movestart', () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.dispatchEvent(new CustomEvent('ntis:map-moving', { detail: { isMoving: true } }));
    });
    map.on('moveend', () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ntis:map-moving', { detail: { isMoving: false } }));
      }, 1500);
    });

    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    if (mapContainerRef.current) ro.observe(mapContainerRef.current);

    return () => {
      clearTimeout(initTimer);
      if (idleTimer) clearTimeout(idleTimer);
      ro.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMarkersLayer(null);
      setMapInstance(null);
    };
  }, []);

  // Handle Layer switching
  useEffect(() => {
    if (!mapInstance || !mapInstance.getContainer() || !(mapInstance as unknown as { _panes?: unknown })._panes) return;
    if (baseTileLayerRef.current) {
      baseTileLayerRef.current.remove();
      baseTileLayerRef.current = null;
    }
    const layer = createSurveyorTileLayer(activeLayer);
    layer.addTo(mapInstance);
    baseTileLayerRef.current = layer;

    return () => {
      if (baseTileLayerRef.current) {
        baseTileLayerRef.current.remove();
        baseTileLayerRef.current = null;
      }
    };
  }, [mapInstance, activeLayer]);

  // Decomposed Pin Lifecycle & Camera Controller Hook
  const { handleRecenter } = useSurveyorPins({
    map: mapInstance,
    markersLayer,
    filteredPins,
    selectedInspectionId: selectedInspection?.id,
    onSelectInspection: setSelectedInspection,
  });

  const handleZoomIn = useCallback(() => mapInstance?.zoomIn(), [mapInstance]);
  const handleZoomOut = useCallback(() => mapInstance?.zoomOut(), [mapInstance]);

  return (
    <section
      aria-label="Survey Map View"
      className="relative w-full h-full min-h-0 flex-1 rounded-none lg:rounded-3xl border-0 lg:border border-slate-300/80 shadow-none lg:shadow-[0_6px_24px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] overflow-hidden bg-slate-100 select-none"
    >
      {/* Headless Leaflet DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Active Status Filter Pill */}
      {paramStatus && (
        <div className="absolute top-43 sm:top-45 lg:top-3 left-2.5 lg:left-3 z-20 pointer-events-auto inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-[0_4px_12px_rgba(15,23,42,0.2)] text-white animate-in fade-in">
          <span className="text-xs font-medium">
            {t('activeFilter', { status: STATUS_LABELS[paramStatus] || paramStatus })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            icon={X}
            onClick={handleClearFilter}
            aria-label="Clear active filter"
            className="h-5! w-5! p-0! rounded-full text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
          />
        </div>
      )}

      {/* Top Right: Collapsible 3-Thumbnail Layer Switcher */}
      <SurveyorMapLayerSwitcher
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
        className="absolute top-43 sm:top-45 lg:top-3 right-2.5 lg:right-3 z-30 pointer-events-auto"
      />

      {/* Bottom Right: Zoom & Recenter Controls */}
      <SurveyorMapZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRecenter={handleRecenter}
        className="absolute bottom-20 lg:bottom-4 right-3 z-20 pointer-events-auto"
      />

      {/* Empty State Banner if no inspections match */}
      {filteredPins.length === 0 && (
        <div className="absolute inset-x-4 top-44 sm:top-48 lg:top-20 z-20 max-w-sm mx-auto p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-xs text-slate-700 font-medium">{t('noInspections')}</div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleClearFilter}
            className="ml-auto text-xs font-bold text-orange-600! hover:text-orange-700! cursor-pointer h-auto! p-0! hover:bg-transparent"
          >
            {t('showingAll')}
          </Button>
        </div>
      )}

      {/* Selected Inspection Docket Drawer */}
      <InspectionDocketDrawer
        inspection={selectedInspection}
        onClose={() => setSelectedInspection(null)}
      />
    </section>
  );
}
