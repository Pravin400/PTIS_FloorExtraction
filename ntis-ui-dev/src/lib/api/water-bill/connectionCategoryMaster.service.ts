import type {
  ConnectionCategory,
  BillingFrequencyOption,
  PagedResponse,
} from "@/types/waterBill/connectionCategoryMaster.types";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import {
  isConnectionCategoryShape,
  normalizeConnectionCategory,
  extractRawItems,
  filterConnectionCategories,
  createPayload,
} from "@/lib/utils/water-bill/connectionCategoryMaster.utils";

export async function getConnectionCategoryPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  statusFilter?: string,
  meteredFilter?: string
): Promise<PagedResponse<ConnectionCategory>> {
  const params = new URLSearchParams({ PageNumber: String(pageNumber), PageSize: String(pageSize) });
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
  if (statusFilter === "active") params.append("IsActive", "true");
  else if (statusFilter === "inactive") params.append("IsActive", "false");
  if (meteredFilter === "metered") params.append("IsMetered", "true");
  else if (meteredFilter === "non-metered") params.append("IsMetered", "false");

  const response = await apiClient.get<Record<string, unknown>>(`/ConnectionCategoryMaster?${params.toString()}`);
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "getConnectionCategoryPaged");
  }

  const rawData = response.data;
  let items = extractRawItems(rawData).filter(isConnectionCategoryShape).map((i) => normalizeConnectionCategory(i as Record<string, unknown>));
  let totalCount = Number(rawData?.totalCount ?? rawData?.TotalCount ?? items.length);
  let totalPages = Number(rawData?.totalPages ?? rawData?.TotalPages ?? (Math.ceil(totalCount / pageSize) || 1));

  const filtered = filterConnectionCategories(items, searchTerm, statusFilter, meteredFilter);
  if (filtered.length < items.length) {
    items = filtered;
    totalCount = items.length;
    totalPages = Math.ceil(totalCount / pageSize) || 1;
  }

  return {
    items,
    pageNumber: Number(rawData?.pageNumber ?? rawData?.PageNumber ?? pageNumber),
    pageSize: Number(rawData?.pageSize ?? rawData?.PageSize ?? pageSize),
    totalCount,
    totalPages,
    hasPrevious: Boolean(rawData?.hasPrevious ?? rawData?.HasPrevious ?? pageNumber > 1),
    hasNext: Boolean(rawData?.hasNext ?? rawData?.HasNext ?? pageNumber < totalPages),
  };
}

export async function getConnectionCategoryById(id: number): Promise<ConnectionCategory> {
  const response = await apiClient.get<Record<string, unknown>>(`/ConnectionCategoryMaster/${encodeURIComponent(String(id))}`);
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "getConnectionCategoryById");
  }
  const raw = (response.data?.data ?? response.data?.items ?? response.data?.item ?? response.data) as Record<string, unknown>;
  return normalizeConnectionCategory(raw);
}

export async function deleteConnectionCategory(id: number): Promise<void> {
  let response = await apiClient.delete(`/ConnectionCategoryMaster/${encodeURIComponent(String(id))}/purge`);
  if (!response.success) {
    response = await apiClient.delete(`/ConnectionCategoryMaster/${encodeURIComponent(String(id))}`);
  }
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "deleteConnectionCategory");
  }
}

export async function createConnectionCategory(
  data: {
    connectionCategoryCode?: string;
    connectionCategory: string;
    billingFrequencyId?: number | null;
    isMetered: boolean;
    billingMethod: string;
    description?: string | null;
    isActive: boolean;
  },
  userId?: number
): Promise<ConnectionCategory> {
  const { code, payload } = createPayload(data, userId);
  const response = await apiClient.post<Record<string, unknown>>("/ConnectionCategoryMaster", payload);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "createConnectionCategory");
  }
  if (!response.data) {
    return {
      id: 0,
      connectionCategoryCode: code,
      connectionCategory: data.connectionCategory,
      billingFrequencyId: data.billingFrequencyId ?? null,
      isMetered: data.isMetered,
      billingMethod: data.billingMethod,
      description: data.description ?? "",
      isActive: data.isActive,
    };
  }
  const raw = (response.data?.items ?? response.data?.data ?? response.data) as Record<string, unknown>;
  return normalizeConnectionCategory(raw);
}

export async function updateConnectionCategory(
  id: number,
  data: {
    connectionCategoryCode?: string;
    connectionCategory: string;
    billingFrequencyId?: number | null;
    isMetered: boolean;
    billingMethod: string;
    description?: string | null;
    isActive: boolean;
  },
  userId?: number
): Promise<ConnectionCategory> {
  const { code, payload } = createPayload(data, userId, id);
  const response = await apiClient.put<Record<string, unknown>>(`/ConnectionCategoryMaster/${encodeURIComponent(String(id))}`, payload);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "updateConnectionCategory");
  }
  if (!response.data) {
    return {
      id,
      connectionCategoryCode: code,
      connectionCategory: data.connectionCategory,
      billingFrequencyId: data.billingFrequencyId ?? null,
      isMetered: data.isMetered,
      billingMethod: data.billingMethod,
      description: data.description ?? "",
      isActive: data.isActive,
    };
  }
  const raw = (response.data?.items ?? response.data?.data ?? response.data) as Record<string, unknown>;
  return normalizeConnectionCategory(raw);
}

export async function getBillingFrequencyOptions(): Promise<BillingFrequencyOption[]> {
  try {
    const response = await apiClient.get<Record<string, unknown>>("/BillingFrequencyMaster?PageNumber=1&PageSize=100&IsActive=true");
    if (!response.success || !response.data) return [];
    return extractRawItems(response.data)
      .map((item) => {
        const obj = item as Record<string, unknown>;
        return {
          id: Number(obj.id ?? obj.Id ?? 0),
          billingFrequencyCode: String(obj.billingFrequencyCode ?? obj.BillingFrequencyCode ?? "").trim(),
          billingFrequency: String(obj.billingFrequency ?? obj.BillingFrequency ?? "").trim(),
          periodsPerYear: Number(obj.periodsPerYear ?? obj.PeriodsPerYear ?? 0),
          isActive: Boolean(obj.isActive ?? obj.IsActive ?? true),
        };
      })
      .filter((item) => item.id > 0 && item.billingFrequency.length > 0);
  } catch (_error) {
    return [];
  }
}
