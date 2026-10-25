import React from "react";
import { setRequestLocale } from "next-intl/server";
import { GrievanceWorkflowStageMaster } from "@/components/modules/assets/configuration/master-data/grievance-workflow-stage/GrievanceWorkflowStageMaster";
import { fetchGrievanceWorkflowStageMasterPagedServerAction } from "./action";
import { sanitizeSearchParams, type RawSearchParams } from "@/lib/utils/sanitize-params";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}

const ALLOWED_SORT_COLUMNS = [
  "stageCode",
  "stageName",
  "stageOrder",
  "status",
] as const;

export default async function Page({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

  const searchParamValues = await searchParams;
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = sanitizeSearchParams(searchParamValues, {
    allowedSortColumns: ALLOWED_SORT_COLUMNS,
  });

  const result = await fetchGrievanceWorkflowStageMasterPagedServerAction(
    pageNumber,
    pageSize,
    searchTerm,
    sortBy,
    sortOrder
  );

  return (
    <GrievanceWorkflowStageMaster
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
