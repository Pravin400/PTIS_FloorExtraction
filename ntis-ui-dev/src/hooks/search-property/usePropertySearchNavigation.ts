"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type {
  PropertyStatus,
  SearchCriteria,
  SearchTab,
  UsePropertySearchNavigationProps,
} from "@/types/property-search";
import {
  applyTabSearchCriteria,
  clearTabFieldsFromParams,
  NON_PERSISTED_CRITERIA_FIELDS,
} from "@/components/modules/property-tax/search-property/search-field-groups";

/**
 * Hook for managing URL-based navigation and state updates.
 * All Property Search state lives in the URL; this hook mutates it.
 */
export function usePropertySearchNavigation({
  startTransition,
}: UsePropertySearchNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();

  /**
   * Build a URL with only the keys we want, dropping empty values.
   */
  const buildUrl = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(currentParams.toString());
      mutator(next);

      // Drop empty values to keep the URL tidy
      const cleaned = new URLSearchParams();
      next.forEach((value, key) => {
        if (value.trim() !== "") {
          cleaned.set(key, value);
        }
      });

      const qs = cleaned.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [currentParams, pathname]
  );

  /**
   * Navigate to a new URL with transition
   */
  const navigateTo = useCallback(
    (url: string) => {
      startTransition(() => {
        router.push(url, { scroll: false });
      });
    },
    [router, startTransition]
  );

  /**
   * Update search criteria in URL
   */
  const updateSearchCriteria = useCallback(
    (
      criteria: SearchCriteria,
      tab: SearchTab,
      status: PropertyStatus | null = null
    ) => {
      const tabCriteria = applyTabSearchCriteria(criteria, tab);
      const url = buildUrl((params) => {
        clearTabFieldsFromParams(params, tab);

        (Object.keys(tabCriteria) as Array<keyof SearchCriteria>).forEach((key) => {
          if (NON_PERSISTED_CRITERIA_FIELDS.has(key)) {
            params.delete(key);
            return;
          }

          const value = tabCriteria[key];
          if (key === "zoneId" || key === "wardId") {
            if (typeof value === "number" && value > 0) {
              params.set(key, String(value));
            } else {
              params.delete(key);
            }
            return;
          }

          if (typeof value === "string" && value.trim() !== "") {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        });

        if (tab === "quick-search") {
          params.delete("tab");
        } else {
          params.set("tab", tab);
        }

        if (status) {
          params.set("status", status);
        } else {
          params.delete("status");
        }

        params.set("isActive", "1");
        params.delete("pageNumber");
      });
      navigateTo(url);
    },
    [buildUrl, navigateTo]
  );

  /**
   * Reset all search parameters. Locale stays in the pathname; every query
   * param on this screen is search state, so we drop the entire query string.
   * Preserves the current tab if provided.
   */
  const resetSearch = useCallback(
    (tab?: SearchTab) => {
      if (tab && tab !== "quick-search") {
        navigateTo(`${pathname}?tab=${tab}`);
      } else {
        navigateTo(pathname);
      }
    },
    [navigateTo, pathname]
  );

  /**
   * Update tab selection
   */
  const updateTab = useCallback(
    (tab: SearchTab) => {
      const url = buildUrl((params) => {
        clearTabFieldsFromParams(params, tab);
        params.delete("isActive");
        params.delete("status");

        if (tab === "quick-search") {
          params.delete("tab");
        } else {
          params.set("tab", tab);
        }
      });
      navigateTo(url);
    },
    [buildUrl, navigateTo]
  );

  /**
   * Update zone and reset ward
   */
  const updateZone = useCallback(
    (zoneId: number, currentCriteria?: SearchCriteria) => {
      const tabParam = currentParams.get("tab");
      const activeTab: SearchTab = (tabParam === "kyc" || tabParam === "values-dues") ? tabParam : "quick-search";

      const url = buildUrl((params) => {
        if (zoneId > 0) {
          params.set("zoneId", String(zoneId));
        } else {
          params.delete("zoneId");
        }
        params.delete("wardId");
        params.delete("status");
        params.delete("pageNumber");
        params.delete("isActive");

        if (currentCriteria) {
          const tabCriteria = applyTabSearchCriteria(currentCriteria, activeTab);
          (Object.keys(tabCriteria) as Array<keyof SearchCriteria>).forEach((key) => {
            if (key === "zoneId" || key === "wardId" || NON_PERSISTED_CRITERIA_FIELDS.has(key)) {
              return;
            }
            const value = tabCriteria[key];
            if (typeof value === "string" && value.trim() !== "") {
              params.set(key, value);
            } else {
              params.delete(key);
            }
          });
        }
      });
      navigateTo(url);
    },
    [buildUrl, currentParams, navigateTo]
  );

  /**
   * Update ward selection
   */
  const updateWard = useCallback(
    (wardId: number, currentCriteria?: SearchCriteria) => {
      const tabParam = currentParams.get("tab");
      const activeTab: SearchTab = (tabParam === "kyc" || tabParam === "values-dues") ? tabParam : "quick-search";

      const url = buildUrl((params) => {
        if (wardId > 0) {
          params.set("wardId", String(wardId));
        } else {
          params.delete("wardId");
        }
        params.delete("status");
        params.delete("pageNumber");
        params.delete("isActive");

        if (currentCriteria) {
          const tabCriteria = applyTabSearchCriteria(currentCriteria, activeTab);
          (Object.keys(tabCriteria) as Array<keyof SearchCriteria>).forEach((key) => {
            if (key === "zoneId" || key === "wardId" || NON_PERSISTED_CRITERIA_FIELDS.has(key)) {
              return;
            }
            const value = tabCriteria[key];
            if (typeof value === "string" && value.trim() !== "") {
              params.set(key, value);
            } else {
              params.delete(key);
            }
          });
        }
      });
      navigateTo(url);
    },
    [buildUrl, currentParams, navigateTo]
  );

  /**
   * Update a draft search parameter in the URL immediately
   */
  const updateDraftCriteria = useCallback(
    (field: keyof SearchCriteria, value: string | number) => {
      const url = buildUrl((params) => {
        if (value !== undefined && String(value).trim() !== "") {
          params.set(field, String(value));
        } else {
          params.delete(field);
        }
        if (field === "zoneId") {
          params.delete("wardId");
        }
      });
      navigateTo(url);
    },
    [buildUrl, navigateTo]
  );

  /**
   * Update status filter
   */
  const updateStatus = useCallback(
    (status: string | null) => {
      const url = buildUrl((params) => {
        if (status) {
          params.set("status", status);
          params.delete("isActive");
          clearTabFieldsFromParams(params, "quick-search");
          clearTabFieldsFromParams(params, "kyc");
        } else {
          params.delete("status");
        }
        params.delete("pageNumber");
      });
      navigateTo(url);
    },
    [buildUrl, navigateTo]
  );

  const updatePage = useCallback(
    (page: number, size: number) => {
      const url = buildUrl((params) => {
        if (page > 1) {
          params.set("pageNumber", String(page));
        } else {
          params.delete("pageNumber");
        }
        if (size > 0 && size !== 10) {
          params.set("pageSize", String(size));
        } else {
          params.delete("pageSize");
        }
      });
      navigateTo(url);
    },
    [buildUrl, navigateTo]
  );

  return {
    updateSearchCriteria,
    resetSearch,
    updateTab,
    updateZone,
    updateWard,
    updateStatus,
    updateDraftCriteria,
    updatePage,
  };
}
