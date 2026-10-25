/**
 * Pure Spatial Point-in-Polygon (PIP) Geometry Math
 * Free of server-only imports, API clients, or Next.js headers.
 * Safe for execution anywhere.
 * Path: src/lib/utils/grievance/gis/gis-point-in-polygon.ts
 */

import type { GisGrievanceFilterGroupDto } from '@/types/grievance/grievance-gis.types';

export interface ResolvedWardZone {
  wardId: number;
  wardCode: string;
  wardName: string;
  zoneId: number;
  zoneCode: string;
  zoneName: string;
}

export function populateDynamicLookupFromFilters(filterGroups: GisGrievanceFilterGroupDto[]) {
  const wardMap = new Map<string, { id: number; name: string; zoneId: number }>();
  const zoneMap = new Map<number, { code: string; name: string }>();

  const zoneGroup = filterGroups.find(
    (g) => g.filterKey?.toLowerCase() === 'zoneid' || g.filterKey?.toLowerCase() === 'zone'
  );
  zoneGroup?.options?.forEach((opt) => {
    if (opt.id !== undefined && opt.id !== null) {
      const match = opt.name?.match(/Zone\s*([A-Za-z0-9])/i) || opt.code?.match(/Zone\s*([A-Za-z0-9])/i);
      const code = match ? match[1].toUpperCase() : (opt.code || String(opt.id));
      zoneMap.set(Number(opt.id), { code, name: opt.name || `Zone ${code}` });
    }
  });

  const wardGroup = filterGroups.find(
    (g) => g.filterKey?.toLowerCase() === 'wardid' || g.filterKey?.toLowerCase() === 'ward'
  );
  wardGroup?.options?.forEach((opt) => {
    if (opt.id !== undefined && opt.id !== null) {
      const rawCode = opt.code || opt.name?.split(/[\s-]+/)[0]?.trim().toUpperCase() || '';
      if (rawCode) {
        wardMap.set(rawCode, {
          id: Number(opt.id),
          name: opt.name || `Ward ${rawCode}`,
          zoneId: opt.parentId ? Number(opt.parentId) : 0,
        });
      }
    }
  });

  return { wardMap, zoneMap };
}

export function pointInPolygonRing(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInGeometry(
  lng: number,
  lat: number,
  geom?: GeoJSON.Geometry | { type: string; coordinates: unknown } | null
): boolean {
  if (!geom || !('coordinates' in geom) || !Array.isArray(geom.coordinates)) return false;
  const pt: [number, number] = [lng, lat];
  if (geom.type === 'Polygon') {
    return pointInPolygonRing(pt, (geom.coordinates as number[][][])[0]);
  }
  if (geom.type === 'MultiPolygon') {
    return (geom.coordinates as number[][][][]).some((poly: number[][][]) => poly[0] && pointInPolygonRing(pt, poly[0]));
  }
  return false;
}

export function findWardAndZoneFromCoordsSync(
  lat: number,
  lng: number,
  geoJsonData?: GeoJSON.FeatureCollection | { features?: GeoJSON.Feature[] } | null,
  filterGroups?: GisGrievanceFilterGroupDto[]
): ResolvedWardZone | null {
  if (!geoJsonData?.features || !lat || !lng) return null;
  const { wardMap, zoneMap } = filterGroups
    ? populateDynamicLookupFromFilters(filterGroups)
    : { wardMap: new Map(), zoneMap: new Map() };

  for (const feature of geoJsonData.features) {
    if (isPointInGeometry(lng, lat, feature.geometry)) {
      const rawCode = String(
        feature.properties?.NEW_WARD_N ||
        feature.properties?.WardNo ||
        feature.properties?.wardNo ||
        feature.properties?.wardCode ||
        ''
      ).trim().toUpperCase();

      const dbWard = wardMap.get(rawCode);
      if (dbWard) {
        const dbZone = zoneMap.get(dbWard.zoneId);
        return {
          wardId: dbWard.id,
          wardCode: rawCode,
          wardName: dbWard.name,
          zoneId: dbWard.zoneId,
          zoneCode: dbZone?.code || '',
          zoneName: dbZone?.name || '',
        };
      }

      // Feature-embedded DB IDs if available directly in layer properties
      const featWardId = feature.properties?.wardId ?? feature.properties?.WardId ?? feature.properties?.id;
      const featZoneId = feature.properties?.zoneId ?? feature.properties?.ZoneId;
      if (featWardId !== undefined && featWardId !== null) {
        const zid = featZoneId ? Number(featZoneId) : 0;
        const dbZone = zoneMap.get(zid);
        return {
          wardId: Number(featWardId),
          wardCode: rawCode,
          wardName: feature.properties?.wardName || (rawCode ? `Ward ${rawCode}` : ''),
          zoneId: zid,
          zoneCode: dbZone?.code || '',
          zoneName: dbZone?.name || '',
        };
      }
    }
  }
  return null;
}
