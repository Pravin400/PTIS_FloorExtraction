/**
 * Shared data fetching for Grievance Category Master
 */
import { unstable_noStore as noStore } from 'next/cache';
import { getGrievanceCategories } from '@/lib/api/configuration-settings/grievance-category-master/grievanceCategory.service';
import { departmentMasterService } from '@/lib/api/departmentMaster.service';
import type { DepartmentMaster } from '@/types/departmentMaster.types';
import type { GrievanceCategory } from '@/types/grievance-category-master/grievanceCategory.types';
import type { GetGrievanceCategoriesParams } from '@/types/grievance-category-master/grievanceCategory.types';
import { parseSearchParams, calculateStats } from './data-fetcher-utils';

type MasterSearchParams = {
  pageSize?: string;
  page?: string;
  search?: string;
  department?: string;
  status?: string;
};

export async function getGrievanceCategoryMasterData(searchParams: MasterSearchParams) {
  noStore();

  const { requestedPageSize, requestedPageNumber, serverFilters } = parseSearchParams(searchParams);

  // Filters for paged query (includes search, dept, status)
  const pagedFilters: GetGrievanceCategoriesParams = {
    page: requestedPageNumber,
    pageSize: requestedPageSize,
    ...(searchParams.search ? { search: searchParams.search } : {}),
    ...(serverFilters.departmentId ? { departmentId: serverFilters.departmentId } : {}),
    ...(serverFilters.isActive !== undefined ? { isActive: serverFilters.isActive } : {}),
  };

  const departmentsPromise = departmentMasterService
    .getDepartmentMasters()
    .then((res) => (res.success && res.data ? res.data : ([] as DepartmentMaster[])))
    .catch(() => [] as DepartmentMaster[]);

  // First fetch paged results to get the total count
  const pagedResult = await getGrievanceCategories(pagedFilters)
    .then((res) => ({ ...res, success: true }))
    .catch(() => ({
      success: false,
      categories: [],
      total: 0,
      totalPages: 0,
      pageSize: requestedPageSize,
    }));

  // Fetch categories for stats (aggregated across pages if necessary)
  const actualTotal = pagedResult.total || 0;
  let allCategories: GrievanceCategory[] = [];

  // Optimization: If the first page already contains all records, no need for more fetches
  if (pagedResult.success && pagedResult.categories.length >= actualTotal && actualTotal > 0) {
    allCategories = pagedResult.categories;
  } else if (actualTotal > 0) {
    try {
      // Limit to a single lightweight fetch of max 250 items to calculate stats, avoiding timeouts
      const STATS_FETCH_SIZE = 250;
      const statsResult = await getGrievanceCategories({
        page: 1,
        pageSize: STATS_FETCH_SIZE,
        ...(searchParams.search ? { search: searchParams.search } : {}),
        ...(serverFilters.departmentId ? { departmentId: serverFilters.departmentId } : {}),
        ...(serverFilters.isActive !== undefined ? { isActive: serverFilters.isActive } : {}),
      }).catch(() => null);

      allCategories = statsResult?.categories ?? [];
    } catch (_error) {
      // Fallback: If stats fetch fails, we use paged data as best-effort for stats
      allCategories = pagedResult.categories || [];
    }
  }

  const [departments] = await Promise.all([departmentsPromise]);

  // If we still have no categories for stats but paged data exists, use paged data
  const statsCategories = allCategories.length > 0 ? allCategories : pagedResult.categories;

  // We no longer perform duplicated client-side filtering.
  // The server API filters are the single source of truth.
  const pagedData = pagedResult.categories;
  const finalTotalCount = actualTotal;

  // Return the requested page as-is - let the page component handle validation and redirects
  const page = requestedPageNumber;

  // Calculate stats using the best available data (allCategories or fallback to paged)
  // We pass actualTotal to ensure the "Total Categories" stat is always accurate even if we only fetched a subset
  // CRIT-2 NOTE: Stats (critical/active/avgSLA) are computed from up to 3000 records when total > 3000
  // The stats object includes 'isPartial' flag to indicate when calculations are from a subset
  const stats = calculateStats(statsCategories, actualTotal);

  return {
    pagedData,
    departments,
    stats,
    pageSize: requestedPageSize,
    page,
    totalCount: finalTotalCount,
    search: searchParams.search,
  };
}
