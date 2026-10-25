import "server-only";

import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";
import {
  InitOperationsResponse,
  ScopeOptionsResponse,
  SearchPropertiesResponse,
  EligibleCountPayload,
  EligibleCountResponse,
  ExecuteOperationPayload,
  ExecuteOperationResponse,
  OperationPreviewPayload,
  OperationPreviewResponse,
  ImportTemplateResponse,
  JobPropertyPaginatedResponse,
  MasterDataChangeSummary,
} from "@/types/addTaxes.types";
import {
  isSearchPropertyItemShape,
  normalizeSearchPropertyItem,
  isEligibleCountResponseShape,
  normalizeEligibleCountResponse,
} from "./add-taxes-types-guard";
import type { WardItem } from "@/types/wardMaster.types";

const logger = createLogger("AddTaxesService");

/**
 * Fetch ALL wards (PageSize=-1) for this screen's Ward dropdown. Mirrors
 * `getAllWardsForLinkAction` (zone-master module) but kept local to this service so the Add Taxes
 * Route Handler doesn't need to reach into an unrelated module's Server Action file.
 */
export async function getAllWardsForOperations(searchTerm?: string): Promise<{ data: WardItem[]; totalCount: number }> {
  try {
    const params = new URLSearchParams();
    params.set("PageSize", "-1");
    if (searchTerm) params.set("SearchTerm", searchTerm);
    const response = await apiClient.get<{ items?: WardItem[]; totalCount?: number }>(`/Ward?${params.toString()}`);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch wards", "Get wards failed");
    }
    const items = response.data.items || [];
    return { data: items, totalCount: response.data.totalCount || items.length };
  } catch (error) {
    logger.error("Error fetching wards", undefined, error);
    throw error;
  }
}

interface SearchByCategoryItem {
  propertyId: number;
  propertyNo: string;
  partitionNo?: string | null;
}

interface SearchByCategoryResponse {
  items?: {
    items: SearchByCategoryItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious?: boolean;
    hasNext?: boolean;
  };
}

interface JobStatusResponse {
  jobId: string;
  status: string;
  total: number;
  processed: number;
  success: number;
  failed: number;
  pending: number;
  percentage: number;
}

/**
 * Initialize property tax operations.
 * API: GET /api/property-tax/operations/init
 */
export async function initOperations(financeYearId?: string | number): Promise<InitOperationsResponse> {
  try {
    const url = financeYearId !== undefined && financeYearId !== null
      ? `/property-tax/operations/init?financeYearId=${encodeURIComponent(String(financeYearId))}`
      : "/property-tax/operations/init";
    const response = await apiClient.get<InitOperationsResponse>(url);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to initialize operations",
        "Init operations failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error initializing operations", undefined, error);
    throw error;
  }
}

/**
 * Get system time from server.
 * API: GET /api/property-tax/operations/server-time
 */
export async function getServerTime(): Promise<string> {
  try {
    const response = await apiClient.get<string>("/property-tax/operations/server-time");
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch server time",
        "Fetch server time failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No server time received", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error fetching server time", undefined, error);
    throw error;
  }
}

/**
 * Fetch scope options.
 * API: GET /api/Property/search/scope-options
 */
export async function getScopeOptions(): Promise<ScopeOptionsResponse> {
  try {
    const response = await apiClient.get<ScopeOptionsResponse>("/Property/search/scope-options");
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch scope options",
        "Get scope options failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error fetching scope options", undefined, error);
    throw error;
  }
}

/**
 * Search properties by zone and ward.
 * API: GET /api/Property/search
 */
