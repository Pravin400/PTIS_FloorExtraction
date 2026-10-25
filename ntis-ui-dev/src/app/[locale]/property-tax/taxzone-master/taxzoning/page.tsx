import TaxZoningPage from "@/components/modules/property-tax/taxzoningmaster/TaxZoningPage";
import { PageContainer } from "@/components/common/PageContainer";

import { fetchTaxZonePagedAction, fetchWardPagedAction, getTaxZoningPagedAction, getTaxZoningPropertyNoPagedAction } from "./actions";
import { TaxZoningServerPageProps } from "@/types/taxzoning.types";

// Force dynamic rendering - this page requires runtime API data
export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: TaxZoningServerPageProps) {
  const params = await searchParams;

  const pageNumber = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 5));
  const wardId = params.wardId ? Number(params.wardId) : undefined;
  const sortBy = params.sortBy;
  const sortOrder = params.sortOrder;

  // Run all independent server actions concurrently to avoid unnecessary TTFB.
  const [result, taxZonesResult, wardsDataResult, propertyOptionsResult] = await Promise.all([
    getTaxZoningPagedAction(pageNumber, pageSize, undefined, undefined, "ward", sortBy, sortOrder),
    fetchTaxZonePagedAction(1, -1),
    fetchWardPagedAction(1, -1),
    wardId
      ? getTaxZoningPropertyNoPagedAction(1, -1, undefined, wardId)
      : Promise.resolve({
        success: true as const,
        data: {
          items: [],
          totalCount: 0,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false
        }
      })
  ]);

  const tableData = result.success && result.data ? result.data.items : [];
  const totalCount = result.success && result.data ? result.data.totalCount : 0;
  const totalPages = result.success && result.data ? result.data.totalPages : 1;

  return (
    <PageContainer className="p-4 sm:p-6">
      <TaxZoningPage
        data={tableData}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        taxZones={taxZonesResult}
        wardsData={wardsDataResult}
        allProperties={propertyOptionsResult}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </PageContainer>
  );
}
