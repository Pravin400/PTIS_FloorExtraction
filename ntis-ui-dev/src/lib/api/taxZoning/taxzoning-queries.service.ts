import { apiClient } from "@/services/api.service";
import { getTranslations } from "next-intl/server";
import { ApiError, normalizePagedResponse } from "@/lib/utils/api";
import { PagedResponse } from "@/types/common.types";
import { TaxZone, TaxZoning, TaxZoningPropertyNo, Ward } from "@/types/taxzoning.types";

/**
 * Fetches paginated list of Tax Zones.
 */
export async function getTaxZonePagedServer(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<TaxZone>> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  const response = await apiClient.get<PagedResponse<TaxZone> | { items: PagedResponse<TaxZone> }>(
    `/TaxZone?${params.toString()}`
  );

  if (!response.success || !response.data) {
    const t = await getTranslations("taxZoning");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchTaxZonesFailed"),
      "getTaxZonePagedServer"
    );
  }

  return normalizePagedResponse<TaxZone>(response.data);
}

/**
 * Fetches paginated list of Wards.
 */
export async function getWardPagedServer(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<Ward>> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  const response = await apiClient.get<PagedResponse<Ward> | { items: PagedResponse<Ward> }>(
    `/Ward?${params.toString()}`
  );

  if (!response.success || !response.data) {
    const t = await getTranslations("taxZoning");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchWardsFailed"),
      "getWardPagedServer"
    );
  }

  return normalizePagedResponse<Ward>(response.data);
}

/**
 * Fetches paginated list of Tax Zoning records.
 */
export async function getTaxZoningPagedServer(
  pageNumber: number,
  pageSize: number,
  taxZoneId?: number,
  wardId?: number,
  groupBy?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<TaxZoning>> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  if (taxZoneId) params.append("TaxZoneId", taxZoneId.toString());
  if (wardId) params.append("WardId", wardId.toString());
  if (groupBy) params.append("GroupBy", groupBy);
  if (typeof sortBy === "string" && sortBy.trim()) params.append("SortBy", sortBy.trim());
  if (typeof sortOrder === "string" && sortOrder.trim()) params.append("SortOrder", sortOrder.trim());

  const response = await apiClient.get<PagedResponse<TaxZoning> | { items: PagedResponse<TaxZoning> }>(
    `/TaxZoning?${params.toString()}`
  );

  if (!response.success || !response.data) {
    const t = await getTranslations("taxZoning");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchZoningDataFailed"),
      "getTaxZoningPagedServer"
    );
  }

  return normalizePagedResponse<TaxZoning>(response.data);
}

/**
 * Fetches Tax Zoning records by Ward.
 */
export async function getTaxZoningByWardServer(
  wardNo: string,
  pageSize: number,
  pageNumber: number
): Promise<PagedResponse<TaxZoning>> {
  const params = new URLSearchParams({
    WardNo: wardNo,
    PageSize: pageSize.toString(),
    PageNumber: pageNumber.toString(),
  });

  const response = await apiClient.get<PagedResponse<TaxZoning> | { items: PagedResponse<TaxZoning> }>(
    `/TaxZoning?${params.toString()}`
  );

  if (!response.success || !response.data) {
    const t = await getTranslations("taxZoning");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchByWardFailed"),
      "getTaxZoningByWardServer"
    );
  }

  return normalizePagedResponse<TaxZoning>(response.data);
}

/**
 * Fetches all Tax Zoning records (paginated).
 */
export async function getAllTaxZoningServer(
  pageNumber: number,
  pageSize: number,
  taxZoneId?: number,
  wardId?: number
): Promise<PagedResponse<TaxZoning>> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  if (taxZoneId) params.append("TaxZoneId", taxZoneId.toString());
  if (wardId) params.append("WardId", wardId.toString());

  const response = await apiClient.get<PagedResponse<TaxZoning> | { items: PagedResponse<TaxZoning> }>(
    `/TaxZoning?${params.toString()}`
  );

  if (!response.success || !response.data) {
    const t = await getTranslations("taxZoning");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchAllFailed"),
      "getAllTaxZoningServer"
    );
  }

  return normalizePagedResponse<TaxZoning>(response.data);
}

/**
 * Fetches Tax Zoning Property Numbers.
 */
export async function getTaxZoningPropertyNoServer(
  pageNumber: number,
  pageSize: number,
  taxZoneId?: number,
  wardId?: number
): Promise<PagedResponse<TaxZoningPropertyNo>> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  if (taxZoneId) params.append("TaxZoneId", taxZoneId.toString());
  if (wardId) params.append("WardId", wardId.toString());

  const response = await apiClient.get<PagedResponse<TaxZoningPropertyNo> | { items: PagedResponse<TaxZoningPropertyNo> }>(
    `/TaxZoning?${params.toString()}`
  );

  if (!response.success || !response.data) {
    const t = await getTranslations("taxZoning");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchPropertyNoFailed"),
      "getTaxZoningPropertyNoServer"
    );
  }

  return normalizePagedResponse<TaxZoningPropertyNo>(response.data);
}
