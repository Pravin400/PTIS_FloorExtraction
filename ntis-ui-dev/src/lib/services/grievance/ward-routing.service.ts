/**
 * Ward Geo-Routing & Administrative Dispatch Service
 * Client-safe spatial reverse-geocoding heuristic for instant browser GPS / EXIF detection.
 * Authoritative database assignment is performed by the server action and /api/GrievanceApplication.
 */

import type { GeoPoint } from './amravati-gis.service';
import { calculateDistanceKm } from './amravati-gis.service';

export interface WardRoutingResult {
  wardNumber: number;
  wardName: string;
  zoneId: number;
  zoneCode: string;
  zoneName: string;
}

// Amravati Municipal Zone spatial anchors with default initial jurisdiction
const MUNICIPAL_ZONE_ANCHORS: {
  zoneId: number;
  zoneCode: string;
  zoneName: string;
  defaultWardId: number;
  lat: number;
  lng: number;
}[] = [
  { zoneId: 1, zoneCode: 'A', zoneName: 'Zone 1 - Central / Camp', defaultWardId: 1, lat: 20.9380, lng: 77.7610 },
  { zoneId: 2, zoneCode: 'B', zoneName: 'Zone 2 - Gadge Nagar / North', defaultWardId: 19, lat: 20.9320, lng: 77.7420 },
  { zoneId: 3, zoneCode: 'C', zoneName: 'Zone 3 - Wadali / East', defaultWardId: 30, lat: 20.8710, lng: 77.7260 },
  { zoneId: 4, zoneCode: 'D', zoneName: 'Zone 4 - Dastur Nagar / South', defaultWardId: 41, lat: 20.9525, lng: 77.7650 },
  { zoneId: 5, zoneCode: 'E', zoneName: 'Zone 5 - Badnera', defaultWardId: 53, lat: 20.9238, lng: 77.7554 },
];

/**
 * Resolves GPS coordinates to the nearest administrative zone and ward.
 * Pure client-safe geometric distance calculation (zero server-only dependencies).
 */
export function routeGrievanceByLocation(point: GeoPoint): WardRoutingResult {
  let closest = MUNICIPAL_ZONE_ANCHORS[0];
  let minDistance = Infinity;

  for (const anchor of MUNICIPAL_ZONE_ANCHORS) {
    const dist = calculateDistanceKm(point, { lat: anchor.lat, lng: anchor.lng });
    if (dist < minDistance) {
      minDistance = dist;
      closest = anchor;
    }
  }

  return {
    wardNumber: closest.defaultWardId,
    wardName: `Ward ${closest.defaultWardId}`,
    zoneId: closest.zoneId,
    zoneCode: closest.zoneCode,
    zoneName: closest.zoneName,
  };
}

/**
 * Returns zonal details for an explicit ward ID.
 */
export function getZoneDetailsByWard(wardNumber: number): WardRoutingResult {
  if (wardNumber >= 19 && wardNumber <= 29) {
    return { wardNumber, wardName: `Ward ${wardNumber}`, zoneId: 2, zoneCode: 'B', zoneName: 'Zone 2 - Gadge Nagar / North' };
  }
  if (wardNumber >= 30 && wardNumber <= 40) {
    return { wardNumber, wardName: `Ward ${wardNumber}`, zoneId: 3, zoneCode: 'C', zoneName: 'Zone 3 - Wadali / East' };
  }
  if (wardNumber >= 41 && wardNumber <= 52) {
    return { wardNumber, wardName: `Ward ${wardNumber}`, zoneId: 4, zoneCode: 'D', zoneName: 'Zone 4 - Dastur Nagar / South' };
  }
  if (wardNumber >= 53 && wardNumber <= 67) {
    return { wardNumber, wardName: `Ward ${wardNumber}`, zoneId: 5, zoneCode: 'E', zoneName: 'Zone 5 - Badnera' };
  }
  // Default to Zone 1
  return { wardNumber, wardName: `Ward ${wardNumber}`, zoneId: 1, zoneCode: 'A', zoneName: 'Zone 1 - Central / Camp' };
}

export interface TextRoutingResult {
  zoneId: number;
  wardId: number;
  zoneName: string;
  wardName: string;
}

/**
 * Resolves administrative Ward from manual text descriptions.
 */
export function resolveAdministrativeWardFromText(
  text?: string | null
): TextRoutingResult | null {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  if (!clean) return null;

  // 1. Direct Ward letter matching (e.g. "Ward B10", "B2")
  const wardLetterMatch = clean.match(/(?:ward|prabhag)?\s*([A-Ea-e])\s*([0-9]{1,2})/i);
  if (wardLetterMatch) {
    const letter = wardLetterMatch[1].toUpperCase();
    const anchor = MUNICIPAL_ZONE_ANCHORS.find((a) => a.zoneCode === letter) || MUNICIPAL_ZONE_ANCHORS[0];
    return {
      zoneId: anchor.zoneId,
      wardId: anchor.defaultWardId,
      zoneName: anchor.zoneName,
      wardName: `Ward ${letter}${wardLetterMatch[2]}`,
    };
  }

  // 2. Direct numeric Ward ID matching (e.g. "Ward 12")
  const wardMatch = clean.match(/(?:ward|prabhag)\s*(?:no\.?|number)?\s*([0-9]{1,3})/i);
  if (wardMatch) {
    const wardNum = parseInt(wardMatch[1], 10);
    if (wardNum > 0) {
      const routing = getZoneDetailsByWard(wardNum);
      return {
        zoneId: routing.zoneId,
        wardId: routing.wardNumber,
        zoneName: routing.zoneName,
        wardName: routing.wardName,
      };
    }
  }

  return null;
}
