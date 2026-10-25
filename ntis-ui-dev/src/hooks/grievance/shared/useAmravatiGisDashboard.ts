'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Grievance, IssueCategory, MapMarker } from '@/types/grievance';
import {
  AMRAVATI_CENTER,
  AMRAVATI_DEFAULT_ZOOM,
} from '@/lib/constants/grievance';

export interface UseAmravatiGisDashboardOptions {
  initialGrievances?: Grievance[];
  initialCategory?: IssueCategory;
}

export function useAmravatiGisDashboard(options: UseAmravatiGisDashboardOptions = {}) {
  const [grievances, setGrievances] = useState<Grievance[]>(
    options.initialGrievances || []
  );
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>(
    options.initialCategory || 'all'
  );
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(AMRAVATI_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(AMRAVATI_DEFAULT_ZOOM);

  const markers = useMemo<MapMarker[]>(() => {
    return grievances
      .filter((g) => selectedCategory === 'all' || g.category === selectedCategory)
      .map((g) => ({
        id: g.id,
        lat: g.lat,
        lng: g.lng,
        category: g.category as IssueCategory,
        title: g.title,
        titleMr: g.titleMr,
        description: g.description,
        status: g.status === 'RESOLVED' ? 'resolved' : 'open',
        reportedAt: g.reportedAt,
        ward: g.ward,
      }));
  }, [grievances, selectedCategory]);

  const selectMarker = useCallback((markerId: string) => {
    setSelectedMarkerId(markerId);
    const found = grievances.find((g) => g.id === markerId);
    if (found) {
      setMapCenter([found.lat, found.lng]);
      setMapZoom(16);
    }
  }, [grievances]);

  const resetView = useCallback(() => {
    setSelectedMarkerId(null);
    setMapCenter(AMRAVATI_CENTER);
    setMapZoom(AMRAVATI_DEFAULT_ZOOM);
    setSelectedCategory('all');
  }, []);

  return {
    grievances,
    setGrievances,
    markers,
    selectedCategory,
    setSelectedCategory,
    selectedMarkerId,
    selectMarker,
    mapCenter,
    mapZoom,
    setMapCenter,
    setMapZoom,
    resetView,
  };
}

export type UseAmravatiGisDashboardReturn = ReturnType<typeof useAmravatiGisDashboard>;
