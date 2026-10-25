'use server';

import { revenueDashboardService } from '@/lib/api/assets/dashboard/revenue-dashboard/revenue-dashboard.service';
import type {
  RevenueDashboardData,
  RevenueOverviewQuery,
} from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';
import { ApiResponse } from '@/types/common.types';

export interface RevenueDashboardFilters {
  year?: number;
  zoneId?: number | null;
  wardId?: number | null;
}

/**
 * Server action backing the Revenue Management Dashboard landing page.
 * Fetches the full overview payload and the zone/ward filter options concurrently.
 */
export async function getRevenueDashboardAction(
  filters: RevenueDashboardFilters = {}
): Promise<ApiResponse<RevenueDashboardData>> {
  try {
    const zoneId = filters.zoneId ?? undefined;
    const wardId = filters.wardId ?? undefined;

    const overviewQuery: RevenueOverviewQuery = {
      year: filters.year,
      zoneId,
      wardId,
    };

    const [overviewRes, options] = await Promise.all([
      revenueDashboardService.getOverview(overviewQuery),
      revenueDashboardService.getFilterOptions(zoneId ?? null),
    ]);

    if (!overviewRes.success || !overviewRes.data) {
      return { ...overviewRes, data: undefined } as ApiResponse<RevenueDashboardData>;
    }

    return {
      ...overviewRes,
      data: {
        overview: overviewRes.data,
        zones: options.zones,
        wards: options.wards,
        selectedZoneId: filters.zoneId ?? null,
        selectedWardId: filters.wardId ?? null,
      },
    };
  } catch (err) {
    return { success: false, statusCode: 500, message: String(err) };
  }
}
