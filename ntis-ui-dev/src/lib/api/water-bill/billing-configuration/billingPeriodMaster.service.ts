import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { apiClient } from "@/services/api.service";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import type { ApiResponse } from "@/types/common.types";
import type {
  BillingPeriodMaster,
  CreateBillingPeriodDto,
  UpdateBillingPeriodDto,
  BillingPeriodPagedResponse,
  BillingPeriodQueryParameters,
  DropdownOption,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";
import type { BillingFrequencyMasterPagedResponse } from "@/types/water-bill/billing-configuration/billingFrequencyMaster.types";
import type { FinancialYearPagedResponse } from "@/types/financialYear.types";

const BASE_ENDPOINT = "/BillingPeriod";

/**
 * Fetch paginated billing periods with query parameters
 */
export async function getBillingPeriodsPaged(
  params?: BillingPeriodQueryParameters
): Promise<ApiResponse<BillingPeriodPagedResponse>> {
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
    return await apiClient.get<BillingPeriodPagedResponse>(url);
  } catch (err: unknown) {
    const t = await getTranslations("billingPeriodMaster");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.fetchListFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Fetch a single billing period by ID with find and fallback
 */
export async function getBillingPeriodById(
  id: number
): Promise<ApiResponse<BillingPeriodMaster>> {
  try {
    const t = await getTranslations("billingPeriodMaster");

    // 1. Try direct REST endpoint: /BillingPeriod/{id}
    const directResponse = await apiClient.get<BillingPeriodMaster | { data?: BillingPeriodMaster }>(
      `${BASE_ENDPOINT}/${id}`
    );
    if (directResponse.success && directResponse.data) {
      const item = (
        'data' in directResponse.data && directResponse.data.data
          ? directResponse.data.data
          : directResponse.data
      ) as BillingPeriodMaster;

      if (item && (item.id === id || (item as Record<string, unknown>).Id === id)) {
        return {
          success: true,
          data: item,
          statusCode: directResponse.statusCode,
        };
      }
    }

    // 2. Query filter: /BillingPeriod?Id={id}
    const response = await apiClient.get<BillingPeriodPagedResponse>(`${BASE_ENDPOINT}?Id=${id}`);
    if (response.success && response.data?.items?.length) {
      const match = response.data.items.find((x) => x.id === id) ?? response.data.items[0];
      return {
        success: true,
        data: match,
        statusCode: response.statusCode,
      };
    }

    // 3. Fallback: fetch without query filter and locate record by id
    const fallbackResponse = await apiClient.get<BillingPeriodPagedResponse>(`${BASE_ENDPOINT}?PageSize=100`);
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
      error: directResponse.error || response.error || t("errors.notFound"),
      statusCode: directResponse.statusCode || response.statusCode || 404,
    };
  } catch (err: unknown) {
    const t = await getTranslations("billingPeriodMaster");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.fetchItemFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Create a new billing period
 */
export async function createBillingPeriod(
  dto: CreateBillingPeriodDto
): Promise<ApiResponse<BillingPeriodMaster>> {
  try {
    const cookieStore = await cookies();
    const cookieUserId = getUserIdFromCookies(cookieStore);
    const userId = dto.createdBy ?? (cookieUserId && cookieUserId > 0 ? cookieUserId : 1);
    const payload = {
      ...dto,
      createdBy: userId,
    };
    return await apiClient.post<BillingPeriodMaster>(BASE_ENDPOINT, payload);
  } catch (err: unknown) {
    const t = await getTranslations("billingPeriodMaster");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.createFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Update an existing billing period
 */
export async function updateBillingPeriod(
  id: number,
  dto: UpdateBillingPeriodDto
): Promise<ApiResponse<BillingPeriodMaster>> {
  try {
    const cookieStore = await cookies();
    const cookieUserId = getUserIdFromCookies(cookieStore);
    const userId = dto.updatedBy ?? (cookieUserId && cookieUserId > 0 ? cookieUserId : 1);
    const payload = {
      ...dto,
      updatedBy: userId,
    };
    return await apiClient.put<BillingPeriodMaster>(`${BASE_ENDPOINT}/${id}`, payload);
  } catch (err: unknown) {
    const t = await getTranslations("billingPeriodMaster");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.updateFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Permanently delete (purge) a billing period
 */
export async function purgeBillingPeriod(
  id: number
): Promise<ApiResponse<void>> {
  try {
    return await apiClient.delete<void>(`${BASE_ENDPOINT}/${id}/purge`);
  } catch (err: unknown) {
    const t = await getTranslations("billingPeriodMaster");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.deleteFailed"),
      statusCode: 500,
    };
  }
}

/**
 * Fetch financial year dropdown options for form selector
 */
export async function getFinancialYearDropdownOptions(): Promise<DropdownOption[]> {
  try {
    const response = await apiClient.get<FinancialYearPagedResponse>("/YearMaster?PageSize=100");
    if (response.success && response.data?.items) {
      return (response.data.items as unknown as Array<Record<string, unknown>>).map((fy) => {
        const id = (fy.id ?? fy.Id) as number;
        const yearNum = (fy.year ?? fy.Year ?? (fy.yearCode ? parseInt(String(fy.yearCode), 10) : undefined)) as number | undefined;
        const startDate = (fy.startDate ?? fy.StartDate ?? (yearNum ? `${yearNum}-04-01` : null)) as string | null;
        const endDate = (fy.endDate ?? fy.EndDate ?? (yearNum ? `${Number(yearNum) + 1}-03-31` : null)) as string | null;
        const label = fy.year ? String(fy.year) : fy.yearCode ? String(fy.yearCode) : String(id);
        return {
          value: String(id),
          label,
          data: {
            year: yearNum,
            startDate: startDate ? startDate.split("T")[0] : null,
            endDate: endDate ? endDate.split("T")[0] : null,
          },
        };
      });
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch billing frequency dropdown options for form selector
 */
export async function getBillingFrequencyDropdownOptions(): Promise<DropdownOption[]> {
  try {
    const response = await apiClient.get<BillingFrequencyMasterPagedResponse>("/BillingFrequencyMaster?PageSize=100");
    if (response.success && response.data?.items) {
      return [...response.data.items]
        .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
        .map((bf) => ({
          value: String(bf.id),
          label: bf.billingFrequency || bf.billingFrequencyCode || String(bf.id),
          data: {
            periodsPerYear: Number(bf.periodsPerYear) || 1,
            billingFrequencyCode: bf.billingFrequencyCode,
            code: bf.billingFrequencyCode,
            sequenceNo: bf.sequenceNo,
            billingFrequency: bf.billingFrequency,
          },
        }));
    }
    return [];
  } catch {
    return [];
  }
}