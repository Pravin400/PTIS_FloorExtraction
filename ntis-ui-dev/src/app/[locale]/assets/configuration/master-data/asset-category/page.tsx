import React, { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getAssetMasterDataProvider } from "@/lib/api/asset-masters/asset-master-provider";
import { MASTER_IDS } from "@/types/asset-masters/master-data.types";
import { PageContainer } from "@/components/common/PageContainer";
import { AssetCategoryMasterLayoutContent } from "@/components/modules/assets/configuration/master-data/asset-category-master/AssetCategoryMasterLayoutContent";
import AssetCategoryMaster from "@/components/modules/assets/configuration/master-data/asset-category-master/AssetCategoryMaster";
import type { AssetCategory } from "@/types/asset-masters/asset-category.types";
import { AssetCategoryMasterErrorProvider } from "@/components/modules/assets/configuration/master-data/asset-category-master/AssetCategoryMasterErrorContext";
import { sanitizeSearchParams, type RawSearchParams } from "@/lib/utils/sanitize-params";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}

const ALLOWED_SORT_COLUMNS = ["categoryCode", "categoryName", "description"] as const;

export default async function Page({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawParams = await searchParams;
  const mappedParams = {
    ...rawParams,
    q: rawParams.q || (rawParams as Record<string, unknown>).search as string | undefined,
  };
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = sanitizeSearchParams(mappedParams, {
    allowedSortColumns: ALLOWED_SORT_COLUMNS,
  });

  const response = await getAssetMasterDataProvider(
    MASTER_IDS.CATEGORY,
    "all",
    pageNumber,
    pageSize,
    searchTerm || "",
    sortBy || "",
    sortOrder
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to load asset categories");
  }

  return (
    <AssetCategoryMasterErrorProvider>
      <PageContainer className="p-4 sm:p-6">
        <AssetCategoryMasterLayoutContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            }
          >
            <AssetCategoryMaster
              data={response.data.records as unknown as AssetCategory[]}
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalCount={response.data.totalCount}
              totalPages={response.data.totalPages}
              search={searchTerm || ""}
            />
          </Suspense>
        </AssetCategoryMasterLayoutContent>
      </PageContainer>
    </AssetCategoryMasterErrorProvider>
  );
}
