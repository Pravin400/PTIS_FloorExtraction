'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Shared auto-scroll controller for multiple synchronized tables.
 * When one table starts/stops, ALL registered tables stop.
 */
export function useSharedAutoScroll() {
  // Store stop callbacks from each registered table
  const stopCallbacksRef = useRef<Map<string, () => void>>(new Map());
  const [activeScrollerId, setActiveScrollerId] = useState<string | null>(null);

  /** Register a table's stop function */
  const register = useCallback((id: string, stopFn: () => void) => {
    stopCallbacksRef.current.set(id, stopFn);
    return () => {
      stopCallbacksRef.current.delete(id);
    };
  }, []);

  /** Stop ALL registered tables */
  const stopAll = useCallback(() => {
    stopCallbacksRef.current.forEach((fn) => fn());
    setActiveScrollerId(null);
  }, []);

  /** Mark which table is currently the "owner" of auto-scroll */
  const setActive = useCallback((id: string | null) => {
    setActiveScrollerId(id);
  }, []);

  return {
    register,
    stopAll,
    setActive,
    activeScrollerId,
  };
}

export type SharedAutoScrollController = ReturnType<typeof useSharedAutoScroll>;