export async function searchProperties(
  zoneId: string | number | null,
  wardId: string | number
): Promise<SearchPropertiesResponse> {
  try {
    const queryParams = new URLSearchParams();
    const zoneStr = zoneId !== null && zoneId !== undefined ? String(zoneId).trim() : "";
    const wardStr = wardId !== null && wardId !== undefined ? String(wardId).trim() : "";

    if (zoneStr) queryParams.append("ZoneId", zoneStr);
    if (wardStr) queryParams.append("WardId", wardStr);
    queryParams.append("PageSize", "-1");

    const response = await apiClient.get<SearchPropertiesResponse>(
      `/Property/search?${queryParams.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to search properties",
        "Search properties failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    // Normalize the nested items using type guards
    const rawItems: unknown[] = response.data.items?.items ?? [];
    const normalizedItems = rawItems
      .filter(isSearchPropertyItemShape)
      .map(normalizeSearchPropertyItem);

    return {
      ...response.data,
      items: {
        ...response.data.items,
        items: normalizedItems,
      },
    };
  } catch (error) {
    logger.error("Error searching properties", undefined, error);
    throw error;
  }
}

/**
 * Search properties by category (e.g. WardWise SearchCategory=2).
 * API: GET /api/Property/search-by-category?SearchCategory=2&WardId={wardId}&PageNumber=1&PageSize=100
 */
export async function searchPropertiesByCategory(
  searchCategory: number = 2,
  wardId?: string | number,
  pageNumber: number = 1,
  pageSize: number = 100,
  propertyFrom?: string,
  propertyTo?: string,
  zoneId?: string | number,
  searchTerm?: string
): Promise<SearchByCategoryResponse> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("SearchCategory", String(searchCategory));
    if (wardId !== undefined && wardId !== null && wardId !== '') {
      queryParams.append("WardId", String(wardId));
    }
    if (zoneId !== undefined && zoneId !== null && zoneId !== '') {
      queryParams.append("ZoneId", String(zoneId));
    }
    if (propertyFrom) {
      queryParams.append("PropertyFrom", propertyFrom);
    }
    if (propertyTo) {
      queryParams.append("PropertyTo", propertyTo);
    }
    if (searchTerm) {
      queryParams.append("SearchTerm", searchTerm.trim());
    }
    queryParams.append("PageNumber", String(pageNumber));
    queryParams.append("PageSize", String(pageSize));

    const response = await apiClient.get<SearchByCategoryResponse>(
      `/Property/search-by-category?${queryParams.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to search properties by category",
        "Search properties by category failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error searching properties by category", undefined, error);
    throw error;
  }
}

/**
 * Get eligible properties count.
 * API: POST /api/property-tax/operations/eligible-count
 */
export async function getEligibleCount(
  payload: EligibleCountPayload
): Promise<EligibleCountResponse> {
  try {
    const response = await apiClient.post<EligibleCountResponse>(
      "/property-tax/operations/eligible-count",
      payload
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to get eligible count",
        "Eligible count failed"
      );
    }

    if (!response.data) {
      return { eligible: 0, total: 0, skipped: 0, alreadyTaxed: 0 };
    }

    // Validate response shape before returning
    if (isEligibleCountResponseShape(response.data)) {
      return normalizeEligibleCountResponse(response.data as Record<string, unknown>);
    }

    return { eligible: 0, total: 0, skipped: 0, alreadyTaxed: 0 };
  } catch (error) {
    logger.error("Error getting eligible count", undefined, error);
    throw error;
  }
}

/**
 * Execute property tax operations.
 * API: POST /property-tax/operations/execute
 */
export async function executeOperation(
  payload: ExecuteOperationPayload
): Promise<ExecuteOperationResponse> {
  try {
    const response = await apiClient.post<ExecuteOperationResponse>(
      "/property-tax/operations/execute",
      payload
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to execute operation",
        "Execute operation failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error executing operation", undefined, error);
    throw error;
  }
}

/**
 * Get job processed properties list.
 * API: GET /property-tax/operations/jobs/{jobId}/properties
 */
export async function getJobProperties(
  jobId: string,
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<JobPropertyPaginatedResponse> {
  try {
    const response = await apiClient.get<JobPropertyPaginatedResponse>(
      `/property-tax/operations/jobs/${jobId}/properties?PageNumber=${pageNumber}&PageSize=${pageSize}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch job properties",
        "Get job properties failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error fetching job properties", undefined, error);
    throw error;
  }
}

/**
 * Get job runtime status.
 * API: GET /property-tax/operations/jobs/{jobId}/status
 */
export async function getJobStatus(
  jobId: string
): Promise<JobStatusResponse> {
  try {
    const response = await apiClient.get<JobStatusResponse>(
      `/property-tax/operations/jobs/${jobId}/status`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch job status",
        "Get job status failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error fetching job status", undefined, error);
    throw error;
  }
}

/**
 * Preview property tax operations.
 * API: POST /api/property-tax/operations/preview
 */
export async function previewOperation(
  payload: OperationPreviewPayload
): Promise<OperationPreviewResponse> {
  try {
    const response = await apiClient.post<OperationPreviewResponse>(
      "/property-tax/operations/preview",
      payload
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to preview operation",
        "Preview operation failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error previewing operation", undefined, error);
    throw error;
  }
}

/**
 * Fetch audit list.
 * API: GET /property-tax/operations/audit
 */
export async function getAuditList(
  queryParams: Record<string, string | number | undefined>
): Promise<unknown> {
  try {
    const params = new URLSearchParams();
    for (const key in queryParams) {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        params.append(key, String(queryParams[key]));
      }
    }
    const response = await apiClient.get<unknown>(
      `/property-tax/operations/audit?${params.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch audit list",
        "Get audit list failed"
      );
    }
    return response.data;
  } catch (error) {
    logger.error("Error fetching audit list", undefined, error);
    throw error;
  }
}

/**
 * Fetch audit job detail.
 * API: GET /property-tax/operations/audit/{jobId}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Audit details are dynamically typed per operation
export async function getAuditDetail(jobId: string): Promise<any> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API returns dynamic detail data
    const response = await apiClient.get<any>(
      `/property-tax/operations/audit/${jobId}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch audit detail",
        "Get audit detail failed"
      );
    }
    return response.data;
  } catch (error) {
    logger.error("Error fetching audit detail", undefined, error);
    throw error;
  }
}

/**
 * Fetch Excel import template columns and metadata.
 * API: GET /property-tax/operations/import-template
 */
export async function getImportTemplate(): Promise<ImportTemplateResponse> {
  try {
    const response = await apiClient.get<ImportTemplateResponse>("/property-tax/operations/import-template");
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch import template",
        "Get import template failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error fetching import template", undefined, error);
    throw error;
  }
}

