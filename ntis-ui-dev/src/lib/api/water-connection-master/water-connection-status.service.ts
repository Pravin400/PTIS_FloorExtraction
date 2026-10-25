import type {
  TapStatus,
  TapStatusFormModel,
  PagedResponse,
} from "@/types/water-connection.types";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";

function isTapStatusShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  const hasId = "id" in obj || "waterConnectionStatusId" in obj || "statusId" in obj;
  return hasId && "statusName" in obj;
}

function normalizeTapStatus(data: Record<string, unknown>): TapStatus {
  const id = Number(data.id ?? data.waterConnectionStatusId ?? data.statusId ?? 0);
  return {
    waterConnectionStatusId: Number.isFinite(id) ? id : 0,
    statusCode: String(data.statusCode ?? "").trim(),
    statusName: String(data.statusName ?? "").trim(),
    isActive: Boolean(data.isActive),
  };
}

export async function getTapStatusPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<TapStatus>> {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());

  const response = await apiClient.get<PagedResponse<TapStatus>>(
    `/WaterConnectionStatus?${params.toString()}`
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to fetch tap status", "getTapStatusPaged");
  }
  if (!response.data) {
    throw new ApiError(500, "No data returned from server", "getTapStatusPaged");
  }
  return {
    ...response.data,
    items: response.data.items.filter(isTapStatusShape).map(normalizeTapStatus),
  };
}

export async function getTapStatusById(id: number): Promise<TapStatus> {
  const response = await apiClient.get<TapStatus>(
    `/WaterConnectionStatus/${encodeURIComponent(String(id))}`
  );
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Not found", "getTapStatusById");
  }
  return normalizeTapStatus(response.data as unknown as Record<string, unknown>);
}

export async function createTapStatus(
  data: TapStatusFormModel,
  userId: number
): Promise<TapStatus> {
  const response = await apiClient.post<TapStatus>("/WaterConnectionStatus", {
    ...data,
    createdBy: userId,
  });
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to create", "createTapStatus");
  }
  if (!response.data) {
    return { waterConnectionStatusId: 0, statusCode: "", statusName: data.statusName, isActive: data.isActive };
  }
  return normalizeTapStatus(response.data as unknown as Record<string, unknown>);
}

export async function updateTapStatus(
  id: number,
  data: TapStatusFormModel,
  userId: number
): Promise<TapStatus> {
  const response = await apiClient.put<TapStatus>(
    `/WaterConnectionStatus/${encodeURIComponent(String(id))}`,
    { ...data, updatedBy: userId }
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to update", "updateTapStatus");
  }
  if (!response.data) {
    return { waterConnectionStatusId: id, statusCode: "", statusName: data.statusName, isActive: data.isActive };
  }
  return normalizeTapStatus(response.data as unknown as Record<string, unknown>);
}

export async function deleteTapStatus(id: number, _userId: number): Promise<void> {
  const response = await apiClient.delete(
    `/WaterConnectionStatus/${encodeURIComponent(String(id))}/purge`
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to delete", "deleteTapStatus");
  }
}
