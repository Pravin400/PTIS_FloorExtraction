import React from "react";
import { MeterTestStatusMaster } from "@/components/modules/water-bill/meter-test-status-master";
import { fetchMeterTestStatusesPagedServerAction } from "./action";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

import { TEXT_SANITIZE } from "@/lib/utils/validation-rules";

/** Allowed column names accepted by the server action / API */
const ALLOWED_SORT_COLUMNS = ["meterTestStatusCode", "meterTestStatus", "isActive"] as const;
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;

function sanitizeParams(raw: Awaited<PageProps["searchParams"]>) {
  const rawPage = parseInt(raw.page ?? "", 10);
  const pageNumber = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawPageSize = parseInt(raw.pageSize ?? "", 10);
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0 ? rawPageSize : 10;

  const rawSearch = raw.q?.trim();
  const searchTerm = rawSearch ? rawSearch.replace(TEXT_SANITIZE, "") || undefined : undefined;

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

export default async function MeterTestStatusMasterPage({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = sanitizeParams(params);

  const result = await fetchMeterTestStatusesPagedServerAction(pageNumber, pageSize, searchTerm, sortBy, sortOrder);

  return (
    <MeterTestStatusMaster
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