/**
 * Export properties excel/csv by status and financeYearId.
 * API: GET /property-tax/operations/export-properties?status={status}&financeYearId={financeYearId}
 */
export async function exportProperties(
  status: string,
  financeYearId: string | number
): Promise<{ base64: string; fileName: string }> {
  try {
    const params = new URLSearchParams();
    params.append("status", status);
    params.append("financeYearId", String(financeYearId));

    const endpoint = `/property-tax/operations/export-properties?${params.toString()}`;
    logger.info("exportProperties: Requesting export via apiClient.fetch", { endpoint, status, financeYearId });

    const response = await apiClient.fetch(endpoint);

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new ApiError(
        response.status,
        `Failed to export properties (${response.status}): ${errText || response.statusText}`,
        "Export properties failed"
      );
    }

    const contentDisposition = response.headers.get("content-disposition");
    let fileName = `property_tax_properties_${status.toLowerCase()}.csv`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, "");
      }
    }

    const fileBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(fileBuffer).toString("base64");
    return { base64, fileName };
  } catch (error) {
    logger.error("Error exporting properties", undefined, error);
    throw error;
  }
}

/**
 * Get master data change summary (affected recalculation properties count).
 * API: GET /property-tax/operations/master-data-changes/summary?financeYearId={financeYearId}
 */
export async function getMasterDataChangeSummary(
  financeYearId: string | number
): Promise<MasterDataChangeSummary> {
  try {
    const response = await apiClient.get<MasterDataChangeSummary>(
      `/property-tax/operations/master-data-changes/summary?financeYearId=${encodeURIComponent(String(financeYearId))}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch master data change summary",
        "Get master data change summary failed"
      );
    }
    if (!response.data) {
      return { affectedCount: 0 };
    }
    return response.data;
  } catch (error) {
    logger.error("Error fetching master data change summary", undefined, error);
    throw error;
  }
}

/**
 * Export affected master data change properties as CSV.
 * API: GET /property-tax/operations/master-data-changes/export?financeYearId={financeYearId}
 */
export async function exportMasterDataChangesCsv(
  financeYearId: string | number
): Promise<{ base64: string; fileName: string }> {
  try {
    const endpoint = `/property-tax/operations/master-data-changes/export?financeYearId=${encodeURIComponent(String(financeYearId))}`;
    logger.info("exportMasterDataChangesCsv: Requesting export", { financeYearId });

    const response = await apiClient.fetch(endpoint);
    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new ApiError(
        response.status,
        `Failed to export master data changes (${response.status}): ${errText || response.statusText}`,
        "Export master data changes failed"
      );
    }

    const contentDisposition = response.headers.get("content-disposition");
    let fileName = `master_data_affected_properties_FY${financeYearId}.csv`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, "");
      }
    }

    const fileBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(fileBuffer).toString("base64");
    return { base64, fileName };
  } catch (error) {
    logger.error("Error exporting master data changes CSV", undefined, error);
    throw error;
  }
}

/**
 * Fetch zone options mapped to {value, label} for Add Taxes operations.
 * Service-layer helper so route.ts does not couple to localized page actions.ts.
 */
export async function fetchZoneOptionsService(): Promise<{ value: string; label: string }[]> {
  try {
    const { fetchZonesAction } = await import("@/app/[locale]/property-tax/zone-master/actions");
    const res = await fetchZonesAction(1, -1);
    const items = (res as { items?: { id: string | number; description?: string; zoneNo?: string }[] } | null)?.items;
    return items
      ? items.map((z) => ({
          value: String(z.id),
          label: z.description && z.zoneNo ? `${z.zoneNo} — ${z.description}` : (z.description || z.zoneNo || ""),
        }))
      : [];
  } catch (error) {
    logger.error("Error fetching zone options service", undefined, error);
    return [];
  }
}

