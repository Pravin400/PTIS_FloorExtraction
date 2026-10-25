import { cookies } from "next/headers";
import WardAbstractDrawerWrapper from "@/components/modules/property-tax/taxZoningmasterNew/WardAbstractDrawerWrapper";
import { fetchWardAbstractAction, fetchTaxZoningCoverageAction } from "../actions";
import { getUlbDataFromCookieStore } from "@/lib/utils/cookie";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ pageNumber?: string; pageSize?: string; search?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const resolved = await searchParams;
  const pageNumber = Math.max(1, Number(resolved.pageNumber) || 1);
  const pageSize = Math.max(1, Number(resolved.pageSize) || 10);
  const searchTerm = resolved.search ?? "";

  const cookieStore = await cookies();
  const ulbData = getUlbDataFromCookieStore(cookieStore);
  const ulbName = ulbData.ulbNameLocal || ulbData.ulbName || "Municipal Corporation";

  const [pagedResult, coverageResult] = await Promise.all([
    fetchWardAbstractAction(pageNumber, pageSize, searchTerm || undefined),
    fetchTaxZoningCoverageAction(),
  ]);

  const paged = pagedResult.success && pagedResult.data ? pagedResult.data : null;
  const coverage = coverageResult.success && coverageResult.data ? coverageResult.data : null;

  const overallTotal = coverage?.totalProperties ?? 0;
  const overallCovered = coverage?.coveredProperties ?? 0;

  const zoneLabels = (coverage?.zoneWiseCounts ?? [])
    .map((z) => z.taxZoneNo)
    .sort();

  return (
    <WardAbstractDrawerWrapper
      data={paged?.items ?? []}
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={paged?.totalCount ?? 0}
      totalPages={paged?.totalPages ?? 1}
      searchTerm={searchTerm}
      zoneLabels={zoneLabels}
      ulbName={ulbName}
      overallTotalProperties={overallTotal}
      overallCoveredProperties={overallCovered}
      overallPendingProperties={coverage?.pendingProperties ?? 0}
      overallCoveragePercent={overallTotal > 0 ? (overallCovered / overallTotal) * 100 : 0}
    />
  );
}
