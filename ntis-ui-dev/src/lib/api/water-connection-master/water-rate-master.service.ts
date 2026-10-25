import type {
  WaterRate,
  WaterRateFormModel,
  PagedResponse,
} from "@/types/water-connection.types";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";

function isWaterRateShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  const hasId = "id" in obj || "waterRateMasterId" in obj || "rateId" in obj;
  const hasRate =
    "yearlyRate" in obj ||
    "rate" in obj ||
    "yearlyrate" in obj ||
    "quarterlyRate" in obj ||
    "monthlyRate" in obj;
  return hasId && hasRate;
}

function normalizeWaterRate(data: Record<string, unknown>): WaterRate {
  const id = Number(data.id ?? data.waterRateMasterId ?? data.rateId ?? 0);
  const yearlyRaw = data.yearlyRate ?? data.rate ?? data.yearlyrate;
  const yearlyRate = yearlyRaw != null ? Number(yearlyRaw) : null;
  const quarterlyRaw = data.quarterlyRate ?? data.quarterlyrate;
  const quarterlyRate = quarterlyRaw != null ? Number(quarterlyRaw) : null;
  const monthlyRaw = data.monthlyRate ?? data.monthlyrate;
  const monthlyRate = monthlyRaw != null ? Number(monthlyRaw) : null;
  return {
    id: Number.isFinite(id) ? id : 0,
    waterConnectionTypeId: Number(data.waterConnectionTypeId ?? 0),
    connectionTypeName: data.connectionTypeName ? String(data.connectionTypeName) : null,
    waterConnectionSizeId: Number(data.waterConnectionSizeId ?? 0),
    connectionSizeDisplay: data.connectionSizeDisplay ? String(data.connectionSizeDisplay) : null,
    financeYearId: Number(data.financeYearId ?? 0),
    yearCode: data.yearCode ? String(data.yearCode) : null,
    yearlyRate: Number.isFinite(yearlyRate) ? yearlyRate : null,
    quarterlyRate: Number.isFinite(quarterlyRate) ? quarterlyRate : null,
    monthlyRate: Number.isFinite(monthlyRate) ? monthlyRate : null,
    isActive: Boolean(data.isActive),
  };
}

export async function getWaterRatesPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<WaterRate>> {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());

  const response = await apiClient.get<PagedResponse<WaterRate>>(
    `/WaterRateMaster?${params.toString()}`
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to fetch water rates", "getWaterRatesPaged");
  }
  if (!response.data) {
    throw new ApiError(500, "No data returned from server", "getWaterRatesPaged");
  }
  return {
    ...response.data,
    items: (response.data.items || []).filter(isWaterRateShape).map(normalizeWaterRate),
  };
}

export async function getWaterRateById(id: number): Promise<WaterRate> {
  const response = await apiClient.get<WaterRate>(
    `/WaterRateMaster/${encodeURIComponent(String(id))}`
  );
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Not found", "getWaterRateById");
  }
  return normalizeWaterRate(response.data as unknown as Record<string, unknown>);
}

export async function createWaterRate(
  data: WaterRateFormModel,
  userId: number
): Promise<WaterRate> {
  const response = await apiClient.post<WaterRate>("/WaterRateMaster", {
    waterConnectionTypeId: data.waterConnectionTypeId,
    waterConnectionSizeId: data.waterConnectionSizeId,
    financeYearId: data.financeYearId,
    yearlyRate: data.yearlyRate,
    quarterlyRate: data.quarterlyRate,
    monthlyRate: data.monthlyRate,
    rate: data.yearlyRate,
    isActive: data.isActive,
    createdBy: userId,
  });
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to create water rate", "createWaterRate");
  }
  if (!response.data) {
    return {
      id: 0,
      waterConnectionTypeId: data.waterConnectionTypeId,
      waterConnectionSizeId: data.waterConnectionSizeId,
      financeYearId: data.financeYearId,
      yearlyRate: data.yearlyRate,
      quarterlyRate: data.quarterlyRate,
      monthlyRate: data.monthlyRate,
      isActive: data.isActive
    };
  }
  return normalizeWaterRate(response.data as unknown as Record<string, unknown>);
}

export async function updateWaterRate(
  id: number,
  data: WaterRateFormModel,
  userId: number
): Promise<WaterRate> {
  const response = await apiClient.put<WaterRate>(
    `/WaterRateMaster/${encodeURIComponent(String(id))}`,
    {
      id: id,
      waterConnectionTypeId: data.waterConnectionTypeId,
      waterConnectionSizeId: data.waterConnectionSizeId,
      financeYearId: data.financeYearId,
      yearlyRate: data.yearlyRate,
      quarterlyRate: data.quarterlyRate,
      monthlyRate: data.monthlyRate,
      rate: data.yearlyRate,
      isActive: data.isActive,
      updatedBy: userId,
    }
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to update water rate", "updateWaterRate");
  }
  if (!response.data) {
    return {
      id: id,
      waterConnectionTypeId: data.waterConnectionTypeId,
      waterConnectionSizeId: data.waterConnectionSizeId,
      financeYearId: data.financeYearId,
      yearlyRate: data.yearlyRate,
      quarterlyRate: data.quarterlyRate,
      monthlyRate: data.monthlyRate,
      isActive: data.isActive
    };
  }
  return normalizeWaterRate(response.data as unknown as Record<string, unknown>);
}

export async function deleteWaterRate(id: number, _userId: number): Promise<void> {
  const response = await apiClient.delete(
    `/WaterRateMaster/${encodeURIComponent(String(id))}/purge`
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to delete water rate", "deleteWaterRate");
  }
}
