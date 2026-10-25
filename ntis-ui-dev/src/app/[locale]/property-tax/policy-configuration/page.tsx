import React from "react";
import { PolicyConfigurationMaster } from "@/components/modules/property-tax/policy-configuration";
import { getPolicyConfigurationsPagedAction } from "./action";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
  }>;
}

/** Pagination constraints – must stay in sync with the server action */
const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Sanitizes and clamps all query-string parameters before they reach the
 * server action. Malformed values are silently normalized to safe defaults
 * so the page renders instead of crashing.
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

  const searchTerm = raw.search?.trim() || "";

  return { pageNumber, pageSize, searchTerm };
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { pageNumber, pageSize, searchTerm } = sanitizeParams(params);
  const result = await getPolicyConfigurationsPagedAction(pageNumber, pageSize, searchTerm);

  return (
    <PolicyConfigurationMaster
      data={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      search={searchTerm}
    />
  );
}
