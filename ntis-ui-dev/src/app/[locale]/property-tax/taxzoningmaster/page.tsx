import { cookies } from "next/headers";
import TaxZoningMasterPage from "@/components/modules/property-tax/taxZoningmasterNew/TaxZoningMasterPage";
import {
  fetchWardPagedAction,
  fetchTaxZonePagedAction,
  fetchTaxZoningRangesPagedAction,
  fetchTaxZoningCoverageAction,
} from "./actions";
import { getUlbDataFromCookieStore } from "@/lib/utils/cookie";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    wardId?: string;
    propertyFrom?: string;
    propertyTo?: string;
    taxZoneId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  const cookieStore = await cookies();
  const ulbData = getUlbDataFromCookieStore(cookieStore);
  const ulbName = ulbData.ulbNameLocal || ulbData.ulbName || "";

  const pageNumber = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 10));
  const wardId = params.wardId ? Number(params.wardId) : undefined;
  const taxZoneId = params.taxZoneId ? Number(params.taxZoneId) : undefined;

  const [rangesResult, wardsData, taxZonesData, coverageResult] = await Promise.all([
    fetchTaxZoningRangesPagedAction({
      pageNumber,
      pageSize,
      wardId,
      taxZoneId,
      propertyNo: params.propertyFrom || params.propertyTo || undefined,
      description: params.search || undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    }),
    fetchWardPagedAction(1, -1),
    fetchTaxZonePagedAction(1, -1),
    fetchTaxZoningCoverageAction(wardId ? [wardId] : undefined),
  ]);

  const data = rangesResult.success ? rangesResult.data.items : [];
  const totalCount = rangesResult.success ? rangesResult.data.totalCount : 0;
  const totalPages = rangesResult.success ? rangesResult.data.totalPages : 1;
  const coverage = coverageResult.success
    ? coverageResult.data
    : { totalProperties: 0, coveredProperties: 0, pendingProperties: 0, zoneWiseCounts: [] };

  return (
    <TaxZoningMasterPage
      data={data}
      taxZones={taxZonesData}
      wardsData={wardsData}
      coverage={coverage}
      totalCount={totalCount}
      totalPages={totalPages}
      pageNumber={pageNumber}
      pageSize={pageSize}
      ulbName={ulbName}
      filters={{
        wardId,
        fromPropertyNo: params.propertyFrom,
        toPropertyNo: params.propertyTo,
        taxZoneId,
        search: params.search,
      }}
    />
  );
}
