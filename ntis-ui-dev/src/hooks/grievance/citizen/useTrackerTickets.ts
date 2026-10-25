'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  trackGrievanceTicketAction,
  fetchAllGrievanceApplicationsAction,
} from '@/lib/actions/grievance/citizen/track-grievance.actions';
import {
  addRecentTrackedToken,
  getTrackingTicketsFromStorage,
  TRACKING_UPDATE_EVENT,
} from '@/lib/services/grievance';
import { getCookieValue } from '@/lib/utils/cookie';
import type { TrackingTicket } from '@/types/grievance';

// Module-level in-memory cache to preserve ticket details across route navigation and re-renders
const ticketDetailCache = new Map<string, TrackingTicket>();

export function clearTicketDetailCache(): void {
  ticketDetailCache.clear();
}

export function evictTicketDetailCache(tokenOrId: string): void {
  if (!tokenOrId) return;
  const clean = tokenOrId.trim().toLowerCase();
  ticketDetailCache.delete(clean);
  for (const [key, val] of ticketDetailCache.entries()) {
    if (key === clean || String(val.id).toLowerCase() === clean || val.token.toLowerCase() === clean) {
      ticketDetailCache.delete(key);
    }
  }
}

interface UseTrackerTicketsProps {
  initialTicketId?: string;
}

