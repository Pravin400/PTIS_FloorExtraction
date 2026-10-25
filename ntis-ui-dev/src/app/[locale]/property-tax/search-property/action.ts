"use server";

import type {
  PropertyStatus,
  SearchCriteria,
  SearchResult,
  SearchTab,
  CardFilterParams,
  MainCardsResponse,
  WorkflowCardItem,
  PropertySearchCriteriaPayload,
} from "@/types/property-search";
import type {
  ZoneApiResponse,
  WardApiResponse,
  LookupOptionsApiResponse,
} from "@/types/property-search";
import type { PropertyAssessmentStatusOption } from "@/types/property-assessment-status.types";
import type { PropertyCategory } from "@/types/property-category.types";
import type { PropertyWorkflowStageOption } from "@/types/property-workflow-stage-master.types";
import { getPropertyAssessmentStatuses } from "@/lib/api/property-assessment-status.service";
import { getPropertyCategories } from "@/lib/api/property-category.service";
import { getPropertyWorkflowStages } from "@/lib/api/property-workflow-stage-master.service";
import { buildPropertySearchPayload } from "@/lib/api/property-search/build-search-payload";
import {
  searchProperties,
  fetchLookupOptions,
  fetchWardsByZone,
  fetchZones,
  fetchMainCards,
  fetchWorkflowCards,
  fetchApartmentUnitList,
  fetchAllWards,
} from "@/lib/api/property-search";
import { resolveSearchErrorMessage } from "@/lib/api/property-search/resolve-search-error-message";
import { hasTabSearchInput } from "@/components/modules/property-tax/search-property/search-field-groups";
import { logger } from "@/lib/utils/logger";

/* ================= CONSTANTS ================= */


function parsePositiveInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseNumericPart(value: string): number | null {
  const match = value.match(/^\d+/);
  if (match) {
    const parsed = parseInt(match[0], 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function comparePropertyNo(a: string, b: string): number {
  const cleanA = a.trim();
  const cleanB = b.trim();

  const numA = parseNumericPart(cleanA);
  const numB = parseNumericPart(cleanB);

  if (numA !== null && numB !== null) {
    if (numA !== numB) {
      return numA - numB;
    }
    return cleanA.localeCompare(cleanB, undefined, { numeric: true, sensitivity: "base" });
  }

  if (numA !== null) return -1;
  if (numB !== null) return 1;

  return cleanA.localeCompare(cleanB, undefined, { numeric: true, sensitivity: "base" });
}

function filterByPropertyNumberRange(
  results: SearchResult[],
  searchCriteria: SearchCriteria
): SearchResult[] {
  const fromRaw = searchCriteria.propertyNoFrom?.trim() || "";
  let toRaw = searchCriteria.propertyNoTo?.trim() || "";

  if (fromRaw && !toRaw) {
    toRaw = fromRaw;
  }

  if (!fromRaw && !toRaw) {
    return results;
  }

  const hasAlpha = (str: string) => /[a-zA-Z]/.test(str);

  if (hasAlpha(fromRaw) || hasAlpha(toRaw)) {
    return results.filter((item) => {
      const itemPropNo = (item.propertyNo || "").trim();
      const itemPart = (item.partitionNo || "").trim();
      const itemCombined = itemPart ? `${itemPropNo}-${itemPart}` : itemPropNo;

      const compareFrom = comparePropertyNo(itemCombined, fromRaw);
      if (compareFrom < 0) return false;

      const compareTo = comparePropertyNo(itemCombined, toRaw);
      if (compareTo > 0) return false;

      return true;
    });
  }

  const [fromPropNoStr, ...fromPartArr] = fromRaw.split("-");
  const fromPart = fromPartArr.join("-").trim();
  const fromPropNo = parsePositiveInteger(fromPropNoStr);

  const [toPropNoStr, ...toPartArr] = toRaw.split("-");
  const toPart = toPartArr.join("-").trim();
  const toPropNo = parsePositiveInteger(toPropNoStr);

  return results.filter((item) => {
    const itemPropNo = parseNumericPart(item.propertyNo || "");
    const itemPart = item.partitionNo?.trim() || "";

    if (itemPropNo == null) return false;

    // Filter by property number bounds
    if (fromPropNo != null && itemPropNo < fromPropNo) return false;
    if (toPropNo != null && itemPropNo > toPropNo) return false;

    // Filter by partition number if property numbers match exactly the bounds
    if (fromPropNo != null && itemPropNo === fromPropNo && fromPart) {
      if (itemPart.localeCompare(fromPart, undefined, { numeric: true, sensitivity: 'base' }) < 0) {
        return false;
      }
    }

    if (toPropNo != null && itemPropNo === toPropNo && toPart) {
      if (itemPart.localeCompare(toPart, undefined, { numeric: true, sensitivity: 'base' }) > 0) {
        return false;
      }
    }

    return true;
  });
}

/* ================= ZONE / WARD / LOOKUP ================= */

export async function listZonesAction(): Promise<ZoneApiResponse[]> {
  return fetchZones();
}

export async function listWardsByZoneAction(
  zoneId: number
): Promise<WardApiResponse[]> {
  const resolvedZoneId = Number(zoneId);
  if (!Number.isFinite(resolvedZoneId) || resolvedZoneId <= 0) {
    return [];
  }
  return fetchWardsByZone(resolvedZoneId);
}

export async function listLookupOptionsAction(
  zoneId?: number | null,
  wardId?: number | null
): Promise<LookupOptionsApiResponse> {
  return fetchLookupOptions(zoneId, wardId);
}

export async function listPropertyAssessmentStatusesAction(): Promise<
  PropertyAssessmentStatusOption[]
> {
  try {
    const statuses = await getPropertyAssessmentStatuses();
    return statuses
      .filter((status) => status.isActive)
      .sort((a, b) => a.statusName.localeCompare(b.statusName, "en"))
      .map((status) => ({
        id: status.id,
        label: formatAssessmentStatusLabel(status.statusName),
      }));
  } catch (err) {
    logger.error("Failed to list property assessment statuses", { error: err as Error });
    return [];
  }
}

function formatAssessmentStatusLabel(statusName: string): string {
  return statusName
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function listPropertyCategoriesAction(): Promise<
  PropertyCategory[]
> {
  try {
    const categories = await getPropertyCategories();
    return categories
      .filter((category) => category.isActive)
      .sort((a, b) =>
        a.propertyCategoryName.localeCompare(b.propertyCategoryName, "mr")
      );
  } catch (err) {
    logger.error("Failed to list property categories", { error: err as Error });
    return [];
  }
}

export async function listPropertyWorkflowStagesAction(): Promise<
  PropertyWorkflowStageOption[]
> {
  try {
    const stages = await getPropertyWorkflowStages();
    return stages
      .filter((stage) => stage.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((stage) => ({
        id: stage.id,
        stageName: stage.stageName,
        description: stage.description,
      }));
  } catch (err) {
    logger.error("Failed to list property workflow stages", { error: err as Error });
    return [];
  }
}

/* ================= MAIN SEARCH ================= */

const MAX_SEARCH_PAGE_SIZE = 100;

/**
 * Wraps the .NET `/api/Property/search` endpoint.
 *
 * Stat cards set `DashboardFilter` (1–6) via the URL `status` param.
 * Form search (`isActive=1`) adds tab-specific Quick Search / KYC filters.
 * Applies bounded server-side pagination to guarantee safe Node.js memory footprint.
 */
export async function filterPropertiesAction(
  selectedStatus: PropertyStatus | null,
  searchCriteria: SearchCriteria,
  isSearchActive: boolean,
  activeTab: SearchTab,
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<{ results: SearchResult[]; totalCount: number; error: string | null }> {
  if (!isSearchActive && !selectedStatus) {
    return { results: [], totalCount: 0, error: null };
  }

  if (isSearchActive && !selectedStatus && !hasTabSearchInput(searchCriteria, activeTab)) {
    return { results: [], totalCount: 0, error: null };
  }

  const isRangeSearch =
    isSearchActive &&
    activeTab === "quick-search" &&
    !!searchCriteria.propertyNoFrom &&
    !!searchCriteria.propertyNoTo &&
    searchCriteria.propertyNoFrom !== searchCriteria.propertyNoTo;

  const isKycNameSearch =
    isSearchActive &&
    activeTab === "kyc" &&
    !!searchCriteria.occupierName?.trim();

  const isTopSearch =
    isSearchActive &&
    activeTab === "values-dues" &&
    searchCriteria.rateableValueFilter === "top";

  const boundedPageSize = Math.min(Math.max(pageSize, 1), MAX_SEARCH_PAGE_SIZE);
  let apiPageSize = boundedPageSize;
  let apiPageNumber: number | undefined = pageNumber;
  
  if (isTopSearch) {
    apiPageSize = Math.min(parsePositiveInteger(searchCriteria.rateableValueFrom || "") ?? 1, MAX_SEARCH_PAGE_SIZE);
    apiPageNumber = 1;
  }

  const payload = buildPropertySearchPayload(
    selectedStatus,
    searchCriteria,
    isSearchActive,
    activeTab,
    apiPageNumber,
    apiPageSize
  );

  try {
    let sortedResults: SearchResult[] = [];
    let totalCount = 0;

    if (isKycNameSearch) {
      const nameQuery = searchCriteria.occupierName.trim();
      const ownerPayload = {
        ...payload,
        holderName: nameQuery,
        occupierName: undefined,
      };
      const occupierPayload = {
        ...payload,
        holderName: undefined,
        occupierName: nameQuery,
      };

      const [ownerResult, occupierResult] = await Promise.all([
        searchProperties(ownerPayload),
        searchProperties(occupierPayload),
      ]);

      const combined = [...(ownerResult.items ?? []), ...(occupierResult.items ?? [])];
      const seen = new Set<number>();
      const unique: SearchResult[] = [];
      for (const item of combined) {
        if (!seen.has(item.propertyId)) {
          seen.add(item.propertyId);
          unique.push(item);
        }
      }

      sortedResults = [...unique].sort((a, b) =>
        comparePropertyNo(a.propertyNo, b.propertyNo)
      );
      totalCount = (ownerResult.totalCount || 0) + (occupierResult.totalCount || 0);
    } else {
      const result = await searchProperties(payload);
      const normalizedResults = result.items ?? [];

      const shouldEnforcePropertyNoRange =
        isSearchActive && activeTab === "quick-search";

      const filteredResults = shouldEnforcePropertyNoRange
        ? filterByPropertyNumberRange(normalizedResults, searchCriteria)
        : normalizedResults;

      sortedResults = [...filteredResults].sort((a, b) =>
        comparePropertyNo(a.propertyNo, b.propertyNo)
      );
      totalCount = result.totalCount;
    }

    return {
      results: sortedResults,
      totalCount: isRangeSearch ? sortedResults.length : totalCount,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error
          ? resolveSearchErrorMessage(err)
          : "Property search failed. Please review your filters and try again.";

    logger.error("Property search failed", { error: err as Error });
    return { results: [], totalCount: 0, error: message };
  }
}

/* ================= STATS ================= */

export async function getMainCardsAction(params?: CardFilterParams): Promise<MainCardsResponse | null> {
  return fetchMainCards(params);
}

export async function getWorkflowCardsAction(params?: CardFilterParams): Promise<WorkflowCardItem[]> {
  return fetchWorkflowCards(params);
}

/* ================= WARD OPTIONS (legacy signature kept for compat) ================= */

export async function getWardOptionsAction(zone: string): Promise<string[]> {
  // Legacy mock signature kept; new code should call `listWardsByZoneAction`
  // with a numeric zoneId. Stub returns an empty array.
  void zone;
  return [];
}

export async function listAllWardsAction(): Promise<WardApiResponse[]> {
  return fetchAllWards();
}

export async function fetchApartmentUnitListAction(
  propertyId: number,
  criteriaPayload?: PropertySearchCriteriaPayload
): Promise<{ items: SearchResult[] | null; totalCount: number; error: string | null }> {
  try {
    const res = await fetchApartmentUnitList(propertyId, criteriaPayload);
    return { items: res.items, totalCount: res.totalCount, error: null };
  } catch (err) {
    logger.error(`Failed to fetch apartment unit list for property ${propertyId}`, { error: err as Error });
    return {
      items: null,
      totalCount: 0,
      error: err instanceof Error ? err.message : "Failed to fetch apartment unit list",
    };
  }
}
