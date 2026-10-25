import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { PagedResponse } from "@/types/common.types";
import { PenaltyRule, PenaltyRuleFormModel, RawPenaltyRule } from "@/types/asset-masters/penalty-rule-master.types";

const normalize = (item: RawPenaltyRule): PenaltyRule => ({
  id: item.id ?? 0,
  penaltyCode: item.penaltyCode ?? "",
  penaltyName: item.penaltyName ?? "",
  calculationType: item.calculationType ?? "",
  penaltyValue: item.penaltyValue ?? 0,
  gracePeriodDays: item.gracePeriodDays ?? 0,
  isActive: item.isActive ?? false,
  createdDate: item.createdDate ?? null,
  updatedDate: item.updatedDate ?? null,
  createdBy: item.createdBy ?? null,
  updatedBy: item.updatedBy ?? null,
});

export async function getPenaltyRulesPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<PenaltyRule>> {
  const params = new URLSearchParams();
  params.set("PageNumber", String(pageNumber));
  params.set("PageSize", String(pageSize));
  params.set("MarkedForDeletion", "false");
  if (searchTerm?.trim()) params.set("SearchTerm", searchTerm.trim());
  if (sortBy?.trim()) params.set("SortBy", sortBy.trim());
  if (sortOrder?.trim()) params.set("SortOrder", sortOrder.trim());

  const response = await apiClient.get<PagedResponse<RawPenaltyRule>>(`/PenaltyRule?${params.toString()}`);
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch penalty rule master", "Get penalty rule master failed");
  }

  return {
    ...response.data,
    items: (response.data.items ?? []).map(normalize),
  };
}

export async function getPenaltyRuleById(id: number): Promise<PenaltyRule | null> {
  const response = await apiClient.get<RawPenaltyRule>(`/PenaltyRule/${encodeURIComponent(String(id))}`);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || `Failed to fetch penalty rule master ${id}`, `Get penalty rule master ${id} failed`);
  }
  if (!response.data) return null;
  return normalize(response.data);
}

export async function createPenaltyRule(data: PenaltyRuleFormModel): Promise<void> {
  const payload = {
    penaltyCode: data.penaltyCode.trim(),
    penaltyName: data.penaltyName.trim(),
    calculationType: data.calculationType.trim(),
    penaltyValue: Number(data.penaltyValue) || 0,
    gracePeriodDays: Number(data.gracePeriodDays) || 0,
    isActive: data.isActive,
    createdBy: data.createdBy || null,
  };
  const response = await apiClient.post<void>("/PenaltyRule", payload);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Create penalty rule master failed", "Create penalty rule master failed");
  }
}

export async function updatePenaltyRule(data: PenaltyRuleFormModel): Promise<void> {
  if (!data.id) {
    throw new ApiError(400, "Valid penalty rule master ID is required", "Validation failed");
  }
  const payload = {
    id: data.id,
    penaltyCode: data.penaltyCode.trim(),
    penaltyName: data.penaltyName.trim(),
    calculationType: data.calculationType.trim(),
    penaltyValue: Number(data.penaltyValue) || 0,
    gracePeriodDays: Number(data.gracePeriodDays) || 0,
    isActive: data.isActive,
    updatedBy: data.updatedBy || null,
  };
  const response = await apiClient.put<void>(`/PenaltyRule/${encodeURIComponent(String(data.id))}`, payload);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Update penalty rule master failed", "Update penalty rule master failed");
  }
}

export async function deletePenaltyRule(id: number): Promise<void> {
  const response = await apiClient.delete<void>(`/PenaltyRule/${encodeURIComponent(String(id))}`);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || `Delete penalty rule master ${id} failed`, `Delete penalty rule master ${id} failed`);
  }
}