export function useTrackerTickets({ initialTicketId }: UseTrackerTicketsProps) {
  const searchParams = useSearchParams();
  const paramToken = searchParams.get('token');
  const paramView = searchParams.get('view') as 'list' | 'timeline' | null;

  const targetToken = (paramToken || initialTicketId || '').trim();
  const initialCached = targetToken ? ticketDetailCache.get(targetToken.toLowerCase()) || null : null;

  const [tickets, setTickets] = useState<TrackingTicket[]>(initialCached ? [initialCached] : []);
  const [selectedTicket, setSelectedTicket] = useState<TrackingTicket | null>(initialCached || null);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(!initialCached);
  const [mobileView, setMobileView] = useState<'list' | 'timeline'>(
    paramView || (initialTicketId || paramToken ? 'timeline' : 'list')
  );

  const updateUrlState = useCallback((token: string, view: 'list' | 'timeline') => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (token) {
      params.set('token', token);
    } else {
      params.delete('token');
    }
    params.set('view', view);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    // Defer URL history update so Next.js Router doesn't attempt setState during component rendering
    setTimeout(() => {
      try {
        window.history.replaceState(null, '', newUrl);
      } catch {}
    }, 0);
  }, []);

  /**
   * Unified ticket selection with in-memory detail cache.
   * If timeline details are already cached, switches state with 0 network calls.
   */
  const selectTicket = useCallback(async (ticketOrToken: TrackingTicket | string) => {
    const token = typeof ticketOrToken === 'string' ? ticketOrToken.trim() : ticketOrToken.token;
    if (!token) return;

    // Fast path: cached in memory
    const cached = ticketDetailCache.get(token.toLowerCase());
    if (cached) {
      setSelectedTicket(cached);
      return;
    }

    // Set immediate preview if ticket object provided
    if (typeof ticketOrToken !== 'string') {
      setSelectedTicket(ticketOrToken);
    }

    // Fetch full timeline details from database once and cache
    try {
      const res = await trackGrievanceTicketAction(token);
      if (res.success && res.data) {
        const fullTicket = res.data;
        ticketDetailCache.set(token.toLowerCase(), fullTicket);
        setSelectedTicket(fullTicket);
        setTickets((prev) =>
          prev.map((t) => (t.token.toLowerCase() === token.toLowerCase() ? fullTicket : t))
        );
      }
    } catch {
      // Retain existing preview on network failure
    }
  }, []);

  // 1. Initial Load & Auth Change effect
  useEffect(() => {
    let isMounted = true;

    const resetTicketsState = () => {
      if (!isMounted) return;
      setIsLoadingTickets(false);
      setTickets([]);
      setSelectedTicket(null);
    };

    const loadTickets = (optCitizenId?: string) => {
      setIsLoadingTickets(true);
      const isCitizenAuth =
        getCookieValue('citizen_is_logged_in') === 'true' ||
        Boolean(getCookieValue('citizen_mobile'));
      const isStaffAuth = getCookieValue('is_logged_in') === 'true';
      const isAuthenticated = isCitizenAuth || isStaffAuth;
      const citizenIdCookie = getCookieValue('citizen_id');
      const resolvedCitizenId = (optCitizenId || citizenIdCookie || '').trim() || undefined;
      const currentTargetToken = (paramToken || initialTicketId || '').trim();

      // Path 1: User explicitly tracking a specific token (SMS link, WhatsApp, URL param)
      if (currentTargetToken) {
        trackGrievanceTicketAction(currentTargetToken)
          .then((res) => {
            if (!isMounted) return;
            if (res.success && res.data) {
              const fullTicket = res.data;
              ticketDetailCache.set(currentTargetToken.toLowerCase(), fullTicket);
              setSelectedTicket(fullTicket);
              setTickets((prev) => {
                const filtered = prev.filter(
                  (t) =>
                    t.token.toLowerCase() !== currentTargetToken.toLowerCase() &&
                    t.id !== fullTicket.id
                );
                return [fullTicket, ...filtered];
              });
              setIsLoadingTickets(false);
              addRecentTrackedToken(fullTicket.token);
            } else if (!isAuthenticated && !resolvedCitizenId) {
              const storedTickets = getTrackingTicketsFromStorage();
              if (storedTickets.length > 0) {
                setTickets(storedTickets);
                setSelectedTicket(storedTickets[0]);
                setIsLoadingTickets(false);
              } else {
                resetTicketsState();
              }
            }
          })
          .catch(() => {
            if (!isMounted) return;
            if (!isAuthenticated && !resolvedCitizenId) {
              const storedTickets = getTrackingTicketsFromStorage();
              if (storedTickets.length > 0) {
                setTickets(storedTickets);
                setSelectedTicket(storedTickets[0]);
                setIsLoadingTickets(false);
              } else {
                resetTicketsState();
              }
            }
          });

        // Non-blocking background fetch: load past grievances into drawer list if authenticated
        if (isAuthenticated || resolvedCitizenId) {
          fetchAllGrievanceApplicationsAction(50, resolvedCitizenId)
            .then((res) => {
              if (!isMounted) return;
              if (res.success && res.data && res.data.length > 0) {
                const loadedTickets = res.data;
                setTickets((prev) => {
                  const currentSelected = prev.find(
                    (t) => t.token.toLowerCase() === currentTargetToken.toLowerCase() || t.id === currentTargetToken
                  );
                  const filtered = loadedTickets.filter(
                    (t) => t.token.toLowerCase() !== currentTargetToken.toLowerCase() && t.id !== currentTargetToken
                  );
                  return currentSelected ? [currentSelected, ...filtered] : loadedTickets;
                });
              }
            })
            .catch(() => {});
        }
        return;
      }

      // Path 2: Opened tracker without token, unauthenticated -> check localStorage for guest complaints
      if (!isAuthenticated && !resolvedCitizenId) {
        const storedTickets = getTrackingTicketsFromStorage();
        if (storedTickets.length > 0) {
          setTickets(storedTickets);
          const first = storedTickets[0];
          if (first) {
            void selectTicket(first);
          }
          setIsLoadingTickets(false);
          return;
        }
        resetTicketsState();
        return;
      }

      // Path 3: Opened tracker without token, authenticated
      fetchAllGrievanceApplicationsAction(50, resolvedCitizenId)
        .then((res) => {
          if (!isMounted) return;
          setIsLoadingTickets(false);

          if (res.success && res.data && res.data.length > 0) {
            const loadedTickets = res.data;
            setTickets(loadedTickets);
            const first = loadedTickets[0];
            if (first) {
              addRecentTrackedToken(first.token);
              void selectTicket(first);
            }
          } else {
            const storedTickets = getTrackingTicketsFromStorage();
            if (storedTickets.length > 0) {
              setTickets(storedTickets);
              const first = storedTickets[0];
              if (first) {
                void selectTicket(first);
              }
            } else {
              resetTicketsState();
            }
          }
        })
        .catch(() => {
          if (!isMounted) return;
          const storedTickets = getTrackingTicketsFromStorage();
          if (storedTickets.length > 0) {
            setTickets(storedTickets);
            const first = storedTickets[0];
            if (first) {
              void selectTicket(first);
            }
            setIsLoadingTickets(false);
          } else {
            resetTicketsState();
          }
        });
    };

    // Load immediately on mount
    loadTickets();

    const handleTrackingUpdate = () => loadTickets();

    const handleAuthChange = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const isCitizenAuth = getCookieValue('citizen_is_logged_in') === 'true';
      const isStaffAuth = getCookieValue('is_logged_in') === 'true';
      if (detail?.event === 'LOGOUT' || (!isCitizenAuth && !isStaffAuth)) {
        clearTicketDetailCache();
        resetTicketsState();
        return;
      }
      const cid = detail?.citizenId ? String(detail.citizenId) : getCookieValue('citizen_id');
      loadTickets(cid);
    };

    window.addEventListener(TRACKING_UPDATE_EVENT, handleTrackingUpdate);
    window.addEventListener('citizen-auth-change', handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener(TRACKING_UPDATE_EVENT, handleTrackingUpdate);
      window.removeEventListener('citizen-auth-change', handleAuthChange);
    };
  }, [initialTicketId, paramToken, selectTicket]);

  // 2. Respond to browser back/forward buttons safely via popstate
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const view = params.get('view') as 'list' | 'timeline' | null;
      if (token) {
        const match = tickets.find(
          (t) => t.token.toLowerCase() === token.toLowerCase() || t.id === token
        );
        if (match) void selectTicket(match);
      }
      if (view) setMobileView(view);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tickets, selectTicket]);

  return {
    tickets,
    selectedTicket,
    isLoadingTickets,
    mobileView,
    setTickets,
    setSelectedTicket,
    setMobileView,
    selectTicket,
    updateUrlState,
    paramToken,
  };
}
