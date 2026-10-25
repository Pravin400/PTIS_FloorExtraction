import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

function safeNum(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function useMoujaSubZoneUrl(defaultMoujaId?: string) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  const urlMoujaId = sp.get("moujaId") ?? defaultMoujaId ?? "";
  const urlMoujaSearch = sp.get("moujaSearch") ?? "";
  const urlSubZoneSearch = sp.get("subZoneSearch") ?? "";

  const buildHref = useCallback(
    (next: {
      moujaId?: string;
      moujaPn?: number;
      moujaPs?: number;
      subZonePn?: number;
      subZonePs?: number;
      moujaSearch?: string;
      subZoneSearch?: string;
      moujaSortBy?: string;
      moujaSortOrder?: string;
      subZoneSortBy?: string;
      subZoneSortOrder?: string;
    }) => {
      const qs = new URLSearchParams(sp.toString());

      const moujaId = 'moujaId' in next ? (next.moujaId ?? "") : (qs.get("moujaId") ?? defaultMoujaId ?? "");
      const moujaPn = next.moujaPn ?? safeNum(qs.get("moujaPn"), 1);
      const moujaPs = next.moujaPs ?? safeNum(qs.get("moujaPs"), 10);
      const subZonePn = next.subZonePn ?? safeNum(qs.get("subZonePn"), 1);
      const subZonePs = next.subZonePs ?? safeNum(qs.get("subZonePs"), 10);

      const moujaSearch = next.moujaSearch !== undefined ? next.moujaSearch : (qs.get("moujaSearch") ?? "");
      const subZoneSearch = next.subZoneSearch !== undefined ? next.subZoneSearch : (qs.get("subZoneSearch") ?? "");

      const moujaSortBy = next.moujaSortBy !== undefined ? next.moujaSortBy : (qs.get("moujaSortBy") ?? "");
      const moujaSortOrder = next.moujaSortOrder !== undefined ? next.moujaSortOrder : (qs.get("moujaSortOrder") ?? "");

      const subZoneSortBy = next.subZoneSortBy !== undefined ? next.subZoneSortBy : (qs.get("subZoneSortBy") ?? "");
      const subZoneSortOrder = next.subZoneSortOrder !== undefined ? next.subZoneSortOrder : (qs.get("subZoneSortOrder") ?? "");

      const params = new URLSearchParams();

      if (moujaId) {
        params.set("moujaId", moujaId);
      }

      params.set("moujaPn", String(moujaPn));
      params.set("moujaPs", String(moujaPs));

      if (moujaId) {
        params.set("subZonePn", String(subZonePn));
        params.set("subZonePs", String(subZonePs));
      }

      if (moujaSearch.trim()) {
        params.set("moujaSearch", moujaSearch.trim());
      }
      if (subZoneSearch.trim()) {
        params.set("subZoneSearch", subZoneSearch.trim());
      }

      if (moujaSortBy) {
        params.set("moujaSortBy", moujaSortBy);
        params.set("moujaSortOrder", moujaSortOrder || "asc");
      }
      if (subZoneSortBy) {
        params.set("subZoneSortBy", subZoneSortBy);
        params.set("subZoneSortOrder", subZoneSortOrder || "asc");
      }

      return `${pathname}?${params.toString()}`;
    },
    [sp, pathname, defaultMoujaId]
  );

  const pushUrl = useCallback(
    (next: Parameters<typeof buildHref>[0]) => {
      const href = buildHref(next);
      router.push(href);
    },
    [router, buildHref]
  );

  const replaceUrl = useCallback(
    (next: Parameters<typeof buildHref>[0]) => {
      const href = buildHref(next);
      router.replace(href);
    },
    [router, buildHref]
  );

  return {
    urlMoujaId,
    urlMoujaSearch,
    urlSubZoneSearch,
    pushUrl,
    replaceUrl,
  };
}
