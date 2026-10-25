import RateMasterView from "@/components/modules/property-tax/RVRateMaster/RateMasterView";
import {
  getRateMasterData,
  getRateUnitPolicy,
  getRateFrequencyPolicy,
  getGlobalFrequencyMismatch
} from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import { getRateMasterPaged } from "@/lib/api/rvRateMaster";

// Force dynamic rendering to ensure fresh data on each navigation
export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    zone?: string;
    useGroup?: string;
    year?: string;
    assessmentYear?: string;
  }>;
};

const RateMasterPageServer = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  
  // For zone pagination: pageSize refers to number of ZONES, not records
  const zonePage = Number(params?.page) || 1;
  const zonePageSize = Number(params?.pageSize) || 50;

  // Fetch all master data in one call (for mapping, fetch all zones, not just paginated)
  const [
    allMasterData,
    rateUnitPolicy,
    rateFrequencyPolicy
  ] = await Promise.all([
    getRateMasterData(1, -1), 
    getRateUnitPolicy(),
    getRateFrequencyPolicy()
  ]);

  const {
    constructionTypes,
    rateSections: zones,
    useGroups,
    assessmentYears,
    zoneDescriptions // all zones, not paged
  } = allMasterData;

  // Determine initial/selected values
  const selectedZone = params?.zone || (zones.length > 0 ? zones[0].value : "ALL");
  // Get the first valid use group (not "ALL")
  const firstValidUseGroup = useGroups.find((u) => u.value && u.value !== 'ALL');
  const selectedUseGroup = params?.useGroup || (firstValidUseGroup?.value ?? '');
  const selectedYear = params?.year || params?.assessmentYear || (assessmentYears.length > 0 ? assessmentYears[0].value : "ALL");

  // Fetch ALL rates matching the filters (selectedZone, selectedUseGroup, selectedYear)
  const ratesResult = await getRateMasterPaged(
    1, 
    -1, // Fetch all matching rates
    constructionTypes, 
    zoneDescriptions, 
    selectedZone, 
    selectedUseGroup, 
    selectedYear,
    undefined // Do not restrict by taxZoneIds
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
    constructionTypes, 
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
      useGroups={useGroups ?? []}
      assessmentYears={assessmentYears ?? []}
      rateCategories={constructionTypes.map((ct: { constructionId: string; constructionCode?: string; description?: string }) => ({ 
        constructionId: ct.constructionId, 
        constructionCode: ct.constructionCode || ct.constructionId,
        description: ct.description 
      }))}
      zoneDescriptions={zoneDescriptions ?? []}
      initialZone={selectedZone}
      initialUseGroup={selectedUseGroup}
      initialYear={selectedYear}
      rateUnitPolicy={rateUnitPolicy}
      rateFrequencyPolicy={rateFrequencyPolicy}
      globalFrequencyMismatch={globalFrequencyMismatch}
    />
  );
};

export default RateMasterPageServer;

