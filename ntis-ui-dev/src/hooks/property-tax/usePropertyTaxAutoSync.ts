'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  isPropertyRevenueZero,
  type RevenueCheckablePerformance,
} from '@/lib/utils/ptis-revenue.utils';

export interface UsePropertyTaxAutoSyncParams {
  activePropertyId?: string | number | null;
  performance?: RevenueCheckablePerformance | null;
}

/**
 * Shared hook to synchronize property tax revenue metrics on load.
 * Auto-syncs newly calculated taxes once if revenue is 0 on initial load.
 * Completely free of window events or global state pollution.
 */
export function usePropertyTaxAutoSync({
  activePropertyId,
  performance,
}: UsePropertyTaxAutoSyncParams) {
  const router = useRouter();
  const prevPropertyIdRef = useRef(activePropertyId);
  const syncedPropertyIdsRef = useRef<Set<string | number>>(new Set());

  useEffect(() => {
    if (prevPropertyIdRef.current !== activePropertyId) {
      prevPropertyIdRef.current = activePropertyId;
    }
  }, [activePropertyId]);

  // Auto-sync: If active property has zero revenue on mount/load, refresh once to pick up newly committed taxes
  useEffect(() => {
    if (!activePropertyId || syncedPropertyIdsRef.current.has(activePropertyId)) return;

    if (isPropertyRevenueZero(performance)) {
      syncedPropertyIdsRef.current.add(activePropertyId);
      router.refresh();
    }
  }, [activePropertyId, performance, router]);
}
