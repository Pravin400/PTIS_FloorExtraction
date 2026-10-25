"use client";

import { useSyncExternalStore, useCallback } from "react";

/**
 * Custom React hook for evaluating CSS media queries with full SSR safety.
 * Uses useSyncExternalStore to eliminate hydration tearing and layout flicker.
 *
 * @param query CSS media query string, e.g. "(min-width: 1024px)"
 * @param serverFallback Default fallback value during server-side rendering (default false)
 * @returns boolean indicating whether the media query currently matches
 */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined" || !("matchMedia" in window)) {
        return () => {};
      }
      const mediaQueryList = window.matchMedia(query);
      
      // Modern event listener with fallback for legacy browsers
      if (typeof mediaQueryList.addEventListener === "function") {
        mediaQueryList.addEventListener("change", callback);
        return () => mediaQueryList.removeEventListener("change", callback);
      } else if (typeof (mediaQueryList as unknown as { addListener?: (cb: () => void) => void }).addListener === "function") {
        (mediaQueryList as unknown as { addListener: (cb: () => void) => void }).addListener(callback);
        return () => {
          (mediaQueryList as unknown as { removeListener: (cb: () => void) => void }).removeListener(callback);
        };
      }
      return () => {};
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return serverFallback;
    }
    return window.matchMedia(query).matches;
  }, [query, serverFallback]);

  const getServerSnapshot = useCallback(() => serverFallback, [serverFallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
