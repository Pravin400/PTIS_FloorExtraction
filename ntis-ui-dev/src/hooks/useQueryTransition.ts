'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export interface QueryUpdateOptions {
  scroll?: boolean;
  resetPage?: boolean;
  pageParamKey?: string;
}

/**
 * A reusable hook to handle URL query parameter updates with React transitions.
 * Helps prevent UI flickering and provides a loading state (isPending).
 */
export function useQueryTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateQueries = useCallback(
    (
      updates: Record<string, string | number | boolean | null | undefined>,
      options: QueryUpdateOptions = {}
    ) => {
      const { scroll = false, resetPage = false, pageParamKey = 'page' } = options;

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') {
            params.delete(key);
          } else {
            params.set(key, String(value));
          }
        });

        if (resetPage && pageParamKey) {
          params.delete(pageParamKey);
        }

        const queryString = params.toString();
        const currentQueryString = searchParams.toString();

        // Avoid redundant navigation if nothing changed
        if (queryString === currentQueryString) {
          return;
        }

        const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
        router.push(nextUrl, { scroll });
      });
    },
    [router, pathname, searchParams]
  );

  return {
    isPending,
    updateQueries,
    searchParams,
    pathname,
  };
}
