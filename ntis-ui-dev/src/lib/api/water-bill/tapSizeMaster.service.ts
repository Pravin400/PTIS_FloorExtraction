import type {
  TapSize,
  PagedResponse,
} from "@/types/waterBill/tapSizeMaster.types";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import {
  isTapSizeShape,
  normalizeTapSize,
  extractRawItems,
  filterTapSizes,
  createPayload,
} from "@/lib/utils/water-bill/tapSizeMaster.utils";

export async function getTapSizePaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  statusFilter?: string
): Promise<PagedResponse<TapSize>> {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
  if (statusFilter === "active") params.append("IsActive", "true");
  else if (statusFilter === "inactive") params.append("IsActive", "false");

  const response = await apiClient.get<Record<string, unknown>>(
    `/TapSizeMaster?${params.toString()}`
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "getTapSizePaged");
  }
  if (!response.data) {
    throw new ApiError(500, "", "getTapSizePaged");
  }

  const rawData = response.data;
  const rawItems = extractRawItems(rawData);

  let items = rawItems
    .filter(isTapSizeShape)
    .map((item) => normalizeTapSize(item as Record<string, unknown>));
  let totalCount = Number(rawData?.totalCount ?? rawData?.TotalCount ?? items.length);
  let totalPages = Number(rawData?.totalPages ?? rawData?.TotalPages ?? (Math.ceil(totalCount / pageSize) || 1));

  const filtered = filterTapSizes(items, searchTerm, statusFilter);
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

export async function getTapSizeById(id: number): Promise<TapSize> {
  const response = await apiClient.get<Record<string, unknown>>(
    `/TapSizeMaster/${encodeURIComponent(String(id))}`
  );
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "getTapSizeById");
  }
  const raw = (response.data?.data ?? response.data?.items ?? response.data?.item ?? response.data) as Record<string, unknown>;
  return normalizeTapSize(raw);
}

export async function deleteTapSize(id: number, _userId?: number): Promise<void> {
  let response = await apiClient.delete(
    `/TapSizeMaster/${encodeURIComponent(String(id))}/purge`
  );
  if (!response.success) {
    response = await apiClient.delete(
      `/TapSizeMaster/${encodeURIComponent(String(id))}`
    );
  }
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "deleteTapSize");
  }
}

export async function createTapSize(
  data: { tapSizeCode?: string; tapSize: string; nominalSizeValue?: number | string | null; sizeUnit?: string | null; isActive: boolean },
  userId?: number
): Promise<TapSize> {
  const { code, payload } = createPayload(data, userId);

  const response = await apiClient.post<Record<string, unknown>>("/TapSizeMaster", payload);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "createTapSize");
  }
  if (!response.data) {
    return {
      id: 0,
      tapSizeCode: code,
      tapSize: data.tapSize,
      nominalSizeValue: data.nominalSizeValue ? Number(data.nominalSizeValue) : null,
      sizeUnit: data.sizeUnit ?? "",
      isActive: data.isActive,
    };
  }
  const raw = (response.data?.items ?? response.data?.data ?? response.data) as Record<string, unknown>;
  return normalizeTapSize(raw);
}

export async function updateTapSize(
  id: number,
  data: { tapSizeCode?: string; tapSize: string; nominalSizeValue?: number | string | null; sizeUnit?: string | null; isActive: boolean },
  userId?: number
): Promise<TapSize> {
  const { code, payload } = createPayload(data, userId, id);

  const response = await apiClient.put<Record<string, unknown>>(
    `/TapSizeMaster/${encodeURIComponent(String(id))}`,
    payload
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "", "updateTapSize");
  }
  if (!response.data) {
    return {
      id,
      tapSizeCode: code,
      tapSize: data.tapSize,
      nominalSizeValue: data.nominalSizeValue ? Number(data.nominalSizeValue) : null,
      sizeUnit: data.sizeUnit ?? "",
      isActive: data.isActive,
    };
  }
  const raw = (response.data?.items ?? response.data?.data ?? response.data) as Record<string, unknown>;
  return normalizeTapSize(raw);
}
