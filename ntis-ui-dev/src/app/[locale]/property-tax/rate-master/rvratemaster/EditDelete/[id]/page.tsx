import { PageContainer } from "@/components/common/PageContainer";
import RateMasterView from "@/components/modules/property-tax/RVRateMaster/RateMasterView";
import EditRateDrawer from "@/components/modules/property-tax/RVRateMaster/EditRateDrawer";
import {
  getZoneOptions,
  getUseGroupOptions,
  getZoneDescriptionsPaged,
  getAllZoneDescriptions,
  getConstructionTypes,
  getRateMasterById,
  getAssessmentYears,
  getRateMasterByFilters,
  getRateMasterPagedAction,
  getRateFrequencyPolicy,
  getRateUnitPolicy,
} from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";

import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";

const logger = createLogger('RvRateMasterEditDeletePage');

// Force dynamic rendering to ensure fresh data on each navigation
export const dynamic = 'force-dynamic';

export default async function EditRatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Get matrix pagination params from URL
  const matrixPage = Number(resolvedSearchParams?.matrixPage) || 1;
  const rawMatrixPageSize = Number(resolvedSearchParams?.matrixPageSize);
  const matrixPageSize = [100, 150, 200].includes(rawMatrixPageSize) ? rawMatrixPageSize : 100;

  // Check if this is bulk edit (id === "bulk")
  const isBulkEdit = resolvedParams.id === "bulk";

  if (isBulkEdit) {
    // Bulk edit: fetch dropdown options and fetch rates based on URL filters
    const [zones, useGroups, paginatedZonesResult, allZonesResult, rateCategories, assessmentYears, rateFrequencyPolicy, rateUnitPolicy] =
      await Promise.all([
        getZoneOptions(),
        getUseGroupOptions(),
        getZoneDescriptionsPaged(matrixPage, matrixPageSize),
        getAllZoneDescriptions(), // Fetch all zones for copy rates functionality
        getConstructionTypes(),
        getAssessmentYears(),
        getRateFrequencyPolicy(), // Fetch rate frequency policy configuration
        getRateUnitPolicy(), // Fetch rate unit policy configuration
      ]);


    // Get filter values from URL search params
    const urlZone = (resolvedSearchParams.zone as string) || "";
    const urlUseGroup = (resolvedSearchParams.useGroup as string) || "";
    const urlAssessmentYear = (resolvedSearchParams.assessmentYear as string) || (resolvedSearchParams.year as string) || "";

    // Use URL filters or fallback to first values (URL always takes precedence)
    const firstZone = urlZone || (zones && zones.length > 0 ? zones[0].value : "");
    const firstUseGroup = urlUseGroup || (useGroups && useGroups.length > 0 ? useGroups[0].value : "");
    const firstAssessmentYear = urlAssessmentYear || (assessmentYears && assessmentYears.length > 0 ? assessmentYears[0].value : "");

    const filterValues = {
      zone: firstZone,
      useGroup: firstUseGroup,
      year: firstAssessmentYear,
    };

    // Fetch backend rates based on URL filters (server-side)
    // This will re-fetch whenever URL params change via dropdown selections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let backendRates: any[] = [];
    if (firstZone && firstUseGroup && firstAssessmentYear) {
      try {
        backendRates = await getRateMasterByFilters(
          firstZone,
          firstUseGroup,
          firstAssessmentYear
        );
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error(`[EditDeletePage] API Error ${error.statusCode}:`, { responseText: error.responseText }, error);
        } else {
          logger.error('[EditDeletePage] Error fetching rates for bulk edit:', undefined, error as Error);
        }
        backendRates = [];
      }
    }

    // Prepare paginated zones data for the form
    const paginatedZonesData = {
      items: paginatedZonesResult.items,
      totalPages: paginatedZonesResult.totalPages,
      totalCount: paginatedZonesResult.totalCount,
      pageNumber: matrixPage,
      pageSize: matrixPageSize,
    };

    // Detect mode from searchParams
    const urlMode = typeof resolvedSearchParams.mode === "string" ? resolvedSearchParams.mode : "edit";
    return (
      <>
        <PageContainer className="pt-24">
          <RateMasterView
            rateMasterData={[]}
            zones={zones ?? []}
            useGroups={useGroups ?? []}
            assessmentYears={assessmentYears ?? []}
            rateCategories={rateCategories ?? []}
            rateUnitPolicy={rateUnitPolicy}
          />
        </PageContainer>
        <EditRateDrawer
          id="bulk"
          zones={zones}
          useGroups={useGroups}
          assessmentYears={assessmentYears}
          zoneDescriptions={paginatedZonesResult.items}
          allZones={allZonesResult} // All zones (unpaginated) for copy rates functionality
          rateCategories={rateCategories}
          bulkEditData={[]}
          backendRates={backendRates}
          filterValues={filterValues}
          mode={urlMode === "delete" ? "delete" : "edit"}
          paginatedZonesData={paginatedZonesData}
          rateFrequencyPolicy={rateFrequencyPolicy}
          rateUnitPolicy={rateUnitPolicy}
        />
      </>
    );
  }

  // Single record edit logic
  const [zones, useGroups, paginatedZonesResult, allZonesResult, rateCategories, assessmentYears, editData, rateFrequencyPolicy, rateUnitPolicy] =
    await Promise.all([
      getZoneOptions(),
      getUseGroupOptions(),
      getZoneDescriptionsPaged(matrixPage, matrixPageSize),
      getAllZoneDescriptions(), // Fetch all zones for copy rates functionality
      getConstructionTypes(),
      getAssessmentYears(),
      getRateMasterById(resolvedParams.id, matrixPage, matrixPageSize),
      getRateFrequencyPolicy(), // Fetch rate frequency policy configuration
      getRateUnitPolicy(), // Fetch rate unit policy configuration
    ]);

  // Extract filter values from URL or editData
  const selectedZone = (resolvedSearchParams.zone as string) || editData?.rateSection || "";
  const selectedUseGroup = (resolvedSearchParams.useGroup as string) || editData?.useGroup || "";
  const selectedYear = (resolvedSearchParams.assessmentYear as string) || editData?.assessmentYear || "";

  // Get all zone descriptions for mapping
  const allZoneDescriptions = allZonesResult;
  // Get taxZoneIds for the current page of zones (for server-side filtering)
  const paginatedTaxZoneIds = paginatedZonesResult.items.map(z => z.taxZoneId);

  // Fetch filtered table data for the grid
  const ratesResult = await getRateMasterPagedAction(
    1,
    -1,
    rateCategories,
    allZoneDescriptions,
    selectedZone,
    selectedUseGroup,
    selectedYear,
    paginatedTaxZoneIds
  );
  const tableData = ratesResult.items;

  // Prepare paginated zones data for the form
  const paginatedZonesData = {
    items: paginatedZonesResult.items,
    totalPages: paginatedZonesResult.totalPages,
    totalCount: paginatedZonesResult.totalCount,
    pageNumber: matrixPage,
    pageSize: matrixPageSize,
  };

  return (
    <>
      <PageContainer className="pt-24">
        <RateMasterView
          rateMasterData={tableData ?? []}
          zones={zones ?? []}
          useGroups={useGroups ?? []}
          assessmentYears={assessmentYears ?? []}
          rateCategories={rateCategories ?? []}
          rateUnitPolicy={rateUnitPolicy}
        />
      </PageContainer>
      <EditRateDrawer
        id={resolvedParams.id}
        zones={zones}
        useGroups={useGroups}
        assessmentYears={assessmentYears}
        zoneDescriptions={paginatedZonesResult.items}
        allZones={allZonesResult} // All zones (unpaginated) for copy rates functionality
        rateCategories={rateCategories}
        editData={editData}
        filterValues={{
          zone: selectedZone,
          useGroup: selectedUseGroup,
          year: selectedYear,
        }}
        paginatedZonesData={paginatedZonesData}
        rateFrequencyPolicy={rateFrequencyPolicy}
        rateUnitPolicy={rateUnitPolicy}
      />
    </>
  );
}
