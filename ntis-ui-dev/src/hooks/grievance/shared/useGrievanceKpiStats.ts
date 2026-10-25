'use client';

/**
 * useGrievanceKpiStats Hook
 * Path: src/hooks/grievance/shared/useGrievanceKpiStats.ts
 *
 * Provides real-time aggregated grievance metrics for both registered and non-registered users.
 * Sourced directly from the live database via fetchGrievanceKpiMetricsAction.
 * Equipped with 30s cache TTL, in-flight request deduplication, and reactive event listeners.
 */

import { useState, useEffect, useCallback } from 'react';
import type { GrievanceKpiMetrics } from '@/types/grievance/tracking.types';
import { fetchGrievanceKpiMetricsAction } from '@/lib/actions/grievance/citizen/track-grievance.actions';
import { TRACKING_UPDATE_EVENT } from '@/lib/services/grievance/tracking-storage.service';

const DEFAULT_METRICS: GrievanceKpiMetrics = {
  total: 0,
  pending: 0,
  inProgress: 0,
  resolved: 0,
};

let cachedMetrics: GrievanceKpiMetrics | null = null;
let lastFetchTime = 0;
let inFlightPromise: Promise<GrievanceKpiMetrics> | null = null;
const CACHE_TTL_MS = 30_000;

export function clearGrievanceKpiCache(): void {
  cachedMetrics = null;
  lastFetchTime = 0;
  inFlightPromise = null;
}

export function useGrievanceKpiStats() {
  const [stats, setStats] = useState<GrievanceKpiMetrics>(() => cachedMetrics || DEFAULT_METRICS);
  const [isLoading, setIsLoading] = useState<boolean>(() => cachedMetrics === null);

  const fetchMetrics = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedMetrics && now - lastFetchTime < CACHE_TTL_MS) {
      setStats(cachedMetrics);
      setIsLoading(false);
      return;
    }

    if (inFlightPromise) {
      const data = await inFlightPromise;
      setStats(data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    inFlightPromise = (async () => {
      try {
        const res = await fetchGrievanceKpiMetricsAction();
        if (res.success && res.data) {
          cachedMetrics = res.data;
          lastFetchTime = Date.now();
          return res.data;
        }
      } catch (err) {
        console.warn('[useGrievanceKpiStats] Fetch error:', err);
      }
      return cachedMetrics || DEFAULT_METRICS;
    })();

    try {
      const result = await inFlightPromise;
      setStats(result);
    } finally {
      inFlightPromise = null;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMetrics();
    }, 0);

    const handleUpdate = () => {
      void fetchMetrics(true);
    };

    window.addEventListener(TRACKING_UPDATE_EVENT, handleUpdate);
    window.addEventListener('amravati_tickets_updated', handleUpdate);
    window.addEventListener('citizen-auth-change', handleUpdate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(TRACKING_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('amravati_tickets_updated', handleUpdate);
      window.removeEventListener('citizen-auth-change', handleUpdate);
    };
  }, [fetchMetrics]);

  return {
    stats,
    isLoading,
    refetch: () => fetchMetrics(true),
  };
}
