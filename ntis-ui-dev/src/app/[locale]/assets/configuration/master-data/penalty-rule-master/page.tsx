import React from "react";
import { PenaltyRuleMaster } from "@/components/modules/assets/configuration/master-data/penalty-rule-master/PenaltyRuleMaster";
import { fetchPenaltyRuleMasterPagedServerAction } from "./action";
import { sanitizeSearchParams, type RawSearchParams } from "@/lib/utils/sanitize-params";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const ALLOWED_SORT_COLUMNS = ["penaltyCode", "penaltyName", "calculationType", "penaltyValue", "gracePeriodDays"] as const;

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = sanitizeSearchParams(params, {
    allowedSortColumns: ALLOWED_SORT_COLUMNS,
  });

  const result = await fetchPenaltyRuleMasterPagedServerAction(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
  return (
    <PenaltyRuleMaster
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
