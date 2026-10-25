import React from "react";
import { MoujaMaster } from "@/components/modules/property-tax/mouja-master";
import { fetchMoujaPagedServerAction } from "./action";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

/** Allowed column names accepted by the server action / API */
const ALLOWED_SORT_COLUMNS = ["moujaNo", "moujaName"] as const;
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;

/** Pagination constraints – must stay in sync with the server action */
const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Sanitizes and clamps all query-string parameters before they reach the
 * server action. Malformed values (e.g. ?page=-1&pageSize=999) are silently
 * normalized to safe defaults so the page renders instead of crashing into
 * the error boundary.
 */
function sanitizeParams(raw: Awaited<PageProps["searchParams"]>) {
  // Parse as integer; NaN / non-finite values fall back to the minimum
  const rawPage = parseInt(raw.page ?? "", 10);
  const pageNumber = Number.isFinite(rawPage)
    ? Math.min(Math.max(rawPage, MIN_PAGE), MAX_PAGE)
    : MIN_PAGE;

  const rawPageSize = parseInt(raw.pageSize ?? "", 10);
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  // Free-text search – trim only, no validation needed
  const searchTerm = raw.q?.trim() || undefined;

  // Whitelist-based validation: unknown values become undefined so the action
  // falls back to its own default rather than throwing an error
  const sortByRaw = raw.sortBy?.trim() ?? "";
  const sortBy = (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortByRaw)
    ? (sortByRaw as (typeof ALLOWED_SORT_COLUMNS)[number])
    : undefined;

  const sortOrderRaw = raw.sortOrder?.trim().toLowerCase() ?? "";
  const sortOrder = (ALLOWED_SORT_ORDERS as readonly string[]).includes(sortOrderRaw)
    ? (sortOrderRaw as (typeof ALLOWED_SORT_ORDERS)[number])
    : undefined;

  return { pageNumber, pageSize, searchTerm, sortBy, sortOrder };
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = sanitizeParams(params);
  const result = await fetchMoujaPagedServerAction(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
  return (
    <MoujaMaster
      data={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  );
}
