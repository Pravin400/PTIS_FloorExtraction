import { cache } from "react";
import { getActiveAliasLabels } from "@/lib/api/configuration-settings/alias-master/alias-master.service";
import { ALIAS_LOCALE_COLUMN, isAliasLocale } from "./alias-locale-map";

/**
 * Resolves the active Alias Master overrides for one locale, projected down to a
 * flat keyName -> label map. The underlying fetch is Next.js Data-Cache-backed
 * (see getActiveAliasLabels), so this only causes a DB round-trip at most once per
 * cache TTL / revalidateTag bust — not once per request or per locale switch.
 *
 * Wrapped in React's cache() so multiple Server Components rendered within the same
 * request (e.g. Sidebar, Header, page content) share one resolution per request.
 */
export const getAliasLabelsForLocale = cache(async (locale: string): Promise<Record<string, string>> => {
  const column = isAliasLocale(locale) ? ALIAS_LOCALE_COLUMN[locale] : ALIAS_LOCALE_COLUMN.en;

  let map: Awaited<ReturnType<typeof getActiveAliasLabels>>;
  try {
    map = await getActiveAliasLabels();
  } catch {
    // Alias overlay is purely additive — never let it break a page if the API is down.
    return {};
  }

  const labels: Record<string, string> = {};
  for (const [keyName, names] of Object.entries(map)) {
    const value = names[column];
    if (value) labels[keyName] = value;
  }
  return labels;
});
