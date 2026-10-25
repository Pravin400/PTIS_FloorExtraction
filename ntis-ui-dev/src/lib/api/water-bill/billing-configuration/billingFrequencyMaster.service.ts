import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { apiClient } from "@/services/api.service";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import type { ApiResponse } from "@/types/common.types";
import type {
  BillingFrequencyMaster,
  CreateBillingFrequencyMasterDto,
  UpdateBillingFrequencyMasterDto,
  BillingFrequencyMasterPagedResponse,
  BillingFrequencyMasterQueryParameters,
} from "@/types/water-bill/billing-configuration/billingFrequencyMaster.types";

const BASE_ENDPOINT = "/BillingFrequencyMaster";

/**
 * Fetch paginated billing frequencies with query parameters
 */
export async function getBillingFrequenciesPaged(
  params?: BillingFrequencyMasterQueryParameters
): Promise<ApiResponse<BillingFrequencyMasterPagedResponse>> {
  try {
    const query = new URLSearchParams();

    if (params?.id) query.append("Id", params.id.toString());
    if (params?.pageNumber) query.append("PageNumber", params.pageNumber.toString());
    if (params?.pageSize) query.append("PageSize", params.pageSize.toString());
    if (params?.searchTerm?.trim()) query.append("SearchTerm", params.searchTerm.trim());
    if (params?.sortBy) query.append("SortBy", params.sortBy);
    if (params?.sortOrder) query.append("SortOrder", params.sortOrder);
    if (params?.filterLogic) query.append("FilterLogic", params.filterLogic);

    const url = query.toString() ? `${BASE_ENDPOINT}?${query.toString()}` : BASE_ENDPOINT;
    return await apiClient.get<BillingFrequencyMasterPagedResponse>(url);
  } catch (err: unknown) {
    const t = await getTranslations("billingFrequencyMaster");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.fetchListFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Fetch a single billing frequency by ID
 */
export async function getBillingFrequencyById(
  id: number
): Promise<ApiResponse<BillingFrequencyMaster>> {
  try {
    const t = await getTranslations("billingFrequencyMaster");
    const response = await apiClient.get<BillingFrequencyMasterPagedResponse>(`${BASE_ENDPOINT}?Id=${id}`);
    if (response.success && response.data?.items?.length) {
      const match = response.data.items.find((x) => x.id === id) ?? response.data.items[0];
      return {
        success: true,
        data: match,
        statusCode: response.statusCode,
      };
    }

    // Fallback: fetch without query filter and locate record by id
    const fallbackResponse = await apiClient.get<BillingFrequencyMasterPagedResponse>(BASE_ENDPOINT);
    if (fallbackResponse.success && fallbackResponse.data?.items?.length) {
      const match = fallbackResponse.data.items.find((x) => x.id === id);
      if (match) {
        return {
          success: true,
          data: match,
          statusCode: 200,
        };
      }
    }

    return {
      success: false,
      error: response.error || t("errors.notFound"),
      statusCode: response.statusCode || 404,
    };
  } catch (err: unknown) {
    const t = await getTranslations("billingFrequencyMaster");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.fetchItemFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Create a new billing frequency
 */
export async function createBillingFrequency(
  dto: CreateBillingFrequencyMasterDto
): Promise<ApiResponse<BillingFrequencyMaster>> {
  try {
    const cookieStore = await cookies();
    const cookieUserId = getUserIdFromCookies(cookieStore);
    const userId = dto.createdBy ?? (cookieUserId && cookieUserId > 0 ? cookieUserId : 1);
    const payload = {
      ...dto,
      createdBy: userId,
    };
    return await apiClient.post<BillingFrequencyMaster>(BASE_ENDPOINT, payload);
  } catch (err: unknown) {
    const t = await getTranslations("billingFrequencyMaster");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.createFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Update an existing billing frequency
 */
export async function updateBillingFrequency(
  id: number,
  dto: UpdateBillingFrequencyMasterDto
): Promise<ApiResponse<BillingFrequencyMaster>> {
  try {
    const cookieStore = await cookies();
    const cookieUserId = getUserIdFromCookies(cookieStore);
    const userId = dto.updatedBy ?? (cookieUserId && cookieUserId > 0 ? cookieUserId : 1);
    const payload = {
      ...dto,
      updatedBy: userId,
    };
    return await apiClient.put<BillingFrequencyMaster>(`${BASE_ENDPOINT}/${id}`, payload);
  } catch (err: unknown) {
    const t = await getTranslations("billingFrequencyMaster");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.updateFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Permanently delete (purge) a billing frequency
 */
export async function purgeBillingFrequency(
  id: number
): Promise<ApiResponse<void>> {
  try {
    return await apiClient.delete<void>(`${BASE_ENDPOINT}/${id}/purge`);
  } catch (err: unknown) {
    const t = await getTranslations("billingFrequencyMaster");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.deleteFailed"),
      statusCode: 500,
    };
  }
}
