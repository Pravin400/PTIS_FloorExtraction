/**
 * Shared PTIS navigation utilities.
 * Centralizes URL parameter manipulation for the PTIS module
 * to avoid duplicated `new URLSearchParams(...)` logic.
 *
 * @module ptis-navigation
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Builds a URLSearchParams from a server-side searchParams record,
 * preserving all existing params. This avoids using `window.location.search`
 * which is not reactive in Next.js App Router.
 */
function buildParamsFromRecord(
  searchParams: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v != null) params.append(key, v);
      });
      return;
    }
    params.set(key, value);
  });
  return params;
}

/**
 * Creates a row click handler for Rateable/Capital tax tables that
 * navigates to the floor edit drawer.
 *
 * Uses the `searchParams` prop (React state) instead of `window.location.search`
 * for SSR compatibility and consistent state management.
 *
 * @param searchParams - The current search params from the server component
 * @param locale - The current locale (e.g. 'en', 'mr', 'hi')
 * @param router - The Next.js App Router instance
 * @returns A handler function that accepts a row with an `id` property
 */
export function createFloorRowClickHandler(
  searchParams: Record<string, string | string[] | undefined>,
  locale: string,
  router: AppRouterInstance
) {
  return (row: { id?: number | string }) => {
    const params = buildParamsFromRecord(searchParams);
    if (row.id) {
      params.set('floorId', String(row.id));
    }
    // Remove drawer param to avoid opening AddFloorDrawer unintentionally
    params.delete('drawer');
    router.replace(`/${locale}/property-tax/ptis?${params.toString()}`, { scroll: false });
  };
}
