import React, { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { PageContainer } from "@/components/common/PageContainer";
import {
  InventoryNameMaster,
  InventoryNameMasterErrorProvider,
  InventoryNameMasterLayoutContent
} from "@/components/modules/assets/configuration/master-data/inventory-name-master";
import { fetchInventoryNamePagedServerAction, getInventoryNameCategoriesAction } from "./actions";
import { sanitizeSearchParams, type RawSearchParams } from "@/lib/utils/sanitize-params";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}

const ALLOWED_SORT_COLUMNS = ["subTypeCode", "subTypeName", "isActive"] as const;

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

  const [result, categories] = await Promise.all([
    fetchInventoryNamePagedServerAction(pageNumber, pageSize, searchTerm || "", sortBy || "", (sortOrder as "asc" | "desc") || "asc"),
    getInventoryNameCategoriesAction(),
  ]);

  return (
    <InventoryNameMasterErrorProvider>
      <PageContainer className="p-4 sm:p-6">
        <InventoryNameMasterLayoutContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            }
          >
            <InventoryNameMaster
              data={result.items as unknown as import("@/types/asset-masters/inventory-name.types").InventoryName[]}
              pageNumber={result.pageNumber}
              pageSize={result.pageSize}
              totalCount={result.totalCount}
              totalPages={result.totalPages}
              categories={categories}
              search={searchTerm || ""}
            />
          </Suspense>
        </InventoryNameMasterLayoutContent>
      </PageContainer>
    </InventoryNameMasterErrorProvider>
  );
}

