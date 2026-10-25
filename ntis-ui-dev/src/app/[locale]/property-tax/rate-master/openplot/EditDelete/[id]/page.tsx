import { PageContainer } from "@/components/common/PageContainer";
import RateMasterView from "@/components/modules/property-tax/RVRateMaster/RateMasterView";
import EditRateDrawer from "@/components/modules/property-tax/RVRateMaster/EditRateDrawer";
import {
  getZoneOptions,
  getZoneDescriptionsPaged,
  getAllZoneDescriptions,
  getRateMasterById,
  getAssessmentYears,
  getRateMasterByFilters,
  getRateMasterPagedAction,
  getRateFrequencyPolicy,
  getRateUnitPolicy,
  getOpenPlotTypeOfUseDetailsAction
} from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import { ITypeOfUseDetails } from "@/types/RVRateMaster";

import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";

const logger = createLogger('OpenPlotEditDeletePage');

// Force dynamic rendering to ensure fresh data on each navigation
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EditOpenPlotRatePage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Get matrix pagination params from URL
  const matrixPage = Number(resolvedSearchParams?.matrixPage) || 1;
  const rawMatrixPageSize = Number(resolvedSearchParams?.matrixPageSize);
  const matrixPageSize = [100, 150, 200].includes(rawMatrixPageSize) ? rawMatrixPageSize : 100;

  // Check if this is bulk edit (id === "bulk")
  const isBulkEdit = resolvedParams.id === "bulk";

  const [zones, typeofuseDetailsResult, paginatedZonesResult, allZonesResult, assessmentYears, rateFrequencyPolicy, rateUnitPolicy] =
    await Promise.all([
      getZoneOptions(),
      getOpenPlotTypeOfUseDetailsAction(),
      getZoneDescriptionsPaged(matrixPage, matrixPageSize),
      getAllZoneDescriptions(), // Fetch all zones for copy rates functionality
      getAssessmentYears(),
      getRateFrequencyPolicy(), // Fetch rate frequency policy configuration
      getRateUnitPolicy(), // Fetch rate unit policy configuration
    ]);

  const typeofuseDetails = typeofuseDetailsResult.items || [];

  // Map typeofuse to RateCategory structure for table headers (distinct typeOfUseGroupId)
  const distinctGroupIds = new Set<number>();
  const rateCategories = typeofuseDetails
    .filter((tu: ITypeOfUseDetails) => {
      const groupId = tu.typeOfUseGroupId;
      if (groupId && !distinctGroupIds.has(groupId)) {
        distinctGroupIds.add(groupId);
        return true;
      }
      return false;
    })
    .map((tu: ITypeOfUseDetails) => {
      const associated = typeofuseDetails
        .filter((item: ITypeOfUseDetails) => item.typeOfUseGroupId === tu.typeOfUseGroupId)
        .map((item: ITypeOfUseDetails) => ({
          code: item.typeOfUseCode || "",
          description: item.description || ""
        }));
      return {
        constructionId: String(tu.id),
        constructionCode: tu.typeOfUseCode || String(tu.id),
        description: tu.description || "",
        typeOfUseGroupId: tu.typeOfUseGroupId,
        typeOfUseGroupCode: tu.typeOfUseGroupCode,
        groupName: tu.groupName,
        associatedUseTypes: associated
      };
    });

  // Map distinct typeofuseGroupId to distinct useGroups for Open Plot
  const distinctGroups = new Map<number, string>();
  typeofuseDetails.forEach((tu: ITypeOfUseDetails) => {
    if (tu.typeOfUseGroupId && tu.groupName) {
      distinctGroups.set(tu.typeOfUseGroupId, tu.groupName);
    }
  });
  const openPlotUseGroups = Array.from(distinctGroups.entries()).map(([id, name]) => ({
    value: String(id),
    label: name
  }));

  if (isBulkEdit) {
    // Get filter values from URL search params
    const urlZone = (resolvedSearchParams.zone as string) || "";
    const urlAssessmentYear = (resolvedSearchParams.assessmentYear as string) || (resolvedSearchParams.year as string) || "";

    // Use URL filters or fallback to first values (URL always takes precedence)
    const firstZone = urlZone || (zones && zones.length > 0 ? zones[0].value : "");
    const firstAssessmentYear = urlAssessmentYear || (assessmentYears && assessmentYears.length > 0 ? assessmentYears[0].value : "");

    const filterValues = {
      zone: firstZone,
      useGroup: "ALL",
      year: firstAssessmentYear,
    };

    // Fetch backend rates based on URL filters (server-side)
    // This will re-fetch whenever URL params change via dropdown selections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let backendRates: any[] = [];
    if (firstZone && firstAssessmentYear) {
      try {
        backendRates = await getRateMasterByFilters(
          firstZone,
          "ALL",
          firstAssessmentYear
        );
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error(`[OpenPlotEditDeletePage] API Error ${error.statusCode}:`, { responseText: error.responseText }, error);
        } else {
          logger.error("[OpenPlotEditDeletePage] Error fetching rates for bulk edit:", undefined, error as Error);
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
            useGroups={openPlotUseGroups}
            assessmentYears={assessmentYears ?? []}
            rateCategories={rateCategories ?? []}
            rateUnitPolicy={rateUnitPolicy}
            isOpenPlot={true}
          />
        </PageContainer>
        <EditRateDrawer
          id="bulk"
          zones={zones}
          useGroups={openPlotUseGroups}
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
          isOpenPlot={true}
        />
      </>
    );
  }

  // Single record edit logic (fallback)
  const editData = await getRateMasterById(resolvedParams.id, matrixPage, matrixPageSize);

  // Extract filter values from URL or editData
  const selectedZone = (resolvedSearchParams.zone as string) || editData?.rateSection || "";
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
    "ALL",
    selectedYear,
    paginatedTaxZoneIds,
    true
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
          useGroups={openPlotUseGroups}
          assessmentYears={assessmentYears ?? []}
          rateCategories={rateCategories ?? []}
          rateUnitPolicy={rateUnitPolicy}
          isOpenPlot={true}
        />
      </PageContainer>
      <EditRateDrawer
        id={resolvedParams.id}
        zones={zones}
        useGroups={openPlotUseGroups}
        assessmentYears={assessmentYears}
        zoneDescriptions={paginatedZonesResult.items}
        allZones={allZonesResult} // All zones (unpaginated) for copy rates functionality
        rateCategories={rateCategories}
        editData={editData}
        filterValues={{
          zone: selectedZone,
          useGroup: "ALL",
          year: selectedYear,
        }}
        paginatedZonesData={paginatedZonesData}
        rateFrequencyPolicy={rateFrequencyPolicy}
        rateUnitPolicy={rateUnitPolicy}
        isOpenPlot={true}
      />
    </>
  );
}
