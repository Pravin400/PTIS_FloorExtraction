import React from "react";
import { GstMaster } from "@/components/modules/assets/configuration/master-data/gst-master/GstMaster";
import { fetchGstMasterPagedServerAction } from "./action";
import { sanitizeSearchParams, type RawSearchParams } from "@/lib/utils/sanitize-params";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const ALLOWED_SORT_COLUMNS = ["taxCode", "taxName", "taxPercentage", "effectiveFromDate", "effectiveToDate"] as const;

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = sanitizeSearchParams(params, {
    allowedSortColumns: ALLOWED_SORT_COLUMNS,
  });

  const result = await fetchGstMasterPagedServerAction(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
  return (
    <GstMaster
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
