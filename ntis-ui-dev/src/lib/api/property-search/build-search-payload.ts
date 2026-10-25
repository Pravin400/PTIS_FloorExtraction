import {
  applyTabSearchCriteria,
} from "@/components/modules/property-tax/search-property/search-field-groups";
import type { PropertySearchCriteriaPayload } from "@/types/property-search";
import type {
  PropertyStatus,
  SearchCriteria,
  SearchTab,
} from "@/types/property-search";
import {
  getDashboardFilterForStatus,
  getDashboardFilterForTypeFilter,
} from "./dashboard-filter";

function normalizeMobileForApi(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  return digits || undefined;
}

function parsePositiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const clean = value.replace(/,/g, "").trim();
  const parsed = Number(clean);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseAmount(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const clean = value.replace(/,/g, "").trim();
  if (!clean) return undefined;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function withPagination(
  payload: PropertySearchCriteriaPayload,
  pageNumber?: number,
  pageSize?: number
): PropertySearchCriteriaPayload {
  return {
    ...payload,
    pageNumber: pageNumber ?? 1,
    pageSize: pageSize ?? -1,
  };
}

function resolveDashboardFilter(
  selectedStatus: PropertyStatus | null,
  typeFilter: string,
  hasPropertyAssessmentStatus: boolean
): number {
  // Assessment status uses PropertyAssessmentStatusId — do not combine with dashboard filters.
  if (hasPropertyAssessmentStatus) {
    return 0;
  }
  return (
    getDashboardFilterForStatus(selectedStatus) ||
    getDashboardFilterForTypeFilter(typeFilter)
  );
}

/**
 * Maps UI search criteria to the .NET `/Property/search` query payload.
 * Only fields for the active tab are forwarded.
 */
export function buildPropertySearchPayload(
  selectedStatus: PropertyStatus | null,
  searchCriteria: SearchCriteria,
  isSearchActive: boolean,
  activeTab: SearchTab,
  pageNumber?: number,
  pageSize?: number
): PropertySearchCriteriaPayload {
  const propertyAssessmentStatusId = parseInt(searchCriteria.propertyType, 10);
  const hasPropertyAssessmentStatus =
    Number.isFinite(propertyAssessmentStatusId) &&
    propertyAssessmentStatusId > 0;

  const workflowStageId = parseInt(searchCriteria.typeFilter, 10);

  const payload: PropertySearchCriteriaPayload = {
    zoneId: searchCriteria.zoneId || undefined,
    wardId: searchCriteria.wardId || undefined,
    workflowStageId: Number.isFinite(workflowStageId) && workflowStageId > 0 ? workflowStageId : undefined,
    dashboardFilter: resolveDashboardFilter(
      selectedStatus,
      searchCriteria.typeFilter,
      hasPropertyAssessmentStatus
    ),
  };

  const categoryId = parseInt(searchCriteria.propertyDescription, 10);
  if (Number.isFinite(categoryId) && categoryId > 0) {
    payload.categoryId = categoryId;
  }

  if (hasPropertyAssessmentStatus) {
    payload.propertyAssessmentStatusId = propertyAssessmentStatusId;
  }

  if (!isSearchActive) {
    return withPagination(payload, pageNumber, pageSize);
  }

  const criteria = applyTabSearchCriteria(searchCriteria, activeTab);

  if (activeTab === "quick-search") {
    const propertyNoFromRaw = criteria.propertyNoFrom || undefined;
    const propertyNoToRaw = criteria.propertyNoTo || propertyNoFromRaw || undefined;

    const getBasePropertyNo = (raw: string): string => {
      const parts = raw.split("-");
      const base = parts[0];
      if (/^\d+$/.test(base)) {
        return base;
      }
      return raw;
    };

    let propertyNoFrom = propertyNoFromRaw ? getBasePropertyNo(propertyNoFromRaw) : undefined;
    let propertyNoTo = propertyNoToRaw ? getBasePropertyNo(propertyNoToRaw) : undefined;

    // If both from and to are specified and they are different, we do not pass them to the API payload
    // to avoid the broken backend string range comparison (e.g. "50" to "100").
    // The filtering will be done completely SSR on the Next.js server in the action.
    if (propertyNoFrom && propertyNoTo && propertyNoFrom !== propertyNoTo) {
      propertyNoFrom = undefined;
      propertyNoTo = undefined;
    }

    let upicId = criteria.upicId || undefined;
    const scanQR = criteria.scanQR?.trim();
    if (scanQR && scanQR.length === 15) {
      upicId = scanQR;
    }

    return withPagination({
      ...payload,
      propertyNoFrom,
      propertyNoTo,
      oldPropertyNo: criteria.oldPropertyNo || undefined,
      upicId,
      citySurveyNo: criteria.citySurveyNo || undefined,
      subZoneNo: criteria.subZoneNo || undefined,
      plotNo: criteria.plotNo || undefined,
    }, pageNumber, pageSize);
  }

  if (activeTab === "values-dues") {
    let valuationMethod: string | undefined = undefined;
    if (criteria.valuationMethod === "rv") {
      valuationMethod = "RV";
    } else if (criteria.valuationMethod === "cv") {
      valuationMethod = "CV";
    } else if (criteria.valuationMethod === "totalTax") {
      valuationMethod = "Total Tax";
    }

    let filterType: string | undefined = undefined;
    if (criteria.rateableValueFilter === "exact") {
      filterType = "exact value";
    } else if (criteria.rateableValueFilter === "moreThan") {
      filterType = "more than";
    } else if (criteria.rateableValueFilter === "lessThan") {
      filterType = "less than";
    } else if (criteria.rateableValueFilter === "between") {
      filterType = "between";
    } else if (criteria.rateableValueFilter === "top") {
      filterType = "top";
    }

    const baseValuesPayload: PropertySearchCriteriaPayload = {
      ...payload,
      valuationMethod,
    };

    if (!filterType) {
      return withPagination(baseValuesPayload, pageNumber, pageSize);
    }

    if (filterType === "between") {
      const amountValue = parseAmount(criteria.rateableValueFrom);
      const amountTo = parseAmount(criteria.rateableValueTo);
      if (amountValue == null || amountTo == null) {
        return withPagination(baseValuesPayload, pageNumber, pageSize);
      }
      return withPagination({
        ...baseValuesPayload,
        filterType,
        amountValue,
        amountTo,
      }, pageNumber, pageSize);
    }

    if (filterType === "top") {
      const topCount = parsePositiveNumber(criteria.rateableValueFrom) ?? 1;
      return withPagination({
        ...baseValuesPayload,
        filterType,
        topCount,
      }, pageNumber, pageSize);
    }

    const amountValue = parseAmount(criteria.rateableValueFrom);
    if (amountValue == null) {
      return withPagination(baseValuesPayload, pageNumber, pageSize);
    }
    return withPagination({
      ...baseValuesPayload,
      filterType,
      amountValue,
    }, pageNumber, pageSize);
  }

  return withPagination({
    ...payload,
    holderName: criteria.holderName || undefined,
    occupierName: criteria.occupierName || undefined,
    mobile: normalizeMobileForApi(criteria.mobile),
    shopBuildingName: criteria.shopBuildingName || undefined,
    societyName: criteria.societyName || undefined,
    address: criteria.address || undefined,
  }, pageNumber, pageSize);
}
