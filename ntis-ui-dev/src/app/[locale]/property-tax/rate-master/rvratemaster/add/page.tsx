import {PageContainer} from "@/components/common/PageContainer";
import RateMasterView from "@/components/modules/property-tax/RVRateMaster/RateMasterView";
import AddRateDrawer from "@/components/modules/property-tax/RVRateMaster/AddRateDrawer";
import {getAssessmentYears, getConstructionTypes, getUseGroupOptions, getAllZoneDescriptions, getZoneOptions, getRateMasterByFilters, getRateFrequencyPolicy, getRateUnitPolicy } from "../action";

// Force dynamic rendering to ensure fresh data on each navigation
export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{
    zone?: string;
    useGroup?: string;
    assessmentYear?: string;
    matrixPage?: string;
    matrixPageSize?: string;
  }>;
};

export default async function AddRatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Get matrix pagination params from URL
  const matrixPage = Number(params?.matrixPage) || 1;
  const rawMatrixPageSize = Number(params?.matrixPageSize);
  const matrixPageSize = [100, 150, 200].includes(rawMatrixPageSize) ? rawMatrixPageSize : 100;

  const [
    zones,
    useGroups,
    allZonesResult,
    constructionTypes,
    assessmentYears,
    rateFrequencyPolicy,
    rateUnitPolicy,
  ] = await Promise.all([
    getZoneOptions(),
    getUseGroupOptions(),
    getAllZoneDescriptions(), // Fetch all zones once for copy rates and in-memory pagination
    getConstructionTypes(),
    getAssessmentYears(),
    getRateFrequencyPolicy(), // Fetch rate frequency policy configuration
    getRateUnitPolicy(), // Fetch rate unit policy configuration
  ]);

  // Derive paginated zones in-memory from allZonesResult to avoid extra network calls
  const totalCount = allZonesResult.length;
  const safePageSize = matrixPageSize > 0 ? matrixPageSize : 100;
  const safePageNumber = Math.max(1, matrixPage);
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const startIdx = (safePageNumber - 1) * safePageSize;
  const paginatedZoneItems = allZonesResult.slice(startIdx, startIdx + safePageSize);

  // Set initial values from searchParams if present, else fallback to first available options
  const initialZone = params?.zone || (zones && zones.length > 0 ? zones[0].value : "ALL");
  const initialUseGroup = params?.useGroup || (useGroups && useGroups.length > 0 ? useGroups[0].value : "ALL");
  const initialYear = params?.assessmentYear || (assessmentYears && assessmentYears.length > 0 ? assessmentYears[0].value : "ALL");

  // Check for existing rates if filters are provided (for add mode validation)
  let initialExistingRatesCheck = false;
  if (params?.zone && params?.useGroup && params?.assessmentYear) {
    try {
      const existingRates = await getRateMasterByFilters(
        params.zone,
        params.useGroup,
        params.assessmentYear
      );
      initialExistingRatesCheck = existingRates && existingRates.length > 0;
    } catch {
      initialExistingRatesCheck = false;
    }
  }

  // Prepare paginated zones data for the form
  const paginatedZonesData = {
    items: paginatedZoneItems,
    totalPages,
    totalCount,
    pageNumber: matrixPage,
    pageSize: matrixPageSize,
  };

  const assessmentYearRanges = assessmentYears.map((ay: { label: string; value: string; fromYear: string | number; toYear: string | number }) => ({
    label: ay.label,
    value: ay.value,
    fromYear: String(ay.fromYear),
    toYear: String(ay.toYear),
  }));

  return (
    <>
      <PageContainer className="pt-24">
        <RateMasterView
          rateMasterData={[]}
          zones={zones ?? []}
          useGroups={useGroups ?? []}
          assessmentYears={assessmentYears ?? []}
          rateCategories={constructionTypes.map((ct: { constructionId: string; constructionCode?: string; description?: string }) => ({ constructionId: ct.constructionId, constructionCode: ct.constructionCode, description: ct.description }))}
          initialZone={initialZone}
          initialUseGroup={initialUseGroup}
          initialYear={initialYear}
          rateUnitPolicy={rateUnitPolicy}
        />
      </PageContainer>
      <AddRateDrawer
        zones={zones}
        useGroups={useGroups}
        assessmentYears={assessmentYears}
        assessmentYearRanges={assessmentYearRanges}
        zoneDescriptions={paginatedZoneItems}
        allZones={allZonesResult}
        rateCategories={constructionTypes.map((ct: { constructionId: string; constructionCode?: string; description?: string }) => ({ constructionId: ct.constructionId, constructionCode: ct.constructionCode, description: ct.description }))}
        paginatedZonesData={paginatedZonesData}
        initialExistingRatesCheck={initialExistingRatesCheck}
        rateFrequencyPolicy={rateFrequencyPolicy}
        rateUnitPolicy={rateUnitPolicy}
      />
    </>
  );
}
