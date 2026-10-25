
/**
 * Citizen Browser Location Detection & Reverse Geocoding Service
 * Combines Browser Geolocation API with Amravati GIS Landmarks and OpenStreetMap reverse geocoding.
 */

import { resolveSpatialWardZoneAction } from '@/lib/actions/grievance/gis/grievance-gis.actions';

export interface CitizenCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ResolvedCitizenPlace {
  placeName: string;
  placeNameMr?: string;
  ward: string;
  zone: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: 'gps' | 'photo_exif' | 'manual';
  wardId?: number | null;
  zoneId?: number | null;
}

/**
 * Detects citizen's current device coordinates using the browser's Geolocation API.
 */
export function detectCitizenBrowserLocation(): Promise<CitizenCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by this browser.'));
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (Math.abs(latitude) < 0.0001 && Math.abs(longitude) < 0.0001) {
          return reject(new Error('Invalid GPS coordinates (0, 0) received.'));
        }
        resolve({
          latitude,
          longitude,
          accuracy,
        });
      },
      (error) => {
        // Retry with normal accuracy if high accuracy timed out or position unavailable
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
          navigator.geolocation.getCurrentPosition(
            (pos2) => {
              const { latitude, longitude, accuracy } = pos2.coords;
              if (Math.abs(latitude) < 0.0001 && Math.abs(longitude) < 0.0001) {
                return reject(new Error('Invalid GPS coordinates (0, 0) received.'));
              }
              resolve({
                latitude,
                longitude,
                accuracy,
              });
            },
            (err2) => reject(err2),
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 120000 }
          );
        } else {
          reject(error);
        }
      },
      options
    );
  });
}

/**
 * Resolves GPS coordinates to an administrative ward/zone and place name via live spatial GIS.
 */
export async function resolveCitizenPlace(
  lat: number,
  lng: number
): Promise<ResolvedCitizenPlace> {
  // Reject Null Island (0, 0) or uninitialized coordinates
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) {
    return {
      placeName: '',
      ward: '',
      zone: '',
      latitude: lat,
      longitude: lng,
      wardId: null,
      zoneId: null,
    };
  }

  let wardNo: number | null = null;
  let wardString = '';
  let zoneName = '';
  let zoneId: number | null = null;

  try {
    const spatial = await resolveSpatialWardZoneAction(lat, lng);
    if (spatial?.success && spatial.data?.wardId && spatial.data?.zoneId) {
      wardNo = spatial.data.wardId;
      wardString = spatial.data.wardName || (spatial.data.wardCode ? `Ward ${spatial.data.wardCode}` : `Ward ${spatial.data.wardId}`);
      zoneName = spatial.data.zoneName || (spatial.data.zoneCode ? `Zone ${spatial.data.zoneCode}` : '');
      zoneId = spatial.data.zoneId;
    }
  } catch (err) {
    console.warn('[resolveCitizenPlace] Live spatial ward/zone resolution error:', err);
  }

  let placeName = `Current Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;

  // Reverse geocoding via OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const road = addr.road || addr.pedestrian || addr.street || addr.highway || addr.path;
      const suburb =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.colony ||
        addr.village ||
        addr.hamlet ||
        addr.quarter ||
        addr.subdistrict;
      const amenity = addr.amenity || addr.building || addr.shop || addr.leisure;
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.city_district ||
        addr.state_district ||
        addr.county ||
        '';

      const parts: string[] = [];
      if (amenity) parts.push(amenity);
      if (road) parts.push(road);
      if (suburb && !parts.includes(suburb)) parts.push(suburb);

      // If specific street/amenity wasn't segmented, extract from display_name
      if (parts.length === 0 && data.display_name) {
        const rawSegments = data.display_name
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (rawSegments.length > 0) {
          parts.push(...rawSegments.slice(0, 2));
        }
      }

      if (parts.length > 0) {
        const placeBase = parts.join(', ');
        if (city && !placeBase.toLowerCase().includes(city.toLowerCase())) {
          placeName = `${placeBase}, ${city}`;
        } else {
          placeName = placeBase;
        }
      }
    }
  } catch {
    // Reverse geocoding failed or timed out
  }

  return {
    placeName,
    placeNameMr: '',
    ward: wardString,
    zone: zoneName,
    latitude: lat,
    longitude: lng,
    wardId: wardNo ?? null,
    zoneId: zoneId ?? null,
    source: 'gps',
  };
}
