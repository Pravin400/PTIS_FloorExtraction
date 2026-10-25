'use client';

import { useParams, useRouter } from 'next/navigation';

/**
 * Locale-aware router hook.
 *
 * Replaces the fragile `pathname.split('/')[0]` pattern for extracting the
 * current locale. Uses the idiomatic Next.js `useParams()` hook which correctly
 * reads the `[locale]` dynamic segment from the URL.
 *
 * Usage:
 * ```tsx
 * const { locale, push } = useLocaleRouter();
 * push('/some/path'); // → navigates to /{locale}/some/path
 * ```
 */
export function useLocaleRouter() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return {
    /** Current locale extracted from the URL `[locale]` segment. */
    locale,
    /**
     * Navigate to a path, automatically prefixed with the current locale.
     * @param path - Path without locale prefix, e.g. `/assets/municipal-Asset/...`
     */
    push: (path: string) => router.push(`/${locale}${path}`),
    /**
     * Replace current route, automatically prefixed with the current locale.
     * @param path - Path without locale prefix
     */
    replace: (path: string) => router.replace(`/${locale}${path}`),
  };
}
