'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ParamValue = string | number | null | undefined;

/**
 * URL is the source of truth for the revenue dashboard's filter / pagination state.
 * This hook patches whitelisted search params and navigates within a transition so
 * the screen can surface a non-blocking "syncing" indicator while the server re-fetches.
 */
export function useRevenueUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParams = useCallback(
    (patch: Record<string, ParamValue>, options: { resetPage?: boolean } = {}) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === '' || value === 'all') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      if (options.resetPage) next.delete('pageNumber');

      const query = next.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  return { isPending, setParams, searchParams };
}
