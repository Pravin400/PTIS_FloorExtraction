"use server";

import { apiClient } from "@/services/api.service";
import {
  getMunicipalDashboardStats,
  getAssetsByTypeDetails,
  getAssetCategoryTypeDetails,
} from "@/lib/api/asset/municipal-Asset/asset-dashboard.service";
import type {
  DashboardStatsResponse,
  AssetMaster,
  PaginatedApiResponse,
  SubUnitsApiResponse,
  AssetCategoryTypeStatsResponseDto,
} from "@/types/asset/municipal-Asset/municipal-asset.types";

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

/**
 * Fetch dashboard summary stats for municipal assets.
 * Delegates to municipal asset service.
 */
export async function fetchMunicipalAssetDashboardStats(): Promise<DashboardStatsResponse | null> {
  try {
    return await getMunicipalDashboardStats();
  } catch (err) {
    console.error("fetchMunicipalAssetDashboardStats failed:", err);
    return null;
  }
}

// ─── Asset Filter & Sub-Units ─────────────────────────────────────────────────

/**
 * Fetch assets for "Use Existing Asset" flow — filter by zone/ward/search.
 * API: GET /AssetMaster?search=...&zoneId=...&wardId=...&pageSize=...&pageNumber=...
 */
export async function fetchAssetsByFilter(params: {
  zoneId?: number;
  wardId?: number;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}) {
  try {
    const query = new URLSearchParams();
    if (params.zoneId) query.set("zoneId", String(params.zoneId));
    if (params.wardId) query.set("wardId", String(params.wardId));
    if (params.search) query.set("search", params.search.trim());
    query.set("pageSize", String(params.pageSize ?? 50));
    query.set("pageNumber", String(params.pageNumber ?? 1));

    const response = await apiClient.get<PaginatedApiResponse<AssetMaster> | AssetMaster[]>(
      `/AssetMaster?${query.toString()}`
    );

    if (response.success && response.data) {
      const raw = response.data;
      const isPagedResponse =
        !Array.isArray(raw) && (raw as PaginatedApiResponse<AssetMaster>).items !== undefined;
      const pagedRaw = raw as PaginatedApiResponse<AssetMaster>;

      const items: AssetMaster[] = isPagedResponse
        ? (pagedRaw.items ?? [])
        : Array.isArray(raw)
          ? raw
          : (pagedRaw.data ?? []);

      const totalCount: number = isPagedResponse
        ? (pagedRaw.totalCount ?? items.length)
        : items.length;

      return { success: true as const, data: items, totalCount };
    }

    return { success: false as const, data: [], totalCount: 0, error: "Failed to fetch assets" };
  } catch (err) {
    console.error("fetchAssetsByFilter failed:", err);
    return { success: false as const, data: [], totalCount: 0, error: "Failed to fetch assets" };
  }
}

/**
 * Fetch sub-units for a specific asset.
 * API: GET /ManageSubUnits/by-asset/${assetId}
 */
export async function fetchSubUnitsByAsset(assetId: number) {
  try {
    const response = await apiClient.get<SubUnitsApiResponse>(`/ManageSubUnits/by-asset/${assetId}`);
    if (response.success && response.data) {
      return {
        success: response.data.success ?? true,
        items: response.data.items ?? [],
        message: response.data.message ?? "",
      };
    }
    return { success: false as const, items: [], error: response.error ?? "Failed to fetch sub-units" };
  } catch (err) {
    console.error("fetchSubUnitsByAsset failed:", err);
    return { success: false as const, items: [], error: "Failed to fetch sub-units" };
  }
}

// ─── Asset Type Details ───────────────────────────────────────────────────────

/**
 * Fetch detailed paginated assets filtered by type.
 * Delegates to municipal asset service.
 */
export async function fetchAssetsByTypeDetails(
  assetTypeId: number,
  pageNumber: number = 1,
  pageSize: number = 20
) {
  try {
    const data = await getAssetsByTypeDetails(assetTypeId, pageNumber, pageSize);
    return { success: true as const, data };
  } catch (err: unknown) {
    console.error("fetchAssetsByTypeDetails failed:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch asset details";
    return { success: false as const, error: message, data: null };
  }
}

/**
 * Fetch category asset types breakdown.
 * API: GET /AssetDashboard/assets-by-type/details?assetCategoryId={id}
 */
export async function fetchAssetCategoryTypeDetails(
  assetCategoryId: number
): Promise<{ success: boolean; data: AssetCategoryTypeStatsResponseDto | null; error?: string }> {
  try {
    const data = await getAssetCategoryTypeDetails(assetCategoryId);
    return { success: true as const, data };
  } catch (err: unknown) {
    console.error("fetchAssetCategoryTypeDetails failed:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch category type details";
    return { success: false as const, error: message, data: null };
  }
}
