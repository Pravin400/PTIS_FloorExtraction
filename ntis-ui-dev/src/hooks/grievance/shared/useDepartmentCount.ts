'use client';

/**
 * useDepartmentCount Hook
 * Symmetrical Layer: src/hooks/grievance/shared/useDepartmentCount.ts
 *
 * Keeps sidebar and navigation badges in real-time sync with Department Master.
 * Listens to custom window events & cross-tab storage events whenever a department
 * is added, updated, or deleted.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchDepartmentsAction } from '@/lib/actions/grievance/admin/grievance-department-master.actions';

const EVENT_NAME = 'grievance:department-count-changed';
const STORAGE_KEY = 'grievance:department-count';

// Module-level cache so there is no flicker or empty state on page navigation
let cachedDepartmentCount: number | null = null;
let lastDeptCountFetchTime = 0;
let inFlightDeptPromise: Promise<number | null> | null = null;
const DEPT_COUNT_TTL_MS = 30_000;

/**
 * Notify all active listeners (sidebar, widgets, modals) that department count changed
 */
export function notifyDepartmentCountChanged(count?: number): void {
  if (typeof count === 'number' && !isNaN(count)) {
    cachedDepartmentCount = count;
    lastDeptCountFetchTime = Date.now();
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { count: cachedDepartmentCount },
      })
    );
    if (typeof cachedDepartmentCount === 'number') {
      try {
        localStorage.setItem(STORAGE_KEY, String(cachedDepartmentCount));
      } catch {
        // Storage unavailable or disabled
      }
    }
  }
}

export function useDepartmentCount() {
  const [count, setCount] = useState<number | null>(() => {
    if (cachedDepartmentCount !== null) return cachedDepartmentCount;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed)) {
            cachedDepartmentCount = parsed;
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => cachedDepartmentCount === null);

  const refreshCount = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedDepartmentCount !== null && now - lastDeptCountFetchTime < DEPT_COUNT_TTL_MS) {
      setCount(cachedDepartmentCount);
      setLoading(false);
      return;
    }

    if (inFlightDeptPromise) {
      const result = await inFlightDeptPromise;
      if (result !== null) setCount(result);
      setLoading(false);
      return;
    }

    inFlightDeptPromise = (async () => {
      try {
        const res = await fetchDepartmentsAction({ pageSize: 1, status: 'active' });
        if (res.success && res.data && typeof res.data.total === 'number') {
          const total = res.data.total;
          cachedDepartmentCount = total;
          lastDeptCountFetchTime = Date.now();
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY, String(total));
            } catch {
              // ignore
            }
          }
          return total;
        }
        return cachedDepartmentCount;
      } catch {
        return cachedDepartmentCount;
      } finally {
        inFlightDeptPromise = null;
      }
    })();

    const result = await inFlightDeptPromise;
    if (result !== null) setCount(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    // Initial fetch if count is not yet loaded
    if (cachedDepartmentCount === null) {
      timer = setTimeout(() => { void refreshCount(); }, 0);
    }

    // In-memory / same-tab window event listener
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ count?: number }>;
      const nextCount = customEvent.detail?.count;
      if (typeof nextCount === 'number' && !isNaN(nextCount)) {
        cachedDepartmentCount = nextCount;
        lastDeptCountFetchTime = Date.now();
        setCount(nextCount);
      } else {
        void refreshCount(true);
      }
    };

    // Cross-tab storage listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const val = parseInt(e.newValue, 10);
        if (!isNaN(val)) {
          cachedDepartmentCount = val;
          lastDeptCountFetchTime = Date.now();
          setCount(val);
        }
      }
    };

    window.addEventListener(EVENT_NAME, handleEvent);
    window.addEventListener('storage', handleStorage);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(EVENT_NAME, handleEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshCount]);

  return {
    count,
    loading,
    refreshCount,
  };
}
