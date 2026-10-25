import RateMasterView from "@/components/modules/property-tax/RVRateMaster/RateMasterView";
import {
  getRateMasterData,
  getRateUnitPolicy,
  getRateFrequencyPolicy,
  getGlobalFrequencyMismatch,
  getOpenPlotTypeOfUseDetailsAction
} from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import { getRateMasterPaged } from "@/lib/api/rvRateMaster";
import { ITypeOfUseDetails } from "@/types/RVRateMaster";

// Force dynamic rendering to ensure fresh data on each navigation
export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    zone?: string;
    year?: string;
    assessmentYear?: string;
  }>;
};

const OpenPlotRateMasterPageServer = async ({ searchParams }: PageProps) => {
  const params = await searchParams;

  // For zone pagination: pageSize refers to number of ZONES, not records
  const zonePage = Number(params?.page) || 1;
  const zonePageSize = Number(params?.pageSize) || 50;

  // Fetch all master data and typeofuse details in one call
  const [
    allMasterData,
    typeofuseDetailsResult,
    rateUnitPolicy,
    rateFrequencyPolicy
  ] = await Promise.all([
    getRateMasterData(1, -1),
    getOpenPlotTypeOfUseDetailsAction(),
    getRateUnitPolicy(),
    getRateFrequencyPolicy()
  ]);

  const typeofuseDetails = typeofuseDetailsResult.items || [];

  const {
    rateSections: zones,
    assessmentYears,
    zoneDescriptions // all zones, not paged
  } = allMasterData;

  // Determine initial/selected values
  const selectedZone = params?.zone || (zones.length > 0 ? zones[0].value : "ALL");
  const selectedYear = params?.year || params?.assessmentYear || (assessmentYears.length > 0 ? assessmentYears[0].value : "ALL");

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

  // Fetch ALL rates matching the filters (using the typeofuses mapped as constructionTypes)
  const ratesResult = await getRateMasterPaged(
    1,
    -1, // Fetch all matching rates
    rateCategories,
    zoneDescriptions,
    selectedZone,
    undefined, // No useGroup filter for Open Plot
    selectedYear,
    undefined, // Do not restrict by taxZoneIds
    true // isOpenPlot is true
  );

  const allFilteredRates = ratesResult.items || [];
  const totalZonesCount = allFilteredRates.length;
  const totalZonePages = Math.ceil(totalZonesCount / zonePageSize);

  // Paginate the rate master rows for UI display
  const startIdx = (zonePage - 1) * zonePageSize;
  const filteredRates = allFilteredRates.slice(startIdx, startIdx + zonePageSize);

  // STEP 4: Check for global frequency mismatch
  const globalFrequencyMismatch = await getGlobalFrequencyMismatch(
    rateFrequencyPolicy,
    rateCategories,
    zoneDescriptions
  );

  return (
    <RateMasterView
      rateMasterData={filteredRates}
      pageNumber={zonePage}
      pageSize={zonePageSize}
      totalPages={totalZonePages}
      totalCount={totalZonesCount}
      zones={zones ?? []}
      useGroups={openPlotUseGroups}
      assessmentYears={assessmentYears ?? []}
      rateCategories={rateCategories}
      zoneDescriptions={zoneDescriptions ?? []}
      initialZone={selectedZone}
      initialYear={selectedYear}
      rateUnitPolicy={rateUnitPolicy}
      rateFrequencyPolicy={rateFrequencyPolicy}
      globalFrequencyMismatch={globalFrequencyMismatch}
      isOpenPlot={true}
    />
  );
};

export default OpenPlotRateMasterPageServer;
