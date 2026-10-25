import React from "react";
import { CommonRemarkMaster } from "@/components/modules/configuration-settings/common-remark-master";
import { fetchCommonRemarksPagedAction, fetchRemarkCategoriesAction } from "./actions";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    filterType?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

const ALLOWED_SORT_COLUMNS = ["remarkType", "remark", "createdDate"] as const;
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;
const ALLOWED_FILTER_TYPES = ["All", "Survey", "Recovery", "Notice", "Mobile Remark"] as const;

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

  const filterTypeRaw = raw.filterType?.trim();
  const filterType = !filterTypeRaw
    ? "All"
    : (ALLOWED_FILTER_TYPES as readonly string[]).includes(filterTypeRaw)
      ? filterTypeRaw
      : filterTypeRaw.length <= 100
        ? filterTypeRaw
        : "All";

  const sortByRaw = raw.sortBy?.trim() ?? "";
  const sortBy = (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortByRaw)
    ? (sortByRaw as (typeof ALLOWED_SORT_COLUMNS)[number])
    : undefined;

  const sortOrderRaw = raw.sortOrder?.trim().toLowerCase() ?? "";
  const sortOrder = (ALLOWED_SORT_ORDERS as readonly string[]).includes(sortOrderRaw)
    ? (sortOrderRaw as (typeof ALLOWED_SORT_ORDERS)[number])
    : undefined;

  return { pageNumber, pageSize, searchTerm, filterType, sortBy, sortOrder };
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { pageNumber, pageSize, searchTerm, filterType, sortBy, sortOrder } = sanitizeParams(params);
  
  const [result, categories] = await Promise.all([
    fetchCommonRemarksPagedAction(
      pageNumber,
      pageSize,
      searchTerm,
      filterType,
      sortBy,
      sortOrder
    ),
    fetchRemarkCategoriesAction(),
  ]);

  return (
    <CommonRemarkMaster
      data={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      search={searchTerm}
      filterType={filterType}
      sortBy={sortBy}
      sortOrder={sortOrder}
      categories={categories}
    />
  );
}
