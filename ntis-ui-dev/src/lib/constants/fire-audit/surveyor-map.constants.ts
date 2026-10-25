/**
 * Geospatial coordinates and boundary validation for Thane & Navi Mumbai Fire Brigade.
 */
export const PUNE_PMC_CENTER: [number, number] = [18.5204, 73.8567];
export const THANE_NAVI_MUMBAI_CENTER: [number, number] = [19.1200, 72.9950];
export const DEFAULT_MAP_CENTER: [number, number] = PUNE_PMC_CENTER;
export const DEFAULT_MAP_ZOOM = 12;

/**
 * Validates coordinate pair to guard against NaN / out-of-bounds Leaflet crashes.
 */
export function isValidCoord(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
