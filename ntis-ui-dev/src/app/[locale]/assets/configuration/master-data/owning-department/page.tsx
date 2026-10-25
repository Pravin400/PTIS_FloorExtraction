import React from "react";
import { OwningDepartmentMaster } from "@/components/modules/assets/configuration/master-data/owning-department/OwningDepartmentMaster";
import { fetchOwningDepartmentPagedServerAction } from "./action";
import { sanitizeSearchParams, type RawSearchParams } from "@/lib/utils/sanitize-params";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const ALLOWED_SORT_COLUMNS = ["owningDepartmentName", "description"] as const;

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const rawParams = await searchParams;
  const mappedParams = {
    ...rawParams,
    q: rawParams.q || (rawParams as Record<string, unknown>).search as string | undefined,
  };

  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = sanitizeSearchParams(mappedParams, {
    allowedSortColumns: ALLOWED_SORT_COLUMNS,
  });

  const result = await fetchOwningDepartmentPagedServerAction(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
  return (
    <OwningDepartmentMaster
      data={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      sortBy={sortBy}
      sortOrder={sortOrder}
      searchTerm={searchTerm}
    />
  );
}
