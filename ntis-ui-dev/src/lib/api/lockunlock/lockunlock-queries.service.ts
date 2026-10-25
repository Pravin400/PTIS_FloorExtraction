import { apiClient } from "@/services/api.service";
import { getTranslations } from "next-intl/server";
import { ApiError, normalizePagedResponse } from "@/lib/utils/api";
import { getAppConfig } from "@/config/app.config";
import { serverFetch } from "@/lib/utils/server-fetch";
import { getAuthHeaders } from "@/lib/utils/server-auth-headers";
import {
  LockedScreen,
  LockUnlockPropertyItem,
  LockUnlockPropertiesQueryParams,
  LockUnlockPropertiesResponse,
  ModuleItem,
  ModuleMasterResponse,
} from "@/types/lockunlock.types";

interface GetScreensResponse {
  items?: LockedScreen[];
  [key: string]: unknown;
}

/**
 * Fetches all modules for lock/unlock screens.
 * GET /api/ModuleMaster
 */
export async function getLockUnlockModules(pageNumber: number = 1, pageSize: number = 100): Promise<ModuleItem[]> {
  const response = await apiClient.get<ModuleMasterResponse>(`/ModuleMaster?PageNumber=${pageNumber}&PageSize=${pageSize}`);

  if (!response.success || !response.data) {
    const t = await getTranslations("lockUnlock");
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || t("messages.fetchFailed"),
      "Get modules failed"
    );
  }

  return response.data.items || [];
}

/**
 * Fetches the list of all screen options that can be locked/unlocked.
 * GET /api/LockUnlock/screens
 */
export async function getLockUnlockScreens(moduleIds?: string): Promise<LockedScreen[]> {
  const url = moduleIds ? `/LockUnlock/screens?ModuleIds=${moduleIds}` : `/LockUnlock/screens`;
  const response = await apiClient.get<LockedScreen[]>(url);

  if (!response.success || !response.data) {
    const t = await getTranslations("lockUnlock");
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || t("messages.fetchFailed"),
      "Get screens failed"
    );
  }

  // Handle optional wrapped response format
  const data = response.data as unknown as GetScreensResponse;
  if (data.items && Array.isArray(data.items)) {
    return data.items;
  }

  return response.data;
}

/**
 * Fetches paginated properties with lock status details.
 * GET /api/LockUnlock/properties
 */
export async function getLockUnlockProperties(
  params: LockUnlockPropertiesQueryParams
): Promise<LockUnlockPropertiesResponse> {
  const urlParams = new URLSearchParams({
    PageNumber: params.PageNumber?.toString() ?? "1",
    PageSize: params.PageSize?.toString() ?? "10",
  });

  if (params.WardId) urlParams.append("WardId", params.WardId.toString());
  if (params.FromPropertyNo?.trim()) urlParams.append("FromPropertyNo", params.FromPropertyNo.trim());
  if (params.ToPropertyNo?.trim()) urlParams.append("ToPropertyNo", params.ToPropertyNo.trim());
  if (params.PartitionNo?.trim()) urlParams.append("PartitionNo", params.PartitionNo.trim());
  if (params.Search?.trim()) urlParams.append("Search", params.Search.trim());
  if (params.SearchPartitionNo?.trim()) urlParams.append("SearchPartitionNo", params.SearchPartitionNo.trim());
  if (params.SearchTerm?.trim()) urlParams.append("SearchTerm", params.SearchTerm.trim());
  if (params.SortBy?.trim()) urlParams.append("SortBy", params.SortBy.trim());
  if (params.SortOrder?.trim()) urlParams.append("SortOrder", params.SortOrder.trim());
  if (params.FilterLogic !== undefined && params.FilterLogic !== null) {
    urlParams.append("FilterLogic", params.FilterLogic.toString());
  }

  const response = await apiClient.get<LockUnlockPropertiesResponse>(
    `/LockUnlock/properties?${urlParams.toString()}`
  );

  if (!response.success || !response.data) {
    const t = await getTranslations("lockUnlock");
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || t("messages.fetchFailed"),
      "Get properties failed"
    );
  }

  return normalizePagedResponse<LockUnlockPropertyItem>(response.data);
}

/**
 * Fetches paginated properties with lock status details by category.
 * GET /api/LockUnlock/properties/search-by-category
 */
export async function getLockUnlockPropertiesByCategory(
  params: LockUnlockPropertiesQueryParams
): Promise<LockUnlockPropertiesResponse> {
  const urlParams = new URLSearchParams({
    PageNumber: params.PageNumber?.toString() ?? "1",
    PageSize: params.PageSize?.toString() ?? "10",
  });

  if (params.SearchCategory !== undefined) urlParams.append("SearchCategory", params.SearchCategory.toString());
  if (params.ZoneId) urlParams.append("ZoneId", params.ZoneId.toString());
  if (params.WardId) urlParams.append("WardId", params.WardId.toString());
  if (params.PropertyFrom?.trim()) urlParams.append("PropertyFrom", params.PropertyFrom.trim());
  if (params.PropertyTo?.trim()) urlParams.append("PropertyTo", params.PropertyTo.trim());
  if (params.PropertyNo) urlParams.append("PropertyNo", params.PropertyNo);
  if (params.PartitionNo) urlParams.append("PartitionNo", params.PartitionNo);
  if (params.Search?.trim()) urlParams.append("Search", params.Search.trim());
  if (params.SearchPartitionNo) urlParams.append("SearchPartitionNo", params.SearchPartitionNo);
  if (params.SearchTerm?.trim()) urlParams.append("SearchTerm", params.SearchTerm.trim());
  if (params.SortBy?.trim()) urlParams.append("SortBy", params.SortBy.trim());
  if (params.SortOrder?.trim()) urlParams.append("SortOrder", params.SortOrder.trim());
  if (params.FilterLogic !== undefined && params.FilterLogic !== null) {
    urlParams.append("FilterLogic", params.FilterLogic.toString());
  }

  const response = await apiClient.get<LockUnlockPropertiesResponse>(
    `/LockUnlock/properties/search-by-category?${urlParams.toString()}`
  );

  if (!response.success || !response.data) {
    const t = await getTranslations("lockUnlock");
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || t("messages.fetchFailed"),
      "Get properties by category failed"
    );
  }

  return normalizePagedResponse<LockUnlockPropertyItem>(response.data);
}

/**
 * Fetches paginated properties with lock status details by Excel upload file.
 * POST /api/LockUnlock/properties/search-by-excel
 */
export async function getLockUnlockPropertiesByExcel(
  formData: FormData
): Promise<LockUnlockPropertiesResponse> {
  const config = getAppConfig();
  const baseUrl = config.api.baseUrl?.trim().replace(/\/+$/, "");
  if (!baseUrl) throw new Error("Backend API base URL is not configured");

  const url = `${baseUrl}/LockUnlock/properties/search-by-excel`;
  const headers = await getAuthHeaders();

  const response = await serverFetch(url, {
    method: "POST",
    headers,
    body: formData,
    cache: "no-store",
  });

  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok || data.success === false) {
    const t = await getTranslations("lockUnlock");
    const errorMessage =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
        ? data.error
        : t("messages.fetchFailed");

    throw new ApiError(
      response.status ?? 500,
      errorMessage,
      "Get properties by excel failed"
    );
  }

  return normalizePagedResponse<LockUnlockPropertyItem>(data);
}

