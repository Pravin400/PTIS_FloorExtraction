import React from "react";
import { AssessmentYearRangeMaster } from "@/components/modules/property-tax/assessment-year-range";
import { rateableValueConfig } from "@/components/modules/property-tax/assessment-year-range/config";
import { fetchAssessmentYearRangeRVPagedAction, deleteAssessmentYearRangeRVAction } from "./action";
import { AssessmentYearRangeRV } from "@/types/assessment-year-range.types";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

/** Pagination constraints */
const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Sanitizes and clamps all query-string parameters
 */
function sanitizeParams(raw: Awaited<PageProps["searchParams"]>) {
  const rawPage = parseInt(raw.page ?? "", 10);
  const pageNumber = Number.isFinite(rawPage)
    ? Math.min(Math.max(rawPage, MIN_PAGE), MAX_PAGE)
    : MIN_PAGE;

  const rawPageSize = parseInt(raw.pageSize ?? "", 10);
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const allowedSortColumns = ["fromYear", "toYear"];
  const sortBy = raw.sortBy && allowedSortColumns.includes(raw.sortBy) ? raw.sortBy : undefined;
  const sortOrder = raw.sortOrder && ["asc", "desc"].includes(raw.sortOrder.toLowerCase()) 
    ? raw.sortOrder.toLowerCase() 
    : undefined;

  return { pageNumber, pageSize, sortBy, sortOrder };
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { pageNumber, pageSize, sortBy, sortOrder } = sanitizeParams(params);
  const result = await fetchAssessmentYearRangeRVPagedAction(pageNumber, pageSize, sortBy, sortOrder);

  return (
    <AssessmentYearRangeMaster<AssessmentYearRangeRV>
      config={rateableValueConfig}
      data={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      sortBy={sortBy}
      sortOrder={sortOrder}
      deleteAction={deleteAssessmentYearRangeRVAction}
    />
  );
}
