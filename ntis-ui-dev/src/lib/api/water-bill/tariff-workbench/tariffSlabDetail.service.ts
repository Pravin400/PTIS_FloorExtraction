import { getTranslations } from "next-intl/server";
import { apiClient } from "@/services/api.service";
import { normalizePagedResponse } from "@/lib/utils/water-bill/utils";
import type { ApiResponse } from "@/types/common.types";
import type { TariffSlabData } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";
import { normalizeTariffSlabData } from "./tariffWorkbench.utils";

const BASE_ENDPOINT = "/TariffSlabDetail";

export interface TariffSlabQueryParameters {
  id?: number;
  tariffId?: number;
  geographyUnitId?: number;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterLogic?: string;
}

export interface TariffSlabPagedResponse {
  items: TariffSlabData[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}


/**
 * Fetch paginated or all tariff slab details
 */
export async function getTariffSlabDetailsPaged(
  params?: TariffSlabQueryParameters
): Promise<ApiResponse<TariffSlabPagedResponse>> {
  try {
    const query = new URLSearchParams();
    if (params?.id) query.append("Id", params.id.toString());
    if (params?.tariffId) query.append("TariffId", params.tariffId.toString());
    if (params?.geographyUnitId) query.append("GeographyUnitId", params.geographyUnitId.toString());
    query.append("PageNumber", (params?.pageNumber ?? 1).toString());
    query.append("PageSize", (params?.pageSize ?? 2000).toString());
    if (params?.searchTerm?.trim()) query.append("SearchTerm", params.searchTerm.trim());
    if (params?.sortBy) query.append("SortBy", params.sortBy);
    if (params?.sortOrder) query.append("SortOrder", params.sortOrder);
    if (params?.filterLogic) query.append("FilterLogic", params.filterLogic);

    const url = `${BASE_ENDPOINT}?${query.toString()}`;
    const response = await apiClient.get<unknown>(url);

    if (response.success && response.data) {
      const paged = normalizePagedResponse(response.data, normalizeTariffSlabData, params);
      return { success: true, data: paged as TariffSlabPagedResponse, statusCode: response.statusCode };
    }

    return {
      success: false,
      error: response.error,
      statusCode: response.statusCode,
    };
  } catch (err: unknown) {
    const t = await getTranslations("tariffWorkbench");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.fetchListFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Fetch a single tariff slab detail by ID
 */
export async function getTariffSlabDetailById(
  id: number
): Promise<ApiResponse<TariffSlabData>> {
  try {
    const t = await getTranslations("tariffWorkbench");
    const response = await apiClient.get<unknown>(`${BASE_ENDPOINT}/${id}`);
    if (response.success && response.data) {
      let raw = response.data as Record<string, unknown>;
      if (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
        raw = raw.data as Record<string, unknown>;
      }
      return { ...response, data: normalizeTariffSlabData(raw), statusCode: response.statusCode };
    }
    return {
      success: false,
      error: response.error || t("errors.fetchItemFailed"),
      statusCode: response.statusCode,
    };
  } catch (err: unknown) {
    const t = await getTranslations("tariffWorkbench");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.fetchItemFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Create a new tariff slab detail
 */
export async function createTariffSlabDetail(
  data: Partial<TariffSlabData>
): Promise<ApiResponse<TariffSlabData>> {
  try {
    const t = await getTranslations("tariffWorkbench");
    const response = await apiClient.post<TariffSlabData>(BASE_ENDPOINT, data);
    if (response.success && response.data) {
      return response;
    }
    return {
      success: false,
      error: response.error || t("errors.createFailed"),
      statusCode: response.statusCode,
    };
  } catch (err: unknown) {
    const t = await getTranslations("tariffWorkbench");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.createFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Update an existing tariff slab detail
 */
export async function updateTariffSlabDetail(
  id: number,
  data: Partial<TariffSlabData>
): Promise<ApiResponse<TariffSlabData>> {
  try {
    const t = await getTranslations("tariffWorkbench");
    const response = await apiClient.put<TariffSlabData>(`${BASE_ENDPOINT}/${id}`, data);
    if (response.success && response.data) {
      return response;
    }
    return {
      success: false,
      error: response.error || t("errors.updateFailed"),
      statusCode: response.statusCode,
    };
  } catch (err: unknown) {
    const t = await getTranslations("tariffWorkbench");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.updateFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Delete a tariff slab detail by ID
 */
export async function deleteTariffSlabDetail(
  id: number
): Promise<ApiResponse<boolean>> {
  try {
    const t = await getTranslations("tariffWorkbench");
    const response = await apiClient.delete<boolean>(`${BASE_ENDPOINT}/${id}`);
    if (response.success) {
      return { success: true, data: true, statusCode: response.statusCode };
    }
    return {
      success: false,
      error: response.error || t("errors.deleteFailed"),
      statusCode: response.statusCode,
    };
  } catch (err: unknown) {
    const t = await getTranslations("tariffWorkbench");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.deleteFailed"),
      statusCode: 500,
    };
  }
}
