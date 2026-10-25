'use server';

import { revenueDashboardService } from '@/lib/api/assets/dashboard/revenue-dashboard/revenue-dashboard.service';
import type {
  RevenueListQuery,
  RevenueRecordsData,
} from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';
import { ApiResponse } from '@/types/common.types';

export interface RevenueRecordsFilters {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  categoryId?: number | null;
  zoneId?: number | null;
  wardId?: number | null;
  leaseType?: string;
  paymentStatus?: string;
}

/**
 * Server action backing the per-category revenue records screen.
 * The overview supplies the category sidebar counts + summary cards; the list
 * endpoint supplies the paged, filtered rows for the selected category.
 */
export async function getRevenueRecordsAction(
  filters: RevenueRecordsFilters
): Promise<ApiResponse<RevenueRecordsData>> {
  try {
    const categoryId = filters.categoryId ?? undefined;
    const zoneId = filters.zoneId ?? undefined;
    const wardId = filters.wardId ?? undefined;

    const listQuery: RevenueListQuery = {
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
      searchTerm: filters.searchTerm,
      assetCategoryId: categoryId,
      zoneId,
      wardId,
      leaseType: filters.leaseType,
      paymentStatus: filters.paymentStatus,
    };

    const [overviewRes, listRes, options] = await Promise.all([
      revenueDashboardService.getOverview({ zoneId, wardId }),
      revenueDashboardService.getRevenueList(listQuery),
      revenueDashboardService.getFilterOptions(zoneId ?? null),
    ]);

    if (!overviewRes.success || !overviewRes.data) {
      return { ...overviewRes, data: undefined } as ApiResponse<RevenueRecordsData>;
    }
    if (!listRes.success || !listRes.data) {
      return { ...listRes, data: undefined } as ApiResponse<RevenueRecordsData>;
    }

    return {
      ...overviewRes,
      data: {
        categories: overviewRes.data.categoryDistribution,
        summary: overviewRes.data.summary,
        list: listRes.data,
        zones: options.zones,
        wards: options.wards,
        selectedCategoryId: filters.categoryId ?? null,
      },
    };
  } catch (err) {
    return { success: false, statusCode: 500, message: String(err) };
  }
}
