/**
 * Pagination parameters returned by the parser
 */
export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}

/**
 * Parses and validates pagination parameters from search params.
 * 
 * @param page Raw page value from query params
 * @param pageSizeRaw Raw page size value from query params
 * @param maxPageSize Maximum allowed page size (default: 1000)
 * @param defaultPageSize Default page size if not provided (default: 10)
 * @returns Parsed pageNumber and pageSize
 */
export function parsePaginationParams(
  page: string | string[] | undefined,
  pageSizeRaw: string | string[] | undefined,
  maxPageSize: number = 1000,
  defaultPageSize: number = 10
): PaginationParams {
  const pageStr = Array.isArray(page) ? page[page.length - 1] : page;
  const pageSizeStr = Array.isArray(pageSizeRaw) ? pageSizeRaw[pageSizeRaw.length - 1] : pageSizeRaw;

  const pageNumber = Math.max(1, parseInt(pageStr || '1', 10) || 1);
  const size = parseInt(pageSizeStr || String(defaultPageSize), 10);
  
  // Handle -1 for fetching all records (if supported by backend)
  const pageSize = size === -1 ? -1 : Math.min(maxPageSize, Math.max(1, size || defaultPageSize));

  return { pageNumber, pageSize };
}
