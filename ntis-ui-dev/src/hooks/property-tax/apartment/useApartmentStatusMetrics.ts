'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { fetchApartmentQCTopSectionBelowFlexAction } from '@/app/[locale]/property-tax/ptis/apartment/action';
import {
  PtisStatusBadgeItem,
  buildBadgesFromPayload,
} from '@/lib/utils/ptis/ptisStatusMetrics.utils';
import {
  ApartmentQCTopSectionBelowFlexResponseDto,
  ApartmentQCTopSectionBelowFlexItemsDto,
} from '@/types/property-tax/apartment';

export interface UseApartmentStatusMetricsParams {
  /** The resolved propertyId — only fetches when this is a valid positive number */
  propertyId?: number | string | null;
  badges?: PtisStatusBadgeItem[];
  initialData?: ApartmentQCTopSectionBelowFlexResponseDto | ApartmentQCTopSectionBelowFlexItemsDto | Record<string, unknown> | null;
}

export function useApartmentStatusMetrics({
  propertyId,
  badges: initialBadges,
  initialData,
}: UseApartmentStatusMetricsParams) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Parse propertyId into a valid positive number or null
  const parsedPropId = useMemo<number | null>(() => {
    if (propertyId === null || propertyId === undefined || propertyId === '') return null;
    const n = Number(propertyId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [propertyId]);

  // Build a unique fetch key — ONLY based on propertyId
  const fetchKey = useMemo(() => {
    if (parsedPropId) return `prop-${parsedPropId}`;
    return null;
  }, [parsedPropId]);

  // Use SSR badges if available on initial mount
  const ssrBadges = useMemo<PtisStatusBadgeItem[]>(() => {
    if (initialBadges && initialBadges.length > 0) return initialBadges;
    if (initialData) return buildBadgesFromPayload(initialData);
    return [];
  }, [initialBadges, initialData]);

  const [initialKey] = useState<string | null>(fetchKey);
  const lastFetchedKeyRef = useRef<string | null>(null);

  const [fetchedBadges, setFetchedBadges] = useState<PtisStatusBadgeItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialProperty = fetchKey === initialKey;

  // If no valid propertyId → no badges to show (prevents stale SSR data after ward change)
  const badges = !parsedPropId
    ? []
    : fetchedBadges ?? (isInitialProperty ? ssrBadges : []);

  /**
   * Fetch metrics from the API using ONLY propertyId.
   * This will NOT be called if propertyId is not available.
   */
  const fetchMetrics = useCallback(() => {
    if (!parsedPropId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchApartmentQCTopSectionBelowFlexAction(parsedPropId)
      .then((response) => {
        setIsLoading(false);
        const payloadCandidate = response?.items || response?.data || response;
        if (payloadCandidate) {
          const mappedBadges = buildBadgesFromPayload(payloadCandidate as unknown as Record<string, unknown>);
          if (mappedBadges.length > 0) {
            setFetchedBadges(mappedBadges);
            return;
          }
        }
        if (response && !response.success && response.message) {
          setError(response.message);
        }
      })
      .catch((err) => {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Failed to fetch workflow metrics');
      });
  }, [parsedPropId]);

  useEffect(() => {
    // No propertyId available — do not call API
    if (!fetchKey) return;

    // If SSR already provided badges for the initial key on mount, keep them
    if (fetchKey === initialKey && ssrBadges.length > 0 && lastFetchedKeyRef.current === null) {
      lastFetchedKeyRef.current = fetchKey;
      return;
    }

    // Trigger API call only when propertyId changes
    if (lastFetchedKeyRef.current !== fetchKey) {
      lastFetchedKeyRef.current = fetchKey;
      setFetchedBadges(null);
      fetchMetrics();
    }
  }, [fetchKey, fetchMetrics, ssrBadges.length, initialKey]);

  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -250 : 250,
        behavior: 'smooth',
      });
    }
  }, []);

  return {
    badges,
    scrollContainerRef,
    handleScroll,
    isLoading,
    error,
    refetchMetrics: fetchMetrics,
  };
}

export { useApartmentStatusMetrics as usePtisStatusMetrics };
