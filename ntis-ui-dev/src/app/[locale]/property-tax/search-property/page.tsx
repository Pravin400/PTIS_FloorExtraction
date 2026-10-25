import React from "react";
import { PropertySearch } from "@/components/modules/property-tax/search-property";
import {
  PROPERTY_STATUSES,
  type LookupOptions,
  type PropertySearchPageProps,
  type PropertySearchRawParams,
  type PropertyStatus,
  type SearchCriteria,
  type SearchTab,
  type WardOption,
  type ZoneOption,
  type PropertyDescriptionOption,
  type CardFilterParams,
} from "@/types/property-search";
import type { PropertyAssessmentStatusOption } from "@/types/property-assessment-status.types";
import {
  LEGACY_TYPE_FILTER_VALUES,
} from "@/components/modules/property-tax/search-property/constants";
import {
  filterPropertiesAction,
  listLookupOptionsAction,
  listPropertyAssessmentStatusesAction,
  listPropertyCategoriesAction,
  listPropertyWorkflowStagesAction,
  listWardsByZoneAction,
  listZonesAction,
  listAllWardsAction,
} from "./action";

const EMPTY_LOOKUP = {
  propertyNos: [] as string[],
  oldPropertyNos: [] as string[],
  upicIds: [] as string[],
  csns: [] as string[],
  subZoneNos: [] as string[],
};

/* ================= SANITIZATION ================= */

const VALID_TABS = ["quick-search", "kyc", "values-dues"] as const;

const trim = (value: string | undefined): string => (value ?? "").trim();

