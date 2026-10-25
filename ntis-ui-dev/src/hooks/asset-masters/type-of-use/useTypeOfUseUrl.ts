import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { validateAndPrepareSearchTerm } from "./validation";

function safeNum(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function useTypeOfUseUrl() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  const urlTypeSearch = validateAndPrepareSearchTerm(sp.get("typeSearch") ?? "") ?? "";
  const urlSubTypeSearch = validateAndPrepareSearchTerm(sp.get("subTypeSearch") ?? "") ?? "";

  const buildHref = useCallback(
    (next: {
      selectedGroupId?: string | null;
      selectedTypeOfUseId?: string | null;
      typePn?: number;
      typePs?: number;
      subTypePn?: number;
      subTypePs?: number;
      typeSearch?: string;
      subTypeSearch?: string;
      assetCategoryId?: string | null;
      action?: string | null;
      id?: string | number | null;
      subTypeSortBy?: string | null;
      subTypeSortOrder?: string | null;
    }) => {
      const qs = new URLSearchParams(sp.toString());

      const selectedGroupId = 'selectedGroupId' in next
        ? (next.selectedGroupId ?? "")
        : (qs.get("selectedGroupId") ?? "");

      const selectedTypeOfUseId = 'selectedTypeOfUseId' in next
        ? (next.selectedTypeOfUseId ?? "")
        : (qs.get("selectedTypeOfUseId") ?? "");

      const assetCategoryId = 'assetCategoryId' in next
        ? (next.assetCategoryId ?? "")
        : (qs.get("assetCategoryId") ?? "");

      const action = 'action' in next
        ? (next.action ?? "")
        : (qs.get("action") ?? "");

      const id = 'id' in next
        ? (next.id ? String(next.id) : "")
        : (qs.get("id") ?? "");

      const subTypeSortBy = 'subTypeSortBy' in next
        ? (next.subTypeSortBy ?? "")
        : (qs.get("subTypeSortBy") ?? "");

      const subTypeSortOrder = 'subTypeSortOrder' in next
        ? (next.subTypeSortOrder ?? "")
        : (qs.get("subTypeSortOrder") ?? "");

      const typePn = next.typePn ?? safeNum(qs.get("typePn"), 1);
      const typePs = next.typePs ?? safeNum(qs.get("typePs"), 10);
      const subTypePn = next.subTypePn ?? safeNum(qs.get("subTypePn"), 1);
      const subTypePs = next.subTypePs ?? safeNum(qs.get("subTypePs"), 10);

      const typeSearch = next.typeSearch !== undefined ? next.typeSearch : (qs.get("typeSearch") ?? "");
      const subTypeSearch = next.subTypeSearch !== undefined ? next.subTypeSearch : (qs.get("subTypeSearch") ?? "");

      const params = new URLSearchParams();

      if (selectedGroupId) {
        params.set("selectedGroupId", selectedGroupId);
      }
      if (selectedTypeOfUseId) {
        params.set("selectedTypeOfUseId", selectedTypeOfUseId);
      }
      if (assetCategoryId) {
        params.set("assetCategoryId", assetCategoryId);
      }
      if (action) {
        params.set("action", action);
      }
      if (id) {
        params.set("id", id);
      }
      if (subTypeSortBy) {
        params.set("subTypeSortBy", subTypeSortBy);
      }
      if (subTypeSortOrder) {
        params.set("subTypeSortOrder", subTypeSortOrder);
      }

      params.set("typePn", String(typePn));
      params.set("typePs", String(typePs));

      params.set("subTypePn", String(subTypePn));
      params.set("subTypePs", String(subTypePs));

      const cleanTypeSearch = validateAndPrepareSearchTerm(typeSearch) ?? "";
      const cleanSubTypeSearch = validateAndPrepareSearchTerm(subTypeSearch) ?? "";

      if (cleanTypeSearch) {
        params.set("typeSearch", cleanTypeSearch);
      }
      if (cleanSubTypeSearch) {
        params.set("subTypeSearch", cleanSubTypeSearch);
      }

      return `${pathname}?${params.toString()}`;
    },
    [sp, pathname]
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
    urlTypeSearch,
    urlSubTypeSearch,
    pushUrl,
    replaceUrl,
  };
}
