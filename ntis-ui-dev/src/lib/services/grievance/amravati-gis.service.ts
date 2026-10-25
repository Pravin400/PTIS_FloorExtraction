/**
 * Amravati Municipal GIS & Spatial Computing Engine
 */

import {
  AMRAVATI_CENTER,
  AMRAVATI_BOUNDARY_COORDS,
  AMRAVATI_LANDMARKS,
} from '@/lib/constants/grievance';
import type { LandmarkCoordinates } from '@/types/grievance';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Calculates Haversine spherical distance between two GPS coordinates in kilometers.
 */
export function calculateDistanceKm(point1: GeoPoint, point2: GeoPoint): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Ray-casting algorithm to test if a point is within the Amravati municipal boundary.
 */
export function isWithinMunicipalBoundary(
  point: GeoPoint,
  polygon: [number, number][] = AMRAVATI_BOUNDARY_COORDS
): boolean {
  const x = point.lat;
  const y = point.lng;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Finds nearest landmarks within maxRadiusKm from given coordinates.
 */
export function findNearestLandmarks(
  point: GeoPoint,
  maxRadiusKm = 5,
  limit = 5
): Array<LandmarkCoordinates & { distanceKm: number }> {
  return AMRAVATI_LANDMARKS.map((landmark) => ({
    ...landmark,
    distanceKm: calculateDistanceKm(point, { lat: landmark.lat, lng: landmark.lng }),
  }))
    .filter((l) => l.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/**
 * Returns default center coordinates for Amravati.
 */
export function getAmravatiCenter(): GeoPoint {
  return { lat: AMRAVATI_CENTER[0], lng: AMRAVATI_CENTER[1] };
}
