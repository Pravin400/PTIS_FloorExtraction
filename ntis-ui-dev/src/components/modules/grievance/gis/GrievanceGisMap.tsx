'use client';

/**
 * Grievance GIS Map Coordinator Component
 * Standard: Clean Architecture / ntis-ui
 * Orchestrates Google Hybrid base tiles, dynamic boundaries, and spatial markers.
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/styles/grievance/gis.css';
import { Plus, Minus } from 'lucide-react';
import type {
  GisGrievanceQueryParameters,
  GisCorporationConfigDto,
  GisLayerItemDto,
  GisGrievanceFilterGroupDto,
} from '@/types/grievance/grievance-gis.types';
import type { PublicGrievanceApplication } from '@/types/grievance/public-dashboard.types';
import { identifyGrievanceAtPointAction } from '@/lib/actions/grievance/gis/grievance-gis.actions';
import { useGisBoundaries } from '@/hooks/grievance/gis/useGisBoundaries';
import { useGisMarkers } from '@/hooks/grievance/gis/useGisMarkers';

interface GrievanceGisMapProps {
  filters: GisGrievanceQueryParameters;
  onSelectGrievanceId: (grievanceId: number) => void;
  selectedGrievanceId?: number;
  config?: GisCorporationConfigDto | null;
  layers?: GisLayerItemDto[];
  grievances?: PublicGrievanceApplication[];
  filterGroups?: GisGrievanceFilterGroupDto[];
  className?: string;
}

export function GrievanceGisMap({
  filters,
  onSelectGrievanceId,
  selectedGrievanceId,
  config,
  layers,
  grievances,
  filterGroups,
  className = '',
}: GrievanceGisMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(config?.defaultZoom || 12);

  // Initialize Leaflet Map with dedicated Boundary and Marker Panes
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !config) return;

    const initialCenter: [number, number] = [
      Number(config.defaultCenterLat),
      Number(config.defaultCenterLng),
    ];
    const initialZoom = Number(config.defaultZoom);

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: Number(config.minZoom),
      maxZoom: Number(config.maxZoom),
      zoomControl: false,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    if (!map.getPane('wardBoundariesPane')) {
      const wardPane = map.createPane('wardBoundariesPane');
      wardPane.style.zIndex = '640';
      wardPane.style.pointerEvents = 'none';
    }
    if (!map.getPane('zoneBoundariesPane')) {
      const zonePane = map.createPane('zoneBoundariesPane');
      zonePane.style.zIndex = '660';
      zonePane.style.pointerEvents = 'none';
    }
    if (map.getPane('markerPane')) {
      map.getPane('markerPane')!.style.zIndex = '700';
    }
    if (map.getPane('tooltipPane')) {
      map.getPane('tooltipPane')!.style.zIndex = '850';
    }

    baseTileLayerRef.current = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
      }
    ).addTo(map);

    layersGroupRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await identifyGrievanceAtPointAction(lat, lng, 50);
        if (res.success && res.data) {
          const item = res.data as { grievanceId?: number; id?: number };
          const gid = item.grievanceId ?? item.id;
          if (gid) {
            onSelectGrievanceId(Number(gid));
          }
        }
      } catch (err) {
        console.error('Spatial identify failed:', err);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [config, onSelectGrievanceId]);

  // Sync center/zoom when database configuration loads
  useEffect(() => {
    if (!mapRef.current || !config) return;
    if (config.defaultCenterLat && config.defaultCenterLng) {
      mapRef.current.setView(
        [Number(config.defaultCenterLat), Number(config.defaultCenterLng)],
        Number(config.defaultZoom)
      );
    }
  }, [config]);

  // Modular Hook: Dynamic Boundary Layers & Viewport Fitting
  useGisBoundaries({
    mapRef,
    layersGroupRef,
    layers,
    filters,
    filterGroups,
    grievances,
    config,
  });

  // Modular Hook: Markers, Radar Beacons & Single-Instance Tooltip Manager
  useGisMarkers({
    mapRef,
    markersLayerRef,
    grievances,
    filters,
    filterGroups,
    selectedGrievanceId,
    onSelectGrievanceId,
    currentZoom,
  });

  // Smoothly center and fly to selected grievance on the map
  useEffect(() => {
    if (!mapRef.current || !selectedGrievanceId) return;
    const target = grievances?.find((g) => g.id === selectedGrievanceId);
    if (target && target.latitude && target.longitude) {
      mapRef.current.flyTo([Number(target.latitude), Number(target.longitude)], 17, {
        duration: 1.2,
      });
    }
  }, [selectedGrievanceId, grievances]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Zoom Controls - Bottom Left */}
      <div className="absolute bottom-4 left-3.5 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="w-8.5 h-8.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="w-8.5 h-8.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