function toInt(raw: string | undefined): number {
  const parsed = parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function sanitizeStatus(raw: string | undefined): PropertyStatus | null {
  if (!raw) return null;
  return (PROPERTY_STATUSES as readonly string[]).includes(raw)
    ? (raw as PropertyStatus)
    : null;
}

function hasKycParams(raw: PropertySearchRawParams): boolean {
  return (
    trim(raw.holderName) !== "" ||
    trim(raw.occupierName) !== "" ||
    trim(raw.mobile) !== "" ||
    trim(raw.shopBuildingName) !== "" ||
    trim(raw.societyName) !== "" ||
    trim(raw.address) !== ""
  );
}

function sanitizeTab(
  raw: string | undefined,
  rawParams: PropertySearchRawParams
): SearchTab {
  if (raw && (VALID_TABS as readonly string[]).includes(raw)) {
    return raw as SearchTab;
  }
  if (hasKycParams(rawParams)) {
    return "kyc";
  }
  return "quick-search";
}

function sanitizePropertyType(raw: string | undefined): string {
  const id = toInt(raw);
  return id > 0 ? String(id) : "";
}

function sanitizeTypeFilter(raw: string | undefined): string {
  const value = trim(raw);
  if (!value) return "";
  if (/^\d+$/.test(value)) {
    return value;
  }
  const typeFilterOptionMap: Record<string, string> = {
    geoSequencing: "1",
    internalSurvey: "2",
    dataEntry: "3",
    assessment: "4",
    approvalByUlb: "5",
    noticeDistribution: "6",
    hearingAndAppeal: "7",
    billDistribution: "8",
    billGeneration: "9",
  };
  if (value in typeFilterOptionMap) {
    return typeFilterOptionMap[value];
  }
  const legacyMapped = LEGACY_TYPE_FILTER_VALUES[value];
  if (legacyMapped && legacyMapped in typeFilterOptionMap) {
    return typeFilterOptionMap[legacyMapped];
  }
  return "";
}

function buildCriteria(raw: PropertySearchRawParams): SearchCriteria {
  return {
    propertyType: sanitizePropertyType(raw.propertyType),
    typeFilter: sanitizeTypeFilter(raw.typeFilter),
    propertyDescription: trim(raw.propertyDescription),
    zoneId: toInt(raw.zoneId as string | undefined),
    wardId: toInt(raw.wardId as string | undefined),
    scanQR: trim(raw.scanQR),
    propertyNoFrom: trim(raw.propertyNoFrom),
    propertyNoTo: trim(raw.propertyNoTo),
    oldPropertyNo: trim(raw.oldPropertyNo),
    upicId: trim(raw.upicId),
    citySurveyNo: trim(raw.citySurveyNo),
    subZoneNo: trim(raw.subZoneNo),
    plotNo: trim(raw.plotNo),
    holderName: trim(raw.holderName),
    occupierName: trim(raw.occupierName),
    mobile: trim(raw.mobile),
    shopBuildingName: trim(raw.shopBuildingName),
    societyName: trim(raw.societyName),
    address: trim(raw.address),
    valuesZone: trim(raw.valuesZone),
    valuesWard: trim(raw.valuesWard),
    valuationMethod: trim(raw.valuationMethod),
    rateableValueFilter: trim(raw.rateableValueFilter),
    rateableValueFrom: trim(raw.rateableValueFrom),
    rateableValueTo: trim(raw.rateableValueTo),
    capitalValueFilter: trim(raw.capitalValueFilter),
    capitalValueFrom: trim(raw.capitalValueFrom),
    capitalValueTo: trim(raw.capitalValueTo),
    taxDefaulter: trim(raw.taxDefaulter),
    taxDefaulterFromValue: trim(raw.taxDefaulterFromValue),
    taxDefaulterToValue: trim(raw.taxDefaulterToValue),
    betweenValue: trim(raw.betweenValue),
  };
}

function resolveSearchCriteriaForFetch(
  criteria: SearchCriteria,
  isSearchActive: boolean,
  selectedStatus: PropertyStatus | null
): SearchCriteria {
  if (isSearchActive || selectedStatus !== null) {
    return criteria;
  }

  // Keep default table data until the user clicks Search or a stat card.
  return { ...criteria, zoneId: 0, wardId: 0 };
}

/* ================= PAGE ================= */

export const dynamic = "force-dynamic";

export default async function PropertySearchPage({
  searchParams,
}: PropertySearchPageProps): Promise<React.ReactElement> {
  const raw = await searchParams;
  const pageNumber = toInt(raw.pageNumber as string | undefined) || 1;
  const pageSize = toInt(raw.pageSize as string | undefined) || 10;
  const selectedStatus = sanitizeStatus(raw.status);
  const initialCriteria = buildCriteria(raw);
  const activeTab = sanitizeTab(raw.tab, raw);
  const isSearchActive = raw.isActive === "1";
  const searchCriteriaForFetch = resolveSearchCriteriaForFetch(
    initialCriteria,
    isSearchActive,
    selectedStatus
  );

  const hasZone = initialCriteria.zoneId > 0;

  // Determine if any dropdown filter is applied during an active search
  const hasDropdownFilter =
    isSearchActive &&
    (!!initialCriteria.propertyType ||
     !!initialCriteria.typeFilter ||
     !!initialCriteria.propertyDescription ||
     initialCriteria.zoneId > 0 ||
     initialCriteria.wardId > 0);

  const cardFilterParams: CardFilterParams | undefined = hasDropdownFilter
    ? {
        propertyAssessmentStatusId: initialCriteria.propertyType ? parseInt(initialCriteria.propertyType, 10) : undefined,
        workflowStageId: initialCriteria.typeFilter ? parseInt(initialCriteria.typeFilter, 10) : undefined,
        propertyDescriptionId: initialCriteria.propertyDescription ? parseInt(initialCriteria.propertyDescription, 10) : undefined,
        zoneId: initialCriteria.zoneId > 0 ? initialCriteria.zoneId : undefined,
        wardId: initialCriteria.wardId > 0 ? initialCriteria.wardId : undefined,
      }
    : undefined;

  // Parallel SSR fetches. Fast master data and search grid render instantly.
  // Dashboard card counts are loaded asynchronously in the background.
  const [zones, propertyAssessmentStatuses, propertyCategories, propertyWorkflowStages, wards, lookup, searchOutcome, allWards] =
    await Promise.all([
      listZonesAction(),
      listPropertyAssessmentStatusesAction(),
      listPropertyCategoriesAction(),
      listPropertyWorkflowStagesAction(),
      hasZone
        ? listWardsByZoneAction(initialCriteria.zoneId)
        : Promise.resolve([]),
      hasZone
        ? listLookupOptionsAction(initialCriteria.zoneId, initialCriteria.wardId)
        : Promise.resolve(EMPTY_LOOKUP),
      filterPropertiesAction(
        selectedStatus,
        searchCriteriaForFetch,
        isSearchActive,
        activeTab,
        pageNumber,
        pageSize
      ),
      listAllWardsAction(),
    ]);

  const propertyTypeOptions: PropertyAssessmentStatusOption[] =
    propertyAssessmentStatuses;

  const propertyDescriptionOptions: PropertyDescriptionOption[] =
    propertyCategories.map((category) => ({
      id: category.id,
      label: category.propertyCategoryName,
    }));

  const zoneOptions: ZoneOption[] = zones.map((z) => {
    const zoneNo = z.zoneNo?.trim();
    const desc = z.description?.trim();
    const label =
      zoneNo && desc && zoneNo !== desc ? `${zoneNo} - ${desc}` : desc || zoneNo || "";
    return {
      id: z.zoneId,
      label,
    };
  });

  const wardOptions: WardOption[] = wards
    .filter((w) => w.zoneId === initialCriteria.zoneId)
    .map((w) => ({
      id: w.wardId,
      label: w.wardNo?.trim() ? w.wardNo : w.description || "",
      zoneId: w.zoneId,
    }));

  const allWardOptions: WardOption[] = allWards.map((w) => {
    const wardNo = w.wardNo?.trim();
    const desc = w.description?.trim();
    const label = wardNo || desc || "";
    return {
      id: w.wardId,
      label,
      zoneId: w.zoneId,
    };
  });

  const lookupOptions: LookupOptions = {
    propertyNos: lookup.propertyNos,
    oldPropertyNos: lookup.oldPropertyNos,
    upicIds: lookup.upicIds,
    csns: lookup.csns,
    subZoneNos: lookup.subZoneNos,
  };

  return (
    <PropertySearch
      results={searchOutcome.results}
      totalCount={searchOutcome.totalCount}
      pageNumber={pageNumber}
      pageSize={pageSize}
      cardFilterParams={cardFilterParams}
      zoneOptions={zoneOptions}
      wardOptions={wardOptions}
      allWardOptions={allWardOptions}
      propertyTypeOptions={propertyTypeOptions}
      workflowStageOptions={propertyWorkflowStages}
      propertyDescriptionOptions={propertyDescriptionOptions}
      lookupOptions={lookupOptions}
      selectedStatus={selectedStatus}
      isSearchActive={isSearchActive}
      activeTab={activeTab}
      criteria={initialCriteria}
      searchError={null}
    />
  );
}
