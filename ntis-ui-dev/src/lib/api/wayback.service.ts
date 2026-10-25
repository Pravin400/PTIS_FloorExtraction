export interface WaybackRelease {
  releaseId: number;
  date: string;
  year: number;
}

/**
 * Leaflet-compatible URL template for Wayback satellite tiles.
 * Uses `{z}`, `{y}`, `{x}` placeholders that Leaflet substitutes automatically.
 */
export const WAYBACK_MAP_TILE_URL = (releaseId: number): string =>
  `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${releaseId}/{z}/{y}/{x}`;

/**
 * Direct tile URL for static image previews (e.g. Change Detection card thumbnails).
 * Requires pre-computed tile coordinates (x, y, z).
 */
export const WAYBACK_STATIC_TILE_URL = (
  releaseId: number,
  x: number,
  y: number,
  z: number
): string =>
  `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${releaseId}/${z}/${y}/${x}`;

export const DEFAULT_WAYBACK_RELEASES: WaybackRelease[] = [
  { releaseId: 28163, date: '2015-12-16', year: 2015 },
  { releaseId: 25521, date: '2017-11-16', year: 2017 },
  { releaseId: 4756, date: '2019-12-12', year: 2019 },
  { releaseId: 29260, date: '2020-12-16', year: 2020 },
  { releaseId: 26120, date: '2021-12-21', year: 2021 },
  { releaseId: 45134, date: '2022-12-14', year: 2022 },
  { releaseId: 56102, date: '2023-12-07', year: 2023 },
  { releaseId: 16453, date: '2024-12-12', year: 2024 },
  { releaseId: 13192, date: '2025-12-18', year: 2025 },
  { releaseId: 32246, date: '2026-06-30', year: 2026 },
];

const TARGET_YEARS = [2015, 2017, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

export async function fetchWaybackReleases(): Promise<WaybackRelease[]> {
  try {
    const { getWaybackItems } = await import('@esri/wayback-core');
    const items = await getWaybackItems();

    interface IWaybackItem {
      itemTitle?: string;
      releaseDatetime: string | number | Date;
      releaseNum: number;
    }

    const byYear: Record<number, WaybackRelease> = {};
    if (Array.isArray(items)) {
      items.forEach((i: IWaybackItem) => {
        const match = /(\d{4}-\d{2}-\d{2})/.exec(i.itemTitle ?? '');
        const dateStr = match ? match[1] : new Date(i.releaseDatetime).toISOString().split('T')[0];
        const year = parseInt(dateStr.slice(0, 4), 10);
        if (isNaN(year) || !TARGET_YEARS.includes(year)) return;

        if (!byYear[year] || dateStr > byYear[year].date) {
          byYear[year] = {
            releaseId: i.releaseNum,
            date: dateStr,
            year,
          };
        }
      });

      const result = Object.values(byYear).sort((a, b) => a.year - b.year);
      if (result.length > 0) return result;
    }
  } catch {
    // Fallback to guaranteed working defaults below
  }

  return DEFAULT_WAYBACK_RELEASES;
}

export function getOldestWaybackRelease(releases?: WaybackRelease[]): WaybackRelease {
  if (releases && releases.length > 0) return releases[0];
  return DEFAULT_WAYBACK_RELEASES[0];
}

export function getLatestWaybackRelease(releases?: WaybackRelease[]): WaybackRelease {
  if (releases && releases.length > 0) return releases[releases.length - 1];
  return DEFAULT_WAYBACK_RELEASES[DEFAULT_WAYBACK_RELEASES.length - 1];
}

// Prefetch @esri/wayback-core during idle time so the module is cached
// before the user opens Change Detection, eliminating dynamic import latency.
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
    import('@esri/wayback-core').catch(() => {/* ignore prefetch errors */});
  });
} else if (typeof window !== 'undefined') {
  setTimeout(() => {
    import('@esri/wayback-core').catch(() => {/* ignore prefetch errors */});
  }, 2000);
}

export async function fetchLocalChanges(_lat: number, _lng: number): Promise<WaybackRelease[]> {
  return fetchWaybackReleases();
}
