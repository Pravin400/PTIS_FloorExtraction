import type {
  ConnectionType,
  PagedResponse,
} from "@/types/waterBill/connectionTypeMaster.types";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import {
  isConnectionTypeShape,
  normalizeConnectionType,
  extractRawItems,
  filterConnectionTypes,
  createPayload,
} from "@/lib/utils/water-bill/connectionTypeMaster.utils";

export async function getConnectionTypePaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  statusFilter?: string
): Promise<PagedResponse<ConnectionType>> {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
  if (statusFilter === "active") params.append("IsActive", "true");
  else if (statusFilter === "inactive") params.append("IsActive", "false");

  const response = await apiClient.get<Record<string, unknown>>(
    `/ConnectionTypeMaster?${params.toString()}`
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "getConnectionTypePaged");
  }
  if (!response.data) {
    throw new ApiError(500, "", "getConnectionTypePaged");
  }

  const rawData = response.data;
  const rawItems = extractRawItems(rawData);

  let items = rawItems
    .filter(isConnectionTypeShape)
    .map((item) => normalizeConnectionType(item as Record<string, unknown>));
  let totalCount = Number(rawData?.totalCount ?? rawData?.TotalCount ?? items.length);
  let totalPages = Number(rawData?.totalPages ?? rawData?.TotalPages ?? (Math.ceil(totalCount / pageSize) || 1));

  const filtered = filterConnectionTypes(items, searchTerm, statusFilter);
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

export async function getConnectionTypeById(id: number): Promise<ConnectionType> {
  const response = await apiClient.get<Record<string, unknown>>(
    `/ConnectionTypeMaster/${encodeURIComponent(String(id))}`
  );
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "getConnectionTypeById");
  }
  const raw = (response.data?.data ?? response.data?.items ?? response.data?.item ?? response.data) as Record<string, unknown>;
  return normalizeConnectionType(raw);
}

export async function deleteConnectionType(id: number, _userId?: number): Promise<void> {
  let response = await apiClient.delete(
    `/ConnectionTypeMaster/${encodeURIComponent(String(id))}/purge`
  );
  if (!response.success) {
    response = await apiClient.delete(
      `/ConnectionTypeMaster/${encodeURIComponent(String(id))}`
    );
  }
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "deleteConnectionType");
  }
}

export async function createConnectionType(
  data: { connectionTypeCode?: string; connectionType: string; description?: string | null; isActive: boolean },
  userId?: number
): Promise<ConnectionType> {
  const { code, payload } = createPayload(data, userId);

  const response = await apiClient.post<Record<string, unknown>>("/ConnectionTypeMaster", payload);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "createConnectionType");
  }
  if (!response.data) {
    return {
      id: 0,
      connectionTypeCode: code,
      connectionType: data.connectionType,
      description: data.description ?? "",
      isActive: data.isActive,
    };
  }
  const raw = (response.data?.items ?? response.data?.data ?? response.data) as Record<string, unknown>;
  return normalizeConnectionType(raw);
}

export async function updateConnectionType(
  id: number,
  data: { connectionTypeCode?: string; connectionType: string; description?: string | null; isActive: boolean },
  userId?: number
): Promise<ConnectionType> {
  const { code, payload } = createPayload(data, userId, id);

  const response = await apiClient.put<Record<string, unknown>>(
    `/ConnectionTypeMaster/${encodeURIComponent(String(id))}`,
    payload
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "updateConnectionType");
  }
  if (!response.data) {
    return {
      id,
      connectionTypeCode: code,
      connectionType: data.connectionType,
      description: data.description ?? "",
      isActive: data.isActive,
    };
  }
  const raw = (response.data?.items ?? response.data?.data ?? response.data) as Record<string, unknown>;
  return normalizeConnectionType(raw);
}
