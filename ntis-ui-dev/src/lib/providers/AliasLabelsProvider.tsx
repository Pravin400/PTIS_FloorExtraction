'use client';

import { createContext, useContext, ReactNode } from 'react';

interface AliasLabelsContextValue {
  /** keyName -> localized label override for the current locale, pre-resolved server-side. */
  labels: Record<string, string>;
}

const AliasLabelsContext = createContext<AliasLabelsContextValue | undefined>(undefined);

interface AliasLabelsProviderProps {
  children: ReactNode;
  labels: Record<string, string>;
}

export function AliasLabelsProvider({ children, labels }: AliasLabelsProviderProps) {
  return <AliasLabelsContext.Provider value={{ labels }}>{children}</AliasLabelsContext.Provider>;
}

/**
 * Unlike usePermissionsContext, this deliberately does NOT throw when no provider is
 * mounted. The alias overlay is a purely additive convenience — components using
 * useAliasLabel must keep working unchanged in unit tests, storybook, or any tree
 * rendered outside MainLayout, simply falling back to the static label in that case.
 */
export function useAliasLabelsContext(): AliasLabelsContextValue {
  const context = useContext(AliasLabelsContext);
  return context ?? { labels: {} };
}

/**
 * Looks up a runtime Alias Master override for `keyName` in the current locale.
 * Falls back to `fallback` (the existing static next-intl label) whenever no active
 * alias row exists for that key, its value for the current language is blank, or
 * no AliasLabelsProvider is mounted in the tree at all.
 * Never fetches on its own — reads from the pre-resolved Context populated once
 * server-side per request (see getAliasLabelsForLocale / AliasLabelsProvider mount).
 */
export function useAliasLabel(keyName: string, fallback: string): string {
  const { labels } = useAliasLabelsContext();
  return labels?.[keyName] || fallback;
}
