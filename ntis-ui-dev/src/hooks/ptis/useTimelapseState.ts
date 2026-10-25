/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchLocalChanges, type WaybackRelease } from '@/lib/api/wayback.service';

interface UseTimelapseStateOptions {
  initialLat?: number;
  initialLng?: number;
  initialWaybackReleases?: WaybackRelease[];
}

interface UseTimelapseStateReturn {
  waybackReleases: WaybackRelease[];
  lat: number;
  lng: number;
  activeIdx: number;
  setActiveIdx: React.Dispatch<React.SetStateAction<number>>;
  playing: boolean;
  setPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  showLabels: boolean;
  setShowLabels: React.Dispatch<React.SetStateAction<boolean>>;
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
  activeRelease: WaybackRelease | null;
  failedReleases: Set<number>;
  setFailedReleases: React.Dispatch<React.SetStateAction<Set<number>>>;
}

/**
 * Custom hook encapsulating all state management and side-effects for the
 * satellite timelapse component: wayback catalog fetching, coordinate loading,
 * autoplay interval management, and failed release tracking.
 */
export function useTimelapseState({
  initialLat,
  initialLng,
  initialWaybackReleases = [],
}: UseTimelapseStateOptions): UseTimelapseStateReturn {
  const [waybackReleases, setWaybackReleases] = useState<WaybackRelease[]>(() => initialWaybackReleases || []);
  const [lat, setLat] = useState(() => initialLat ?? 0);
  const [lng, setLng] = useState(() => initialLng ?? 0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [failedReleases, setFailedReleases] = useState<Set<number>>(() => new Set());
  const [speed, setSpeed] = useState(2000);

  const hasFetchedLocalRef = useRef(false);

  const releasesCountRef = useRef(waybackReleases.length);
  useEffect(() => {
    releasesCountRef.current = waybackReleases.length;
  }, [waybackReleases]);

  useEffect(() => {
    setLat(initialLat ?? 0);
    setLng(initialLng ?? 0);
    hasFetchedLocalRef.current = false;
  }, [initialLat, initialLng]);

  // Re-sync server-passed props after navigation if local changes haven't loaded yet
  useEffect(() => {
    if (initialWaybackReleases && initialWaybackReleases.length > 0 && !hasFetchedLocalRef.current) {
      setWaybackReleases(initialWaybackReleases);
      setLoading(false);
    }
  }, [initialWaybackReleases]);

  // Fetch sparse local changes dynamically when coordinates are available
  useEffect(() => {
    if (!lat || !lng) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadLocalChanges = async () => {
      if (releasesCountRef.current === 0) {
        setLoading(true);
      }
      try {
        const localReleases = await fetchLocalChanges(lat, lng);
        if (isMounted && localReleases.length > 0) {
          hasFetchedLocalRef.current = true;
          setWaybackReleases(localReleases);
          setActiveIdx((current) => (current >= localReleases.length ? 0 : current));
        }
      } catch {
        // Ignored
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadLocalChanges();

    return () => {
      isMounted = false;
    };
  }, [lat, lng]);

  const activeRelease = waybackReleases[activeIdx] ?? null;

  return {
    waybackReleases,
    lat,
    lng,
    activeIdx,
    setActiveIdx,
    playing,
    setPlaying,
    loading,
    setLoading,
    showLabels,
    setShowLabels,
    speed,
    setSpeed,
    activeRelease,
    failedReleases,
    setFailedReleases,
  };
}
