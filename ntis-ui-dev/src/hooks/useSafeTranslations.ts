'use client';

import { useTranslations } from 'next-intl';

/**
 * Safely invokes useTranslations with a fallback translator if NextIntlClientProvider is missing.
 */
export function useSafeTranslations(namespace: string): (key: string) => string {
  try {
    return useTranslations(namespace);
  } catch (_error) {
    return (key: string) => key;
  }
}
