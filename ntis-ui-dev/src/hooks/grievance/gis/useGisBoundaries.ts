import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import type {
  GisGrievanceQueryParameters,
  GisCorporationConfigDto,
  GisLayerItemDto,
  GisGrievanceFilterGroupDto,
} from '@/types/grievance/grievance-gis.types';
import type { PublicGrievanceApplication } from '@/types/grievance/public-dashboard.types';
import {
  extractWardCode,
  resolveTargetFilters,
  isWardInZone,
  computeZoneStyle,
  computeWardStyle,
  fitBoundaryView,
  createZoneLabelIcon,
} from '@/lib/utils/grievance/gis';

interface UseGisBoundariesProps {
  mapRef: React.MutableRefObject<L.Map | null>;
  layersGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  layers?: GisLayerItemDto[];
  filters: GisGrievanceQueryParameters;
  filterGroups?: GisGrievanceFilterGroupDto[];
  grievances?: PublicGrievanceApplication[];
  config?: GisCorporationConfigDto | null;
}

export function useGisBoundaries({
  mapRef,
  layersGroupRef,
  layers,
  filters,
  filterGroups,
  config,
}: UseGisBoundariesProps) {
  const zoneLabelsGroupRef = useRef<L.LayerGroup | null>(null);
  const prevFiltersRef = useRef<{ hadFilter: boolean; zoneId?: number; wardId?: number }>({
    hadFilter: false,
  });

  const parsedLayers = useMemo(() => {
    if (!layers || layers.length === 0) return [];
    return layers.map((layer) => {
      let geoData: GeoJSON.GeoJsonObject | null = null;
      let style: Record<string, unknown> = {};
      try {
        geoData = typeof layer.geoJsonData === 'string' ? JSON.parse(layer.geoJsonData) : (layer.geoJsonData as unknown as GeoJSON.GeoJsonObject);
      } catch (e) {
        console.error('Failed to parse geoJsonData for layer', layer.layerCode, e);
      }
      try {
        style = layer.styleConfigJson ? JSON.parse(layer.styleConfigJson) : {};
      } catch {}
      return { ...layer, parsedGeoJson: geoData, parsedStyle: style };
    });
  }, [layers]);

  useEffect(() => {
    if (!mapRef.current || parsedLayers.length === 0) return;

    if (layersGroupRef.current) {
      layersGroupRef.current.clearLayers();
    } else {
      layersGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    if (zoneLabelsGroupRef.current) {
      zoneLabelsGroupRef.current.clearLayers();
    } else {
      zoneLabelsGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const hasWardFilter = Boolean(filters.wardId);
    const hasZoneFilter = Boolean(filters.zoneId);
    const { targetZoneId, targetWardCode, targetWardParentZoneId } = resolveTargetFilters(
      filters,
      filterGroups
    );

    const activeZoneId = targetZoneId ?? targetWardParentZoneId;
    const wardBounds = L.latLngBounds([]);
    const zoneBounds = L.latLngBounds([]);

    // 1. Render Ward Boundaries Layer (wardBoundariesPane, yellow internal lines from DB)
    const wardLayerItem = parsedLayers.find(
      (l) => l.layerCode === 'WARD_BOUNDARY_LAYER' || l.layerName?.toLowerCase().includes('ward')
    );
    if (wardLayerItem?.parsedGeoJson) {
      try {
        const wardGeoJson = L.geoJSON(wardLayerItem.parsedGeoJson, {
          pane: 'wardBoundariesPane',
          filter: (feature) => {
            const wardCode = extractWardCode(feature.properties);
            if (!wardCode) return false;
            if (hasWardFilter) {
              return Boolean(targetWardCode && wardCode === targetWardCode);
            }
            if (hasZoneFilter && targetZoneId) {
              return isWardInZone(wardCode, targetZoneId, filterGroups);
            }
            return true;
          },
          style: (feature) => {
            const wardCode = extractWardCode(feature?.properties);
            const isSelectedWard = Boolean(hasWardFilter && targetWardCode && wardCode === targetWardCode);
            return computeWardStyle(wardLayerItem.parsedStyle, isSelectedWard);
          },
          onEachFeature: (feature, layer) => {
            const wardCode = extractWardCode(feature?.properties);
            const isSelectedWard = Boolean(hasWardFilter && targetWardCode && wardCode === targetWardCode);
            if (isSelectedWard && 'getBounds' in layer && typeof (layer as { getBounds: () => L.LatLngBounds }).getBounds === 'function') {
              wardBounds.extend((layer as { getBounds: () => L.LatLngBounds }).getBounds());
            }
          },
        });
        wardGeoJson.addTo(layersGroupRef.current!);
      } catch (err) {
        console.error('Error rendering ward boundary layer:', err);
      }
    }

    // 2. Render Zone Boundaries Layer (zoneBoundariesPane, dynamic 5 zone colors from DB)
    const zoneLayerItem = parsedLayers.find(
      (l) => l.layerCode === 'ZONE_BOUNDARY_LAYER' || l.layerName?.toLowerCase().includes('zone')
    );
    if (zoneLayerItem?.parsedGeoJson) {
      try {
        const zoneGeoJson = L.geoJSON(zoneLayerItem.parsedGeoJson, {
          pane: 'zoneBoundariesPane',
          filter: (feature) => {
            const zid = Number(feature.properties?.zoneId ?? feature.properties?.ZoneId ?? feature.properties?.id);
            if (activeZoneId) {
              return zid === activeZoneId;
            }
            return true;
          },
          style: (feature) => {
            const zid = Number(feature?.properties?.zoneId ?? feature?.properties?.ZoneId);
            const isSelectedZone = Boolean(activeZoneId && zid === activeZoneId);
            return computeZoneStyle(feature, filterGroups, isSelectedZone);
          },
          onEachFeature: (feature, layer) => {
            const zid = Number(feature?.properties?.zoneId ?? feature?.properties?.ZoneId);
            const isSelectedZone = Boolean(activeZoneId && zid === activeZoneId);
            if ('getBounds' in layer && typeof (layer as { getBounds: () => L.LatLngBounds }).getBounds === 'function') {
              const bounds = (layer as { getBounds: () => L.LatLngBounds }).getBounds();
              if (isSelectedZone) {
                zoneBounds.extend(bounds);
              }
              const labelName = feature.properties?.name || feature.properties?.zoneNo || `Zone ${zid}`;
              const labelMarker = L.marker(bounds.getCenter(), {
                icon: createZoneLabelIcon(labelName),
                interactive: false,
              });
              zoneLabelsGroupRef.current?.addLayer(labelMarker);
            }
          },
        });
        zoneGeoJson.addTo(layersGroupRef.current!);
      } catch (err) {
        console.error('Error rendering zone boundary layer:', err);
      }
    }

    fitBoundaryView(
      mapRef.current,
      hasWardFilter,
      hasZoneFilter,
      wardBounds,
      zoneBounds,
      prevFiltersRef.current.hadFilter,
      config
    );

    prevFiltersRef.current = {
      hadFilter: hasWardFilter || hasZoneFilter,
      zoneId: filters.zoneId,
      wardId: filters.wardId,
    };
  }, [
    parsedLayers,
    filters,
    config,
    filterGroups,
    layersGroupRef,
    mapRef,
  ]);
}
