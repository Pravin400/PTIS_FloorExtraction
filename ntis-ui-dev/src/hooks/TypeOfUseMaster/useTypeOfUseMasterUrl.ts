import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

function safeNum(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function useTypeOfUseMasterUrl() {
  const router = useRouter();
  const sp = useSearchParams();
  const locale = useLocale();

  const urlGroupId = sp.get("groupId") ?? "ALL";
  const urlTypeId = sp.get("typeId") ?? "";
  const urlQ = sp.get("q") ?? "";

  const pushUrl = useCallback(
    (next: {
      groupId?: string;
      typeId?: string;
      pn?: number;
      ps?: number;
      typePn?: number;
      typePs?: number;
      q?: string;
      typeSearch?: string;
    }) => {
      const qs = new URLSearchParams(sp.toString());

      const groupId = next.groupId ?? qs.get("groupId") ?? "";
      const typeId = 'typeId' in next
        ? (next.typeId ?? "")
        : (qs.get("typeId") ?? "");
      const pn = next.pn ?? safeNum(qs.get("pn"), 1);
      const ps = next.ps ?? safeNum(qs.get("ps"), 5);
      const typePn = next.typePn ?? safeNum(qs.get("typePn"), 1);
      const typePs = next.typePs ?? safeNum(qs.get("typePs"), 10);
      const q = next.q ?? qs.get("q") ?? "";
      const typeSearch = next.typeSearch !== undefined ? next.typeSearch : (qs.get("typeSearch") ?? "");

      const params = new URLSearchParams();

      if (groupId) {
        params.set("groupId", groupId);
      }

      if (typeId && typeId !== "__NONE__") {
        params.set("typeId", typeId);
      }

      if (typeId && typeId !== "__NONE__") {
        params.set("pn", String(pn));
        params.set("ps", String(ps));
      }

      params.set("typePn", String(typePn));
      params.set("typePs", String(typePs));

      if (q && q.trim()) {
        params.set("q", q.trim());
      }

      if (typeSearch?.trim()) {
        params.set("typeSearch", typeSearch.trim());
      }

      const href = `/${locale}/property-tax/typeofusemaster?${params.toString()}`;
      router.push(href);
    },
    [router, sp, locale]
  );

  return {
    urlGroupId,
    urlTypeId,
    urlQ,
    pushUrl,
  };
}
