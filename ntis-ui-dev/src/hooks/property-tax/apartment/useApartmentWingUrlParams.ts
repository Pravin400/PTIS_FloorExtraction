'use client';

import { useCallback } from 'react';

export function useApartmentWingUrlParams() {
  const setWingParams = useCallback((updates: Record<string, string | null>) => {
    if (typeof window === 'undefined') return;

    try {
      const url = new URL(window.location.href);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, value);
        }
      });

      // Update URL in browser without triggering full Next.js Server Component reload loop
      window.history.replaceState(null, '', url.toString());

      // Notify client-side listeners and trigger searchParams update in components
      window.dispatchEvent(new CustomEvent('ptis:wing-params-changed', { detail: updates }));
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      // Fallback safe no-op
    }
  }, []);

  return { setWingParams };
}

export { useApartmentWingUrlParams as useWingUrlParams };
