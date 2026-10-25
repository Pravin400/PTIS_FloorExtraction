import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { PagedResponse } from "@/types/common.types";
import {
  AliasMaster,
  AliasMasterApiEnvelope,
  AliasMasterFormModel,
  AliasMasterCounts,
  RawAliasMaster,
  RawAliasLabel,
  AliasLabelMap,
} from "@/types/alias-master.types";

/** Cache tag for the /alias-master/active lookup used by the runtime label overlay. */
export const ALIAS_MASTER_ACTIVE_TAG = "alias-master-active";
/** Default freshness window before Next.js Data Cache refetches /alias-master/active. */
const ALIAS_MASTER_ACTIVE_CACHE_SECONDS = 300;

const normalize = (item: RawAliasMaster): AliasMaster => ({
  id: item.id ?? 0,
  aliasKey: item.aliasKey ?? null,
  keyName: item.keyName ?? "",
  labelName: item.labelName ?? "",
  englishName: item.englishName ?? null,
  regionalName: item.regionalName ?? null,
  hindiName: item.hindiName ?? null,
  isActive: item.isActive ?? false,
  createdDate: item.createdDate ?? null,
  updatedDate: item.updatedDate ?? null,
});

export async function getAliasMastersPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AliasMaster>> {
  const params = new URLSearchParams();
  params.set("PageNumber", String(pageNumber));
  params.set("PageSize", String(pageSize));
  if (searchTerm?.trim()) params.set("SearchTerm", searchTerm.trim());
  if (sortBy?.trim()) params.set("SortBy", sortBy.trim());
  if (sortOrder?.trim()) params.set("SortOrder", sortOrder.trim());

  const response = await apiClient.get<PagedResponse<RawAliasMaster>>(`/alias-master?${params.toString()}`);
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch Alias master", "Get Alias master failed");
  }

  return {
    ...response.data,
    items: (response.data.items ?? []).map(normalize),
  };
}

const isEnvelope = (value: unknown): value is AliasMasterApiEnvelope =>
  !!value && typeof value === "object" && "items" in (value as Record<string, unknown>) && !Array.isArray((value as Record<string, unknown>).items);

export async function getAliasMasterById(id: number): Promise<AliasMaster | null> {
  const response = await apiClient.get<RawAliasMaster | AliasMasterApiEnvelope>(`/alias-master/${encodeURIComponent(String(id))}`);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || `Failed to fetch Alias master ${id}`, `Get Alias master ${id} failed`);
  }
  if (!response.data) return null;

  // The GET-by-id endpoint may return either the raw entity directly, or the
  // same { success, message, items, errors } envelope used by create/update.
  const raw = isEnvelope(response.data) ? response.data.items : response.data;
  if (!raw) return null;
  return normalize(raw);
}

export async function createAliasMaster(data: AliasMasterFormModel): Promise<AliasMaster> {
  const payload = {
    keyName: data.keyName.trim(),
    labelName: data.labelName.trim(),
    englishName: data.englishName.trim() || null,
    regionalName: data.regionalName.trim() || null,
    hindiName: data.hindiName.trim() || null,
  };
  const response = await apiClient.post<AliasMasterApiEnvelope>("/alias-master", payload);
  if (!response.success || !response.data?.success || !response.data.items) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.data?.message || response.error || "Create Alias master failed",
      "Create Alias master failed"
    );
  }
  return normalize(response.data.items);
}

export async function updateAliasMaster(data: AliasMasterFormModel): Promise<AliasMaster> {
  if (!data.id) {
    throw new ApiError(400, "Valid Alias master ID is required", "Validation failed");
  }
  const payload = {
    labelName: data.labelName.trim(),
    englishName: data.englishName.trim() || null,
    regionalName: data.regionalName.trim() || null,
    hindiName: data.hindiName.trim() || null,
    isActive: data.isActive,
  };
  const response = await apiClient.put<AliasMasterApiEnvelope>(`/alias-master/${encodeURIComponent(String(data.id))}`, payload);
  if (!response.success || !response.data?.success || !response.data.items) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.data?.message || response.error || "Update Alias master failed",
      "Update Alias master failed"
    );
  }
  return normalize(response.data.items);
}

/**
 * Fetches the active-only, unpaged field-label overlay used to override static
 * next-intl JSON labels at runtime. Cached in Next.js's server-side Data Cache
 * (shared across requests/users) and tagged so an Alias Master edit can bust it
 * immediately via revalidateTag(ALIAS_MASTER_ACTIVE_TAG) instead of waiting out the TTL.
 */
export async function getActiveAliasLabels(): Promise<AliasLabelMap> {
  const response = await apiClient.get<{ items?: RawAliasLabel[] }>("/alias-master/active", {
    cache: "force-cache",
    next: { tags: [ALIAS_MASTER_ACTIVE_TAG], revalidate: ALIAS_MASTER_ACTIVE_CACHE_SECONDS },
  });
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch active Alias labels", "Get active Alias labels failed");
  }

  const map: AliasLabelMap = {};
  for (const item of response.data.items ?? []) {
    if (!item.keyName) continue;
    map[item.keyName] = {
      englishName: item.englishName ?? null,
      regionalName: item.regionalName ?? null,
      hindiName: item.hindiName ?? null,
    };
  }
  return map;
}

export async function getAliasMasterCounts(): Promise<AliasMasterCounts> {
  const response = await apiClient.get<{ success: boolean; message?: string; items?: AliasMasterCounts }>("/alias-master/counts");
  if (!response.success || !response.data?.success || !response.data.items) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.data?.message || response.error || "Failed to fetch Alias master counts",
      "Get Alias master counts failed"
    );
  }
  return response.data.items;
}

export async function toggleAliasMasterStatus(id: number, isActive: boolean): Promise<void> {
  const response = await apiClient.patch<AliasMasterApiEnvelope>(
    `/alias-master/${encodeURIComponent(String(id))}/status?isActive=${isActive}`
  );
  if (!response.success || !response.data?.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.data?.message || response.error || "Update Alias master status failed",
      "Update Alias master status failed"
    );
  }
}
