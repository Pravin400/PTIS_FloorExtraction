export interface TileCoordinates {
  x: number;
  y: number;
  z: number;
}

/**
 * Converts Latitude and Longitude to slippy map tile coordinates at a given zoom level.
 * Used to construct tile URLs for static map previews.
 */
export function latLngToTile(lat: number, lng: number, zoom: number): TileCoordinates {
  const maxLat = 85.05112878;
  const clampedLat = Math.max(-maxLat, Math.min(maxLat, lat));
  const wrappedLng = ((((lng + 180) % 360) + 360) % 360) - 180;
  const latRad = (clampedLat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.min(n - 1, Math.max(0, Math.floor(((wrappedLng + 180) / 360) * n)));
  const y = Math.min(
    n - 1,
    Math.max(
      0,
      Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
    )
  );
  return { x, y, z: zoom };
}

/**
 * Parses a single numeric or string coordinate value into a valid finite number.
 * Returns undefined if value is null, undefined, empty, NaN, or non-finite.
 */
export function parseSingleCoord(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'number') {
    return Number.isFinite(val) && val !== 0 ? val : undefined;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-' || trimmed === '0' || trimmed.toLowerCase() === 'null') return undefined;
    const parsed = parseFloat(trimmed);
    return Number.isFinite(parsed) && parsed !== 0 ? parsed : undefined;
  }
  return undefined;
}

/**
 * Parses a combined coordinate string or object containing lat/lng.
 * Supports:
 * - "19.218342, 72.978125" (comma-separated)
 * - "19.218342 72.978125" (space-separated)
 * - "POINT(72.978125 19.218342)" or "POINT (72.978125 19.218342)" (WKT GIS format where longitude is first)
 */
export function parseCoordinatePair(val: unknown): { lat: number; lng: number } | undefined {
  if (!val) return undefined;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-' || trimmed === '0' || trimmed.toLowerCase() === 'null') return undefined;

    // Check for WKT POINT (e.g. POINT(72.9781 19.2183))
    const pointMatch = /POINT\s*\(\s*([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s*\)/i.exec(trimmed);
    if (pointMatch) {
      const first = parseFloat(pointMatch[1]);
      const second = parseFloat(pointMatch[2]);
      if (Number.isFinite(first) && Number.isFinite(second)) {
        // In WKT POINT, the standard is POINT(Longitude Latitude)
        return normalizeCoordinates(second, first);
      }
    }

    // Check for delimiter-separated (comma, semicolon, pipe, slash, or whitespace)
    const parts = trimmed.split(/[,;|/\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      const num1 = parseFloat(parts[0]);
      const num2 = parseFloat(parts[1]);
      if (Number.isFinite(num1) && Number.isFinite(num2) && (num1 !== 0 || num2 !== 0)) {
        return normalizeCoordinates(num1, num2);
      }
    }
  }

  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    const lat = parseSingleCoord(obj.lat ?? obj.latitude ?? obj.Lat ?? obj.Latitude);
    const lng = parseSingleCoord(obj.lng ?? obj.longitude ?? obj.Lng ?? obj.Longitude);
    if (lat !== undefined && lng !== undefined) {
      return normalizeCoordinates(lat, lng);
    }
  }

  return undefined;
}

/**
 * Normalizes latitude and longitude, automatically correcting swapped coordinates.
 * In India / Maharashtra, latitudes range from ~6°N to ~38°N, while longitudes range from ~68°E to ~98°E.
 * If lat is > 45 and lng is < 45, they are inverted and need to be swapped.
 */
export function normalizeCoordinates(lat: number, lng: number): { lat: number; lng: number } {
  if (lat > 45 && lng <= 45 && lat <= 90 && lng >= -90) {
    // Swapped lat/lng detected
    return { lat: lng, lng: lat };
  }
  return { lat, lng };
}

/**
 * Hierarchically extracts valid numeric GPS latitude and longitude from an array of potential source objects.
 * Priority order matches the order of objects passed in `sources`.
 */
export function extractCoordinates(
  sources: Array<Record<string, unknown> | null | undefined>
): { latitude?: number; longitude?: number; hasCoords: boolean } {
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;

    // 1. Check for combined coordinate fields
    const combinedVal =
      src.gisCoordinates ??
      src.GisCoordinates ??
      src.coordinates ??
      src.Coordinates ??
      src.geoCoordinates ??
      src.GeoCoordinates ??
      src.gpsLocation ??
      src.GpsLocation;

    if (combinedVal) {
      const pair = parseCoordinatePair(combinedVal);
      if (pair) {
        return { latitude: pair.lat, longitude: pair.lng, hasCoords: true };
      }
    }

    // 2. Check for separate latitude and longitude fields
    const rawLat =
      src.latitude ??
      src.Latitude ??
      src.lat ??
      src.Lat ??
      src.gisLatitude ??
      src.GisLatitude ??
      src.surveyLatitude ??
      src.SurveyLatitude;

    const rawLng =
      src.longitude ??
      src.Longitude ??
      src.lng ??
      src.Lng ??
      src.gisLongitude ??
      src.GisLongitude ??
      src.surveyLongitude ??
      src.SurveyLongitude;

    const parsedLat = parseSingleCoord(rawLat);
    const parsedLng = parseSingleCoord(rawLng);

    if (parsedLat !== undefined && parsedLng !== undefined) {
      const normalized = normalizeCoordinates(parsedLat, parsedLng);
      return { latitude: normalized.lat, longitude: normalized.lng, hasCoords: true };
    }

    // Also check if rawLat itself was a combined string
    if (typeof rawLat === 'string' && rawLat.includes(',')) {
      const pair = parseCoordinatePair(rawLat);
      if (pair) {
        return { latitude: pair.lat, longitude: pair.lng, hasCoords: true };
      }
    }
  }

  return { latitude: undefined, longitude: undefined, hasCoords: false };
}

/**
 * Standard ESRI World Imagery direct tile URL (fallback for when Wayback is unavailable).
 */
export function getEsriWorldImageryTileUrl(x: number, y: number, z: number): string {
  return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}

/**
 * Constructs a static satellite tile URL for a given latitude and longitude.
 */
export function getSatelliteTileUrl(lat: number, lng: number, zoom = 17, releaseId?: number): string {
  const normalized = normalizeCoordinates(lat, lng);
  const tile = latLngToTile(normalized.lat, normalized.lng, zoom);
  if (releaseId) {
    return `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${releaseId}/${tile.z}/${tile.y}/${tile.x}`;
  }
  return getEsriWorldImageryTileUrl(tile.x, tile.y, tile.z);
}
