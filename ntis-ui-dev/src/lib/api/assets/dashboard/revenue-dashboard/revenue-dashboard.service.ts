import { apiClient } from '@/services/api.service';
import { ApiResponse } from '@/types/common.types';
import type {
  RevenueDashboardOverview,
  RevenueListQuery,
  RevenueListResult,
  RevenueOverviewQuery,
  RevenueFilterOption,
} from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';
import type { ZoneItem } from '@/types/zoneMaster.types';
import type { WardItem } from '@/types/wardMaster.types';
import {
  normalizeOverview,
  normalizeRevenueListResult,
} from './revenue-dashboard.mappers';

/** Append a numeric query param only when it is a finite, positive value. */
function appendId(params: URLSearchParams, key: string, value?: number): void {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    params.append(key, String(value));
  }
}

/**
 * Client for `RevenueDashboardController` (`/api/RevenueDashboard/*`).
 * All requests go through the shared `apiClient`; responses are narrowed and
 * normalized before they cross into the UI.
 */
export const revenueDashboardService = {
  /**
   * GET /RevenueDashboard/overview — KPI summary, category distribution, monthly
   * trend and zone-wise demand/collection for the resolved period.
   */
  getOverview: async (
    query: RevenueOverviewQuery = {}
  ): Promise<ApiResponse<RevenueDashboardOverview>> => {
    const params = new URLSearchParams();
    appendId(params, 'Year', query.year);
    appendId(params, 'Month', query.month);
    appendId(params, 'AssetCategoryId', query.assetCategoryId);
    appendId(params, 'ZoneId', query.zoneId);
    appendId(params, 'WardId', query.wardId);

    const qs = params.toString();
    const response = await apiClient.get<unknown>(
      `/RevenueDashboard/overview${qs ? `?${qs}` : ''}`
    );
    if (response.success) {
      return { ...response, data: normalizeOverview(response.data) };
    }
    return response as ApiResponse<RevenueDashboardOverview>;
  },

  /**
   * GET /RevenueDashboard — paged list of lease/rent records with their asset
   * details, scoped by category / zone / ward / lease type / payment status.
   */
  getRevenueList: async (
    query: RevenueListQuery
  ): Promise<ApiResponse<RevenueListResult>> => {
    const params = new URLSearchParams();
    params.append('PageNumber', String(query.pageNumber));
    params.append('PageSize', String(query.pageSize));
    if (query.searchTerm?.trim()) params.append('SearchTerm', query.searchTerm.trim());
    if (query.sortBy?.trim()) params.append('SortBy', query.sortBy.trim());
    if (query.sortOrder?.trim()) params.append('SortOrder', query.sortOrder.trim());
    appendId(params, 'AssetCategoryId', query.assetCategoryId);
    appendId(params, 'ZoneId', query.zoneId);
    appendId(params, 'WardId', query.wardId);
    if (query.leaseType?.trim()) params.append('LeaseType', query.leaseType.trim());
    if (query.paymentStatus?.trim()) params.append('PaymentStatus', query.paymentStatus.trim());

    const response = await apiClient.get<unknown>(`/RevenueDashboard?${params.toString()}`);
    if (response.success) {
      return { ...response, data: normalizeRevenueListResult(response.data) };
    }
    return response as ApiResponse<RevenueListResult>;
  },

  /**
   * Loads the zone + ward dropdown options for the revenue dashboard filters.
   * Failures degrade to empty lists so the dashboard still renders without filters.
   */
  getFilterOptions: async (
    zoneId?: number | null
  ): Promise<{ zones: RevenueFilterOption[]; wards: RevenueFilterOption[] }> => {
    let wardUrl = '/Ward?IsActive=true&PageSize=-1';
    if (zoneId) {
      wardUrl += `&ZoneId=${zoneId}`;
    }

    const [zonesRes, wardsRes] = await Promise.all([
      apiClient.get<{ items?: ZoneItem[] } | ZoneItem[]>('/Zone?IsActive=true&PageSize=-1').catch(() => null),
      apiClient.get<{ items?: WardItem[] } | WardItem[]>(wardUrl).catch(() => null),
    ]);

    const rawZones = Array.isArray(zonesRes?.data) ? zonesRes.data : zonesRes?.data?.items || [];
    const rawWards = Array.isArray(wardsRes?.data) ? wardsRes.data : wardsRes?.data?.items || [];

    const zones: RevenueFilterOption[] = rawZones
      .filter((zone) => typeof zone.id === 'number')
      .map((zone) => {
        const label = zone.zoneNo?.trim() || String(zone.id);
        return { id: zone.id!, label, originalName: zone.description || '' };
      });

    const wards: RevenueFilterOption[] = rawWards
      .filter((ward) => typeof ward.id === 'number')
      .map((ward) => {
        const label = ward.wardNo?.trim() || String(ward.id);
        return { id: ward.id!, label };
      });

    return { zones, wards };
  },
};
