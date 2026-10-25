'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReassessmentPhoto } from '@/types/reassessment.types';
import { getReassessmentDataAction } from '@/app/[locale]/property-tax/ptis/reassesment/action';

interface UseReassessmentLivePhotosProps {
  wardId?: number;
  propertyNo?: string;
  partitionNo?: string;
  initialPhotos?: ReassessmentPhoto[];
}

interface UseReassessmentLivePhotosResult {
  photos: ReassessmentPhoto[];
  refreshPhotos: () => Promise<void>;
}

/**
 * Keeps reassessment photos in sync with media mutations while preserving SSR hydration data.
 * Initial state is always seeded from server-rendered props.
 */
export function useReassessmentLivePhotos({
  wardId,
  propertyNo,
  partitionNo,
  initialPhotos = [],
}: UseReassessmentLivePhotosProps): UseReassessmentLivePhotosResult {
  const entityKey = useMemo(
    () => `${wardId ?? ''}|${propertyNo ?? ''}|${partitionNo ?? ''}`,
    [wardId, propertyNo, partitionNo]
  );

  const [livePhotosState, setLivePhotosState] = useState<{
    key: string;
    photos: ReassessmentPhoto[];
  } | null>(null);

  const photos =
    livePhotosState && livePhotosState.key === entityKey
      ? livePhotosState.photos
      : initialPhotos;

  const refreshPhotos = useCallback(async () => {
    if (!wardId || !propertyNo) return;
    const result = await getReassessmentDataAction(wardId, propertyNo, partitionNo);
    if (result.success && result.data) {
      setLivePhotosState({
        key: entityKey,
        photos: result.data.photos || [],
      });
    }
  }, [wardId, propertyNo, partitionNo, entityKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMediaUpdated = () => {
      void refreshPhotos();
    };

    window.addEventListener('ptis:media-updated', handleMediaUpdated as EventListener);
    return () => {
      window.removeEventListener('ptis:media-updated', handleMediaUpdated as EventListener);
    };
  }, [refreshPhotos]);

  return {
    photos,
    refreshPhotos,
  };
}