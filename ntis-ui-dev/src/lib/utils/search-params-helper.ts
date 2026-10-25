import { parsePositiveInteger } from "@/lib/utils/water-bill/utils";

export interface ParsedPagedSearchParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function parsePagedSearchParams(
  searchParams?: Record<string, string | string[] | undefined> | null
): ParsedPagedSearchParams {
  const pageNumber = parsePositiveInteger(searchParams?.pageNumber, 1);
  const pageSize = Math.min(100, parsePositiveInteger(searchParams?.pageSize, 10));
  const searchTerm =
    typeof searchParams?.searchTerm === "string" && searchParams.searchTerm.trim()
      ? searchParams.searchTerm.trim()
      : undefined;
  const sortBy =
    typeof searchParams?.sortBy === "string" && searchParams.sortBy.trim()
      ? searchParams.sortBy.trim()
      : undefined;
  const sortOrder =
    searchParams?.sortOrder === "desc" || searchParams?.sortOrder === "asc"
      ? searchParams.sortOrder
      : undefined;

  return {
    pageNumber,
    pageSize,
    searchTerm,
    sortBy,
    sortOrder,
  };
}
