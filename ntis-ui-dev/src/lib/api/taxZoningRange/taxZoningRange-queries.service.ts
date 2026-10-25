import { apiClient } from "@/services/api.service";
import { getTranslations } from "next-intl/server";
import { ApiError, normalizePagedResponse } from "@/lib/utils/api";
import { PagedResponse } from "@/types/common.types";
import {
  TaxZone,
  TaxZoningCoverage,
  TaxZoningRange,
  TaxZoningRangeQuery,
  UlbDocument,
  Ward,
  WardProperty,
  WardZoningAbstractRow,
} from "@/types/taxZoningRange.types";

/** Existing generic Ward master lookup — not TaxZoning business logic, reused as-is. */
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
    const t = await getTranslations("taxZoningRange");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchWardsFailed"),
      "getWardPagedServer"
    );
  }

  return normalizePagedResponse<Ward>(response.data);
}

/** Existing generic Tax Zone master lookup — not TaxZoning business logic, reused as-is. */
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
    const t = await getTranslations("taxZoningRange");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchTaxZonesFailed"),
      "getTaxZonePagedServer"
    );
  }

  return normalizePagedResponse<TaxZone>(response.data);
}

/** Paged list of tax zoning range records. GET /api/tax-zoning-ranges returns the PagedResult directly (no ApiResponse wrapper). */
export async function getTaxZoningRangesPagedServer(
  query: TaxZoningRangeQuery
): Promise<PagedResponse<TaxZoningRange>> {
  const params = new URLSearchParams({
    PageNumber: query.pageNumber.toString(),
    PageSize: query.pageSize.toString(),
  });
  if (query.wardId) params.append("WardId", query.wardId.toString());
  if (query.taxZoneId) params.append("TaxZoneId", query.taxZoneId.toString());
  if (query.propertyNo) params.append("PropertyNo", query.propertyNo);
  if (query.description) params.append("Description", query.description);
  if (query.searchTerm) params.append("SearchTerm", query.searchTerm);
  if (query.sortBy) params.append("SortBy", query.sortBy);
  if (query.sortOrder) params.append("SortOrder", query.sortOrder);

  const response = await apiClient.get<
    PagedResponse<TaxZoningRange> | { items: PagedResponse<TaxZoningRange> }
  >(`/tax-zoning-ranges?${params.toString()}`);

  if (!response.success || !response.data) {
    const t = await getTranslations("taxZoningRange");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchRangesFailed"),
      "getTaxZoningRangesPagedServer"
    );
  }

  return normalizePagedResponse<TaxZoningRange>(response.data);
}

/** GET /api/tax-zoning-ranges/{id} — returns the DTO directly (no ApiResponse wrapper). 404 -> null. */
export async function getTaxZoningRangeByIdServer(id: number): Promise<TaxZoningRange | null> {
  const response = await apiClient.get<TaxZoningRange>(`/tax-zoning-ranges/${id}`);

  if (response.statusCode === 404) return null;

  if (!response.success || !response.data) {
    const t = await getTranslations("taxZoningRange");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchRangeFailed"),
      "getTaxZoningRangeByIdServer"
    );
  }

  return response.data;
}

/** GET /api/tax-zoning-ranges/coverage — dashboard KPI cards. */
export async function getTaxZoningCoverageServer(
  wardIds?: number[]
): Promise<TaxZoningCoverage> {
  const params = new URLSearchParams();
  wardIds?.forEach((id) => params.append("wardIds", String(id)));
  const qs = params.toString();

  const response = await apiClient.get<{ success: boolean; items: TaxZoningCoverage }>(
    `/tax-zoning-ranges/coverage${qs ? `?${qs}` : ""}`
  );

  if (!response.success || !response.data?.items) {
    const t = await getTranslations("taxZoningRange");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchCoverageFailed"),
      "getTaxZoningCoverageServer"
    );
  }

  return response.data.items;
}

/** GET /api/tax-zoning-ranges/ward-abstract?PageNumber=N&PageSize=N&SearchTerm=X */
export async function getWardAbstractServer(
  pageNumber = 1,
  pageSize = 10,
  searchTerm?: string
): Promise<PagedResponse<WardZoningAbstractRow>> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });
  if (searchTerm) params.set("SearchTerm", searchTerm);
  const response = await apiClient.get<unknown>(
    `/tax-zoning-ranges/ward-abstract?${params}`
  );
  const paged = normalizePagedResponse<WardZoningAbstractRow>(response.data);
  if (!paged) {
    const t = await getTranslations("taxZoningRange");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchWardAbstractFailed"),
      "getWardAbstractServer"
    );
  }
  return paged;
}

/** GET /api/tax-zoning-ranges/properties-by-ward?WardId={wardId}&PageNumber=1&PageSize=-1 */
export async function getPropertiesByWardServer(wardId: number): Promise<PagedResponse<WardProperty>> {
  const params = new URLSearchParams({
    WardId: wardId.toString(),
    PageNumber: "1",
    PageSize: "-1",
  });

  const response = await apiClient.get<PagedResponse<WardProperty> | { items: PagedResponse<WardProperty> }>(
    `/tax-zoning-ranges/properties-by-ward?${params.toString()}`
  );

  if (!response.success || !response.data) {
    const t = await getTranslations("taxZoningRange");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchPropertiesFailed"),
      "getPropertiesByWardServer"
    );
  }

  return normalizePagedResponse<WardProperty>(response.data);
}

/** GET /api/ulb-documents?typeCodes=... — current (latest) rows for the given type codes with joined file metadata. */
export async function getUlbDocumentsServer(typeCodes: string[]): Promise<UlbDocument[]> {
  const response = await apiClient.get<{ success: boolean; items: UlbDocument[] }>(
    `/ulb-documents?typeCodes=${encodeURIComponent(typeCodes.join(","))}`
  );

  if (!response.success || !response.data?.items) {
    const t = await getTranslations("taxZoningRange");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.fetchCertificatesFailed"),
      "getUlbDocumentsServer"
    );
  }

  return response.data.items;
}
