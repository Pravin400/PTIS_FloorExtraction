import React from "react";
import { DesignationMaster } from "@/components/modules/assets/configuration/master-data/designation-master/DesignationMaster";
import { fetchDesignationsPagedServerAction } from "./action";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

const ALLOWED_SORT_COLUMNS = ["designationCode", "designationName", "designationLocal"] as const;
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;

const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function sanitizeParams(raw: Awaited<PageProps["searchParams"]>) {
  const rawPage = parseInt(raw.page ?? "", 10);
  const pageNumber = Number.isFinite(rawPage)
    ? Math.min(Math.max(rawPage, MIN_PAGE), MAX_PAGE)
    : MIN_PAGE;

  const rawPageSize = parseInt(raw.pageSize ?? "", 10);
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const searchTerm = raw.q?.trim() || undefined;

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

export default async function Page({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  const resolvedParams = await params;
  const search = await searchParams;
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = sanitizeParams(search);

  const result = await fetchDesignationsPagedServerAction(pageNumber, pageSize, searchTerm, sortBy, sortOrder);

  return (
    <DesignationMaster
      data={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      locale={resolvedParams.locale}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  );
}
