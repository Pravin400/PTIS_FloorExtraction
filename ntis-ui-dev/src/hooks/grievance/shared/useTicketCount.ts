'use client';

/**
 * useTicketCount Hook
 * Symmetrical Layer: src/hooks/grievance/shared/useTicketCount.ts
 *
 * Provides real-time dynamic count of citizen complaints for navigation badges.
 * Automatically synchronizes with the database and listens to local ticket updates.
 * Optimized with in-flight promise deduplication and a 30-second TTL cache.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchAllGrievanceApplicationsAction } from '@/lib/actions/grievance/citizen/track-grievance.actions';
import { TRACKING_UPDATE_EVENT } from '@/lib/services/grievance/tracking-storage.service';
import { getCookieValue } from '@/lib/utils/cookie';

let cachedTicketCount: number | null = null;
let lastTicketCountFetchTime = 0;
let inFlightTicketPromise: Promise<number> | null = null;
const TICKET_COUNT_TTL_MS = 30_000;

export function clearTicketCountCache(): void {
  cachedTicketCount = 0;
  lastTicketCountFetchTime = 0;
  inFlightTicketPromise = null;
}

export function useTicketCount(): number {
  const [count, setCount] = useState<number>(() => {
    if (typeof document !== 'undefined' && getCookieValue('citizen_is_logged_in') !== 'true') {
      return 0;
    }
    if (cachedTicketCount !== null) return cachedTicketCount;
    if (typeof window !== 'undefined') {
      try {
        const localRaw = localStorage.getItem('amravati_citizen_tracking_tickets');
        const localTickets = localRaw ? JSON.parse(localRaw) : [];
        if (Array.isArray(localTickets) && localTickets.length > 0) return localTickets.length;
      } catch {}
    }
    return 0;
  });

  const refreshCount = useCallback(async (force = false) => {
    const isCitizen = typeof document !== 'undefined' && getCookieValue('citizen_is_logged_in') === 'true';
    if (!isCitizen) {
      cachedTicketCount = 0;
      setCount(0);
      return;
    }

    const now = Date.now();
    if (!force && cachedTicketCount !== null && now - lastTicketCountFetchTime < TICKET_COUNT_TTL_MS) {
      setCount(cachedTicketCount);
      return;
    }

    if (inFlightTicketPromise) {
      const result = await inFlightTicketPromise;
      setCount(result);
      return;
    }

    inFlightTicketPromise = (async () => {
      try {
        const res = await fetchAllGrievanceApplicationsAction();
        let finalCount = 0;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          finalCount = res.data.length;
        } else if (typeof window !== 'undefined') {
          try {
            const localRaw = localStorage.getItem('amravati_citizen_tracking_tickets');
            const localTickets = localRaw ? JSON.parse(localRaw) : [];
            if (Array.isArray(localTickets) && localTickets.length > 0) {
              finalCount = localTickets.length;
            }
          } catch {}
        }
        cachedTicketCount = finalCount;
        lastTicketCountFetchTime = Date.now();
        return finalCount;
      } catch {
        return cachedTicketCount ?? 0;
      } finally {
        inFlightTicketPromise = null;
      }
    })();

    const countResult = await inFlightTicketPromise;
    setCount(countResult);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void refreshCount(); }, 0);

    const handleUpdate = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.event === 'LOGOUT' || getCookieValue('citizen_is_logged_in') !== 'true') {
        clearTicketCountCache();
        setCount(0);
        return;
      }
      void refreshCount(true);
    };

    window.addEventListener(TRACKING_UPDATE_EVENT, handleUpdate);
    window.addEventListener('citizen-auth-change', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(TRACKING_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('citizen-auth-change', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshCount]);

  return count;
}
