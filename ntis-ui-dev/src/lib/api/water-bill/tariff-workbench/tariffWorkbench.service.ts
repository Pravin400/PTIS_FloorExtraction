import { getTranslations } from "next-intl/server";
import { apiClient } from "@/services/api.service";
import { normalizePagedResponse } from "@/lib/utils/water-bill/utils";
import type { ApiResponse } from "@/types/common.types";
import type {
  TariffWorkbench,
  CreateTariffWorkbenchDto,
  UpdateTariffWorkbenchDto,
  TariffWorkbenchPagedResponse,
  TariffWorkbenchQueryParameters,
} from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";
import { normalizeTariffWorkbench } from "./tariffWorkbench.utils";

const BASE_ENDPOINT = "/TariffMaster";

export { normalizeTariffWorkbench };
export { parseApiBoolean } from "@/lib/utils/water-bill/utils";

export async function getTariffWorkbenchesPaged(
  params?: TariffWorkbenchQueryParameters
): Promise<ApiResponse<TariffWorkbenchPagedResponse>> {
  try {
    const query = new URLSearchParams();
    if (params?.id) query.append("Id", params.id.toString());
    if (params?.pageNumber) query.append("PageNumber", params.pageNumber.toString());
    if (params?.pageSize) query.append("PageSize", params.pageSize.toString());
    if (params?.searchTerm?.trim()) query.append("SearchTerm", params.searchTerm.trim());
    if (params?.tariffCode?.trim()) query.append("TariffCode", params.tariffCode.trim());
    if (params?.sortBy) query.append("SortBy", params.sortBy);
    if (params?.sortOrder) query.append("SortOrder", params.sortOrder);
    if (params?.filterLogic) query.append("FilterLogic", params.filterLogic);

    const url = query.toString() ? `${BASE_ENDPOINT}?${query.toString()}` : BASE_ENDPOINT;
    const response = await apiClient.get<unknown>(url);

    if (response.success && response.data) {
      const paged = normalizePagedResponse(response.data, normalizeTariffWorkbench, params);
      return { success: true, data: paged, statusCode: response.statusCode };
    }
    return response as ApiResponse<TariffWorkbenchPagedResponse>;
  } catch (err: unknown) {
    const t = await getTranslations("tariffWorkbench");
    return {
      success: false,
      error: err instanceof Error ? err.message : t("errors.fetchListFailed"),
      statusCode: 500,
    };
  }
}

export async function getTariffWorkbenchById(id: number): Promise<ApiResponse<TariffWorkbench>> {
  try {
    const t = await getTranslations("tariffWorkbench");
    const singleResp = await apiClient.get<unknown>(`${BASE_ENDPOINT}/${id}`);

    if (singleResp.success && singleResp.data) {
      let rawObj = singleResp.data as Record<string, unknown>;
      if (rawObj.data && typeof rawObj.data === "object" && !Array.isArray(rawObj.data)) {
        rawObj = rawObj.data as Record<string, unknown>;
      } else if (rawObj.result && typeof rawObj.result === "object" && !Array.isArray(rawObj.result)) {
        rawObj = rawObj.result as Record<string, unknown>;
      }
      const normalized = normalizeTariffWorkbench(rawObj);
      if (Number(normalized.id) === Number(id) || normalized.tariffCode) {
        return { success: true, data: normalized, statusCode: singleResp.statusCode };
      }
    }
    return {
      success: false,
      error: singleResp.error || t("errors.notFound"),
      statusCode: singleResp.statusCode || 404,
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

export async function createTariffWorkbench(
  dto: CreateTariffWorkbenchDto
): Promise<ApiResponse<TariffWorkbench>> {
  try {
    const t = await getTranslations("tariffWorkbench");
    const payload = {
      tariffCode: dto.tariffCode,
      tariffName: dto.tariffName,
      financialYearId: dto.financialYearId,
      connectionTypeId: dto.connectionTypeId ?? null,
      connectionCategoryId: dto.connectionCategoryId ?? null,
      tapSizeId: dto.tapSizeId ?? null,
      effectiveFrom: dto.effectiveFrom ? dto.effectiveFrom.split("T")[0] : dto.effectiveFrom,
      effectiveTo: dto.effectiveTo ? dto.effectiveTo.split("T")[0] : null,
      versionNo: dto.versionNo ?? 1,
      status: dto.status || "Draft",
      description: dto.description || null,
      isActive: dto.isActive,
    };

    const response = await apiClient.post<unknown>(BASE_ENDPOINT, payload);
    if (response.success && response.data) {
      let raw = response.data as Record<string, unknown>;
      if (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
        raw = raw.data as Record<string, unknown>;
      }
      return { success: true, data: normalizeTariffWorkbench(raw), statusCode: response.statusCode };
    }
    return {
      success: false,
      error: response.error || t("errors.createFailed"),
      statusCode: response.statusCode || 400,
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

export async function updateTariffWorkbench(
  id: number,
  dto: UpdateTariffWorkbenchDto
): Promise<ApiResponse<TariffWorkbench>> {
  try {
    const t = await getTranslations("tariffWorkbench");
    const payload = {
      id,
      tariffCode: dto.tariffCode,
      tariffName: dto.tariffName,
      financialYearId: dto.financialYearId,
      connectionTypeId: dto.connectionTypeId ?? null,
      connectionCategoryId: dto.connectionCategoryId ?? null,
      tapSizeId: dto.tapSizeId ?? null,
      effectiveFrom: dto.effectiveFrom ? dto.effectiveFrom.split("T")[0] : dto.effectiveFrom,
      effectiveTo: dto.effectiveTo ? dto.effectiveTo.split("T")[0] : null,
      versionNo: dto.versionNo ?? 1,
      status: dto.status || "Draft",
      description: dto.description || null,
      isActive: dto.isActive,
    };

    const response = await apiClient.put<unknown>(`${BASE_ENDPOINT}/${id}`, payload);
    if (response.success && response.data) {
      let raw = response.data as Record<string, unknown>;
      if (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
        raw = raw.data as Record<string, unknown>;
      }
      return { success: true, data: normalizeTariffWorkbench(raw), statusCode: response.statusCode };
    }
    return {
      success: false,
      error: response.error || t("errors.updateFailed"),
      statusCode: response.statusCode || 400,
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

export async function purgeTariffWorkbench(id: number): Promise<ApiResponse<void>> {
  try {
    const t = await getTranslations("tariffWorkbench");
    const response = await apiClient.delete<void>(`${BASE_ENDPOINT}/${id}`);
    if (response.success) return response;
    return {
      success: false,
      error: response.error || t("errors.deleteFailed"),
      statusCode: response.statusCode || 400,
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
