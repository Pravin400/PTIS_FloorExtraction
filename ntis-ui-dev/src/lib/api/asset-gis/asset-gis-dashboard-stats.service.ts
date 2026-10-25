import 'server-only';

import { apiClient } from '@/services/api.service';
import { ApiResponse } from '@/types/common.types';

class GisDashboardApiService {
  /**
   * Fetch KPI Stats directly from backend
   * Calls the same endpoint as Master Dashboard, but kept separate for architectural isolation.
   */
  async getDashboardStats(zoneId?: string | number, wardId?: string | number): Promise<ApiResponse<unknown>> {
    const q = new URLSearchParams();
    if (zoneId && zoneId !== 'all') q.set('zoneId', String(zoneId));
    if (wardId && wardId !== 'all') q.set('wardId', String(wardId));
    const queryStr = q.toString();
    const endpoint = queryStr ? `/AssetDashboard/dashboard-stats?${queryStr}` : '/AssetDashboard/dashboard-stats';

    return apiClient.get<unknown>(endpoint, { cache: 'no-store' });
  }
}

export const gisDashboardApi = new GisDashboardApiService();

export const GisDashboardApi = gisDashboardApi;
export const gisDashboardStatsService = gisDashboardApi;
