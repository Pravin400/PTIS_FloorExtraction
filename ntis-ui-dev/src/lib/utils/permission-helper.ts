/**
 * Strips known tab/view sub-segments that share a parent screen entry in the database.
 * This ensures sibling tabs (e.g. /floor and /subfloor under /floormaster) resolve
 * to the same parent permission record.
 *
 * @param path The URL path or route path to normalize.
 * @returns A clean, normalized path string for matching.
 */
export function cleanPath(path: string): string {
  return (
    path
      .toLowerCase()
      .trim()
      // Strip known tab/view sub-segments that share a parent screen entry.
      // Add new tab segment names here when new tabbed pages are introduced.
      .replace(
        /\/(sub-?floor|floor|rateablevalue|capitalvalue|moujamaster|rvratemaster|tap-type|tap-size|tap-status|taxzone|taxzoning|age-weightage|nature-weightage|sub-type-weightage|active|inactive|pending|approved|rejected|list|detail|details)(\/|$)/gi,
        '$2'
      )
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
  );
}
