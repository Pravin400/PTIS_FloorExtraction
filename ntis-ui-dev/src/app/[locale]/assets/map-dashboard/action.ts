"use server";

import { getDashboardStats } from "@/lib/api/assets/map-dashboard.service";
import type { DashboardStatsData, MapDashboardFilterParams } from "@/types/assets/map-dashboard.types";


export async function getMapDashboardStats(params?: MapDashboardFilterParams): Promise<DashboardStatsData | null> {
  const rawResponse = await getDashboardStats(params);
  if (!rawResponse) return null;

  const raw = rawResponse as Record<string, unknown>;
  const payload = (raw.data || raw) as Record<string, unknown>;
  const summary = (payload.summary || payload) as Record<string, unknown>;

  
  const categories = (
    summary.categoryStats ||
    payload.categoryStats ||
    summary.assetCountCardDetails ||
    payload.assetCountCardDetails ||
    []
  ) as Array<{
    category?: string;
    categoryName?: string;
    count?: number;
    registeredAssets?: number;
    totalValue?: number;
  }>;

  const findCategory = (keyword: string) =>
    categories.find((c) => (c.category || c.categoryName || "").toLowerCase().includes(keyword.toLowerCase()));

  const getCount = (keyword: string) => {
    const cat = findCategory(keyword);
    return cat ? (cat.registeredAssets ?? cat.count ?? 0) : 0;
  };

  const totalAssets = Number(summary.totalAssets ?? payload.totalAssets) || 0;
  
  const sumCategoryValues = categories.reduce((sum, c) => sum + (Number(c.totalValue) || 0), 0);
  const totalValueRaw = summary.totalValue ?? payload.totalValue;
  const parsedTotalValue = totalValueRaw != null ? Number(totalValueRaw) : NaN;
  const totalValue = Number.isFinite(parsedTotalValue) ? parsedTotalValue : sumCategoryValues;

  const buildingCount = getCount("Building");
  const landCount = getCount("Land");
  const movableCount = getCount("Movable");
  const infrastructureCount = getCount("Infra");
  const monetizationCount = Number(summary.monetizedAssetsCount ?? summary.monetizationCount) || 0;
  const encroachmentCount = Number(summary.encroachments ?? summary.encroachmentCount) || 0;

  return {
    ...payload,
    summary,
    totalAssets,
    totalValue,
    buildingCount,
    landCount,
    movableCount,
    infrastructureCount,
    monetizationCount,
    encroachmentCount,
    categoryStats: categories,
  };
}

