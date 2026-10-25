import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { MapDashboardFilterParams, DashboardStatsData } from "@/types/assets/map-dashboard.types";

/** Fetches map dashboard statistics from the API */
export async function getDashboardStats(params?: MapDashboardFilterParams): Promise<DashboardStatsData> {
  const searchParams = new URLSearchParams();
  if (params?.zoneId && params.zoneId !== "all") searchParams.append("zoneId", String(params.zoneId));
  if (params?.wardId && params.wardId !== "all") searchParams.append("wardId", String(params.wardId));
  if (params?.districtId) searchParams.append("districtId", String(params.districtId));

  const queryStr = searchParams.toString();
  const endpoint = queryStr ? `/AssetDashboard/dashboard-stats?${queryStr}` : "/AssetDashboard/dashboard-stats";

  const response = await apiClient.get<DashboardStatsData>(endpoint);
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch dashboard stats", "Get dashboard stats failed");
  }

  return response.data;
}




