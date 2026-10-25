'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  detectCitizenBrowserLocation,
  resolveCitizenPlace,
  type ResolvedCitizenPlace,
} from '@/lib/services/grievance';

interface UseGrievanceLocationProps {
  locale?: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  defaultLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    ward?: string;
  };
}

export function useGrievanceLocation({
  t,
  defaultLocation,
}: UseGrievanceLocationProps) {
  const [roadLandmark, setRoadLandmark] = useState(() => defaultLocation?.address || '');
  const [locationCoords, setLocationCoords] = useState<ResolvedCitizenPlace | null>(() => {
    if (defaultLocation?.latitude && defaultLocation?.longitude) {
      return {
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
        placeName: defaultLocation.address || '',
        placeNameMr: '',
        zone: '',
        ward: defaultLocation.ward || '',
        wardId: 1,
        zoneId: 1,
        source: 'manual',
      };
    }
    return null;
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const autoDetectLocation = useCallback(
    async (isManualTrigger = false) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        if (isManualTrigger) {
          toast.error(t('geoNotSupported'));
        }
        return;
      }

      setIsDetectingLocation(true);
      setLocationError(null);

      try {
        const coords = await detectCitizenBrowserLocation();
        if (Math.abs(coords.latitude) < 0.0001 && Math.abs(coords.longitude) < 0.0001) {
          throw new Error('Invalid GPS coordinates (0, 0) received.');
        }
        const resolved = await resolveCitizenPlace(
          coords.latitude,
          coords.longitude
        );

        const placeLabel =
          resolved.placeName ||
          `Current Location (${coords.latitude.toFixed(4)}° N, ${coords.longitude.toFixed(4)}° E)`;
        setRoadLandmark(placeLabel);
        setLocationCoords(resolved);

        if (isManualTrigger) {
          toast.success(t('gpsLocationDetected', { place: placeLabel }));
        }
      } catch (err: unknown) {
        const geoErr = err as { message?: string; code?: number };
        console.warn('Geolocation detection error:', geoErr);
        setLocationError(geoErr?.message || 'Location unavailable');
        if (isManualTrigger) {
          if (geoErr?.code === 1) {
            toast.error(t('locationPermissionBlocked'));
          } else {
            toast.error(t('gpsLocationFailed'));
          }
        }
      } finally {
        setIsDetectingLocation(false);
      }
    },
    [t]
  );

  return {
    roadLandmark,
    setRoadLandmark,
    locationCoords,
    setLocationCoords,
    isDetectingLocation,
    locationError,
    autoDetectLocation,
  };
}
