import type { AuditorDashboardFilters } from "@/types/fire-audit/auditor.types";
import { parseAuditorFilters } from "@/types/fire-audit/auditor.types";

/**
 * Single source of truth for URL search parameter <-> AuditorDashboardFilters property mapping.
 * Used bidirectionally so param names (e.g., occupancyType <-> buildingType, q <-> searchTerm)
 * never diverge between the server (reading searchParams) and the client (writing searchParams).
 */
export const AUDITOR_FILTER_PARAM_MAPPINGS = [
  { filterKey: "searchTerm", paramKey: "q" },
  { filterKey: "status", paramKey: "status" },
  { filterKey: "appType", paramKey: "appType" },
  { filterKey: "buildingType", paramKey: "occupancyType" },
  { filterKey: "node", paramKey: "node" },
  { filterKey: "sector", paramKey: "sector" },
  { filterKey: "wardNo", paramKey: "wardNo" },
  { filterKey: "riskCategory", paramKey: "riskCategory" },
  { filterKey: "dateFilter", paramKey: "dateFilter" },
  { filterKey: "sortBy", paramKey: "sortBy" },
  { filterKey: "sortOrder", paramKey: "sortOrder" },
] as const satisfies readonly { filterKey: keyof AuditorDashboardFilters; paramKey: string }[];

/**
 * Parses and sanitizes search parameters into validated AuditorDashboardFilters.
 * Handles:
 * - URLSearchParams instances (from browser/client)
 * - Plain objects or Record<string, string | string[] | undefined> (from Next.js server searchParams)
 * - Query strings (e.g., "?occupancyType=Commercial&page=2")
 */
export function parseFiltersFromSearchParams(
  searchParamsInput: unknown
): AuditorDashboardFilters {
  let raw: Record<string, unknown> = {};

  if (
    (typeof URLSearchParams !== "undefined" &&
      searchParamsInput instanceof URLSearchParams) ||
    (typeof searchParamsInput === "object" &&
      searchParamsInput !== null &&
      "forEach" in searchParamsInput &&
      "get" in searchParamsInput)
  ) {
    const sp = searchParamsInput as URLSearchParams;
    sp.forEach((value, key) => {
      raw[key] = value;
    });
  } else if (typeof searchParamsInput === "object" && searchParamsInput !== null) {
    raw = searchParamsInput as Record<string, unknown>;
  } else if (typeof searchParamsInput === "string") {
    const sp = new URLSearchParams(searchParamsInput);
    sp.forEach((value, key) => {
      raw[key] = value;
    });
  }

  // Map URL parameter keys to filter object properties using the shared mapping
  const mapped: Record<string, unknown> = {
    page: raw.page,
    pageSize: raw.pageSize,
  };

  for (const { filterKey, paramKey } of AUDITOR_FILTER_PARAM_MAPPINGS) {
    const val = raw[paramKey] ?? raw[filterKey];
    if (val !== undefined) {
      mapped[filterKey] = val;
    }
  }

  return parseAuditorFilters(mapped);
}

/**
 * Serializes AuditorDashboardFilters into URLSearchParams.
 * Uses the shared AUDITOR_FILTER_PARAM_MAPPINGS so URL keys match server expectations.
 */
export function serializeFiltersToParams(
  filters: AuditorDashboardFilters,
  currentParams?: URLSearchParams | Record<string, unknown> | string,
  overridePage?: number
): URLSearchParams {
  const validated = parseFiltersFromSearchParams({
    ...filters,
    ...(overridePage !== undefined ? { page: overridePage } : {}),
  });

  const params =
    currentParams instanceof URLSearchParams ||
    (typeof currentParams === "object" &&
      currentParams !== null &&
      "forEach" in currentParams &&
      "get" in currentParams)
      ? new URLSearchParams(currentParams.toString())
      : typeof currentParams === "string"
        ? new URLSearchParams(currentParams)
        : new URLSearchParams();

  for (const { filterKey, paramKey } of AUDITOR_FILTER_PARAM_MAPPINGS) {
    const value = validated[filterKey];
    if (value) {
      params.set(paramKey, String(value));
    } else {
      params.delete(paramKey);
    }
  }

  const targetPage = overridePage ?? validated.page ?? 1;
  params.set("page", String(targetPage));

  const targetPageSize =
    validated.pageSize && validated.pageSize !== 10
      ? validated.pageSize
      : filters.pageSize && filters.pageSize !== 10 && [10, 25, 50, 100].includes(filters.pageSize)
        ? filters.pageSize
        : undefined;

  if (targetPageSize) {
    params.set("pageSize", String(targetPageSize));
  } else {
    params.delete("pageSize");
  }

  return params;
}
