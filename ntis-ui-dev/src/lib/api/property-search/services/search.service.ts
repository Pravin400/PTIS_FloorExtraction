/**
 * Property search + dashboard stats services.
 */

import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";
import type { PagedResponse } from "@/types/common.types";
import type { PropertySearchCriteriaPayload } from "@/types/property-search";
import type {
  SearchResult,
  CardFilterParams,
  MainCardsResponse,
  WorkflowCardItem,
} from "@/types/property-search";
import { normalizePropertySearchResponse, normalizePropertySearchItem, extractPropertySearchRawItems } from "../guards/property-item-guards";

const logger = createLogger("property-search/search");

function buildSearchParams(criteria: PropertySearchCriteriaPayload): string {
  const params = new URLSearchParams();
  if (criteria.zoneId) params.set("ZoneId", String(criteria.zoneId));
  if (criteria.wardId) params.set("WardId", String(criteria.wardId));
  if (criteria.categoryId) params.set("CategoryId", String(criteria.categoryId));
  if (criteria.propertyAssessmentStatusId) {
    params.set(
      "PropertyAssessmentStatusId",
      String(criteria.propertyAssessmentStatusId)
    );
  }
  if (criteria.workflowStageId) {
    params.set("WorkflowStageId", String(criteria.workflowStageId));
  }
  if (criteria.propertyNoFrom)
    params.set("PropertyNoFrom", criteria.propertyNoFrom);
  if (criteria.propertyNoTo) params.set("PropertyNoTo", criteria.propertyNoTo);
  if (criteria.oldPropertyNo)
    params.set("OldPropertyNo", criteria.oldPropertyNo);
  if (criteria.upicId) params.set("UPICId", criteria.upicId);
  if (criteria.citySurveyNo) params.set("CSN", criteria.citySurveyNo);
  if (criteria.subZoneNo) params.set("SubZoneNo", criteria.subZoneNo);
  if (criteria.plotNo) params.set("PlotNo", criteria.plotNo);
  if (criteria.holderName) params.set("OwnerName", criteria.holderName);
  if (criteria.occupierName) params.set("OccupierName", criteria.occupierName);
  if (criteria.mobile) params.set("MobileNo", criteria.mobile);
  if (criteria.shopBuildingName)
    params.set("FlatOrShopName", criteria.shopBuildingName);
  if (criteria.societyName) params.set("SocietyName", criteria.societyName);
  if (criteria.address) params.set("Address", criteria.address);
  if (criteria.dashboardFilter != null && criteria.dashboardFilter > 0) {
    params.set("DashboardFilter", String(criteria.dashboardFilter));
  }
  if (criteria.valuationMethod) {
    params.set("ValuationMethod", criteria.valuationMethod);
  }
  if (criteria.filterType) {
    params.set("FilterType", criteria.filterType);
  }
  if (criteria.valuationTypeFilter) {
    params.set("ValuationTypeFilter", criteria.valuationTypeFilter);
  }
  if (criteria.rvOrCv) params.set("RVorCV", criteria.rvOrCv);
  if (criteria.amountFilterOperator) {
    params.set("AmountFilterOperator", criteria.amountFilterOperator);
  }
  if (criteria.amountValue != null) {
    params.set("AmountValue", String(criteria.amountValue));
  }
  if (criteria.amountTo != null) {
    params.set("AmountTo", String(criteria.amountTo));
  }
  if (criteria.topCount != null) {
    params.set("TopCount", String(criteria.topCount));
  }
  if (criteria.pageSize != null) {
    params.set("PageSize", String(criteria.pageSize));
  }
  if (criteria.pageNumber != null) {
    params.set("PageNumber", String(criteria.pageNumber));
  }
  return params.toString();
}

export async function searchProperties(
  criteria: PropertySearchCriteriaPayload
): Promise<PagedResponse<SearchResult>> {
  const qs = buildSearchParams(criteria);
  const url = `/PropertySearch/search/grid?${qs}`;

  const response = await apiClient.get<unknown>(url);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to search properties",
      "Property search failed"
    );
  }

  return normalizePropertySearchResponse(response.data);
}

