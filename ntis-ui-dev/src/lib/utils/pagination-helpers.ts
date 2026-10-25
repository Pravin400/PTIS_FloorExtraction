/**
 * Generic pagination helper utilities
 * Provides reusable functions for handling paginated API responses
 */

// ✅ Configuration constants for pagination
export const DEFAULT_PAGE_SIZE = 1000; // Standard page size for fetching all records
export const MAX_PAGE_SIZE = 5000; // Maximum to prevent memory issues

/**
 * Generic helper to fetch all records with pagination
 * Automatically handles multiple pages and aggregates results
 * 
 * @template T - The type of items being fetched
 * @param fetchFn - Function that fetches a single page of results
 * @param additionalParams - Additional parameters to pass to fetchFn
 * @param pageSize - Number of items per page (capped at MAX_PAGE_SIZE)
 * @returns Promise containing all items and total count
 * 
 * @example
 * ```typescript
 * const result = await fetchAllPaged(
 *   getUseTypesPagedServer,
 *   { typeOfUseGroupId: 1 },
 *   1000
 * );
 * console.log(result.items); // All items across all pages
 * ```
 */
export async function fetchAllPaged<T>(
  fetchFn: (params: { 
    pageNumber: number; 
    pageSize: number; 
    [key: string]: unknown 
  }) => Promise<{ items: T[]; totalCount: number }>,
  additionalParams: Record<string, unknown> = {},
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<{ items: T[]; totalCount: number }> {
  // Validate page size to prevent memory issues
  const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
  
  let page = 1;
  const allItems: T[] = [];
  let hasMore = true;

  while (hasMore) {
    const res = await fetchFn({
      pageNumber: page,
      pageSize: safePageSize,
      ...additionalParams,
    });

    const newItems = res.items || [];
    allItems.push(...newItems);

    if (newItems.length === 0 || allItems.length >= res.totalCount) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return {
    items: allItems,
    totalCount: allItems.length,
  };
}
