import React, { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { PageContainer } from "@/components/common/PageContainer";
import {
  AssetTypeMaster,
  AssetTypeMasterErrorProvider,
  AssetTypeMasterLayoutContent
} from "@/components/modules/assets/configuration/master-data/asset-type-master";
import { getAssetMasterDataProvider } from "@/lib/api/asset-masters/asset-master-provider";
import { MASTER_IDS } from "@/types/asset-masters/master-data.types";
import { sanitizeSearchParams, type RawSearchParams } from "@/lib/utils/sanitize-params";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}

const ALLOWED_SORT_COLUMNS = ["typeCode", "typeName", "typeNameLocal", "description", "isActive"] as const;

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

  const result = await getAssetMasterDataProvider(
    MASTER_IDS.TYPE,
    "all",
    pageNumber,
    pageSize,
    searchTerm || "",
    sortBy || "",
    sortOrder || "asc"
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to load asset type master data");
  }

  const initialMasters = result.data;

  return (
    <AssetTypeMasterErrorProvider>
      <PageContainer className="p-4 sm:p-6">
        <AssetTypeMasterLayoutContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            }
          >
            <AssetTypeMaster
              data={initialMasters?.records || []}
              pageNumber={initialMasters?.pageNumber ?? pageNumber}
              pageSize={initialMasters?.pageSize ?? pageSize}
              totalCount={initialMasters?.totalCount ?? 0}
              totalPages={initialMasters?.totalPages ?? 1}
              search={searchTerm || ""}
            />
          </Suspense>
        </AssetTypeMasterLayoutContent>
      </PageContainer>
    </AssetTypeMasterErrorProvider>
  );
}