function buildCardParams(paramsObj: CardFilterParams): string {
  const params = new URLSearchParams();
  if (paramsObj.propertyAssessmentStatusId) {
    params.set("propertyAssessmentStatusId", String(paramsObj.propertyAssessmentStatusId));
  }
  if (paramsObj.workflowStageId) {
    params.set("workflowStageId", String(paramsObj.workflowStageId));
  }
  if (paramsObj.propertyDescriptionId) {
    params.set("propertyDescriptionId", String(paramsObj.propertyDescriptionId));
  }
  if (paramsObj.zoneId) {
    params.set("zoneId", String(paramsObj.zoneId));
  }
  if (paramsObj.wardId) {
    params.set("wardId", String(paramsObj.wardId));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchMainCards(
  params?: CardFilterParams
): Promise<MainCardsResponse | null> {
  try {
    const qs = params ? buildCardParams(params) : "";
    const response = await apiClient.get<{ items: MainCardsResponse }>(
      `/PropertySearch/search/dashboard/main-cards${qs}`
    );
    if (!response.success || response.data == null) {
      return null;
    }
    return response.data.items || null;
  } catch (error) {
    logger.error("Failed to fetch main cards", { error: error as Error });
    return null;
  }
}

export async function fetchWorkflowCards(
  params?: CardFilterParams
): Promise<WorkflowCardItem[]> {
  try {
    const qs = params ? buildCardParams(params) : "";
    const response = await apiClient.get<{ items: WorkflowCardItem[] }>(
      `/PropertySearch/search/dashboard/workflow-cards${qs}`
    );
    if (!response.success || response.data == null) {
      return [];
    }
    return response.data.items || [];
  } catch (error) {
    logger.error("Failed to fetch workflow cards", { error: error as Error });
    return [];
  }
}

function buildApartmentUnitListParams(
  propertyId: number,
  criteria?: PropertySearchCriteriaPayload
): string {
  const params = new URLSearchParams();
  params.set("propertyId", String(propertyId));

  if (!criteria) {
    return params.toString();
  }

  if (criteria.zoneId) {
    params.set("zoneId", String(criteria.zoneId));
    params.set("ZoneId", String(criteria.zoneId));
  }
  if (criteria.wardId) {
    params.set("wardId", String(criteria.wardId));
    params.set("WardId", String(criteria.wardId));
  }
  if (criteria.categoryId) {
    params.set("categoryId", String(criteria.categoryId));
    params.set("CategoryId", String(criteria.categoryId));
  }
  if (criteria.propertyAssessmentStatusId) {
    params.set(
      "propertyAssessmentStatusId",
      String(criteria.propertyAssessmentStatusId)
    );
    params.set(
      "PropertyAssessmentStatusId",
      String(criteria.propertyAssessmentStatusId)
    );
  }
  if (criteria.propertyNoFrom) {
    params.set("propertyNoFrom", criteria.propertyNoFrom);
    params.set("PropertyNoFrom", criteria.propertyNoFrom);
  }
  if (criteria.propertyNoTo) {
    params.set("propertyNoTo", criteria.propertyNoTo);
    params.set("PropertyNoTo", criteria.propertyNoTo);
  }
  if (criteria.oldPropertyNo) {
    params.set("oldPropertyNo", criteria.oldPropertyNo);
    params.set("OldPropertyNo", criteria.oldPropertyNo);
  }
  if (criteria.upicId) {
    params.set("upicId", criteria.upicId);
    params.set("UPICId", criteria.upicId);
  }
  if (criteria.citySurveyNo) {
    params.set("csn", criteria.citySurveyNo);
    params.set("CSN", criteria.citySurveyNo);
  }
  if (criteria.subZoneNo) {
    params.set("subZoneNo", criteria.subZoneNo);
    params.set("SubZoneNo", criteria.subZoneNo);
  }
  if (criteria.plotNo) {
    params.set("plotNo", criteria.plotNo);
    params.set("PlotNo", criteria.plotNo);
  }
  if (criteria.holderName) {
    params.set("ownerName", criteria.holderName);
    params.set("OwnerName", criteria.holderName);
  }
  if (criteria.occupierName) {
    params.set("occupierName", criteria.occupierName);
    params.set("OccupierName", criteria.occupierName);
  }
  if (criteria.mobile) {
    params.set("mobileNo", criteria.mobile);
    params.set("MobileNo", criteria.mobile);
  }
  if (criteria.shopBuildingName) {
    params.set("flatOrShopName", criteria.shopBuildingName);
    params.set("FlatOrShopName", criteria.shopBuildingName);
  }
  if (criteria.societyName) {
    params.set("societyName", criteria.societyName);
    params.set("SocietyName", criteria.societyName);
  }
  if (criteria.address) {
    params.set("address", criteria.address);
    params.set("Address", criteria.address);
  }
  if (criteria.dashboardFilter != null && criteria.dashboardFilter > 0) {
    params.set("dashboardFilter", String(criteria.dashboardFilter));
    params.set("DashboardFilter", String(criteria.dashboardFilter));
  }
  if (criteria.valuationMethod) {
    params.set("valuationMethod", criteria.valuationMethod);
    params.set("ValuationMethod", criteria.valuationMethod);
  }
  if (criteria.filterType) {
    params.set("filterType", criteria.filterType);
    params.set("FilterType", criteria.filterType);
  }
  if (criteria.amountValue != null) {
    params.set("amountValue", String(criteria.amountValue));
    params.set("AmountValue", String(criteria.amountValue));
  }
  if (criteria.amountTo != null) {
    params.set("amountTo", String(criteria.amountTo));
    params.set("AmountTo", String(criteria.amountTo));
  }
  if (criteria.topCount != null) {
    params.set("topCount", String(criteria.topCount));
    params.set("TopCount", String(criteria.topCount));
  }

  return params.toString();
}

function extractTotalCount(data: unknown, fallbackCount: number): number {
  if (!data || typeof data !== "object") {
    return fallbackCount;
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.totalCount === "number" && Number.isFinite(obj.totalCount)) {
    return obj.totalCount;
  }
  if (typeof obj.TotalCount === "number" && Number.isFinite(obj.TotalCount)) {
    return obj.TotalCount;
  }

  if (obj.data && typeof obj.data === "object") {
    const nestedData = obj.data as Record<string, unknown>;
    if (typeof nestedData.totalCount === "number" && Number.isFinite(nestedData.totalCount)) {
      return nestedData.totalCount;
    }
    if (typeof nestedData.TotalCount === "number" && Number.isFinite(nestedData.TotalCount)) {
      return nestedData.TotalCount;
    }
  }

  if (obj.items && typeof obj.items === "object" && !Array.isArray(obj.items)) {
    const nestedItems = obj.items as Record<string, unknown>;
    if (typeof nestedItems.totalCount === "number" && Number.isFinite(nestedItems.totalCount)) {
      return nestedItems.totalCount;
    }
    if (typeof nestedItems.TotalCount === "number" && Number.isFinite(nestedItems.TotalCount)) {
      return nestedItems.TotalCount;
    }
  }

  return fallbackCount;
}

export async function fetchApartmentUnitList(
  propertyId: number,
  criteria?: PropertySearchCriteriaPayload
): Promise<{ items: SearchResult[]; totalCount: number }> {
  const qs = buildApartmentUnitListParams(propertyId, criteria);
  const response = await apiClient.get<unknown>(
    `/PropertySearch/search/apartmentunitlist?${qs}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to fetch apartment unit list",
      "Apartment unit list retrieval failed"
    );
  }

  const rawItems = extractPropertySearchRawItems(response.data);
  const items = rawItems.map((item) => normalizePropertySearchItem(item as Record<string, unknown>));
  const totalCount = extractTotalCount(response.data, items.length);

  return { items, totalCount };
}

