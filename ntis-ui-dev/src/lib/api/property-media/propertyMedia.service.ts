import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { getAppConfig } from "@/config/app.config";
import { serverFetch } from "@/lib/utils/server-fetch";
import { getAuthHeaders } from "@/lib/utils/server-auth-headers";
import {
    BrowseMatchApiResponse,
    BrowseMatchPreviewApiResponse,
    CategoryOption,
    DashboardStatistics,
    DetailedCoverageItem,
    ExecuteLocalImportItem,
    ExecuteLocalImportPayload,
    ImportMatchPreviewData,
    LocalBulkUploadPayload,
    LocalBulkUploadResponse,
    MissingPropertiesApiData,
    MissingPropertiesQueryParams,
    PropertyMediaApiResponse,
    PropertyNumbersQueryParams,
    PropertyTypeResponse,
    WardResponse,
    WorkflowStageResponse,
    ZoneResponse,
    AuditTrailApiItem,
    AuditTrailQueryParams,
    JobStatusItem
} from "@/types/PropertyMedia/PropertyMedia.types";
import { buildQueryString } from "@/lib/utils/PropertyMedia/propertyMediaHelper";

function getBaseUrl(): string {
    const config = getAppConfig();
    const baseUrl = config.api.baseUrl?.trim();
    if (!baseUrl) throw new Error("Backend API base URL is not configured");
    return baseUrl.replace(/\/+$/, "");
}

/**
 * Fetches property media dashboard summary statistics from the API.
 */
export async function getPropertyMediaDashboardSummary(): Promise<PropertyMediaApiResponse<DashboardStatistics> | null> {
    try {
        const response = await apiClient.get<PropertyMediaApiResponse<DashboardStatistics>>("/PropertyMedia/dashboard-stats");
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch property media dashboard statistics",
                "Get dashboard statistics failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch property media dashboard statistics", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches property media category options from the API.
 */
export async function getPropertyMediaCategoryOptions(): Promise<PropertyMediaApiResponse<CategoryOption[]> | null> {
    try {
        const response = await apiClient.get<PropertyMediaApiResponse<CategoryOption[]>>("/PropertyMedia/categories");
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch property media categories",
                "Get category options failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch property media categories", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches subtype options by category id from the API.
 */
export async function getSubCategoryOptions(category: number): Promise<PropertyMediaApiResponse<CategoryOption[]> | null> {
    try {
        const response = await apiClient.get<PropertyMediaApiResponse<CategoryOption[]>>(`/PropertyMedia/subtypes?category=${category}`);
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch subtype options",
                "Get subtype options failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch subtype options", { error: error as Error });
        throw error;
    }
}


/**
 * Fetches Workflow Stage options from the API.
 */
export async function getWorkflowStageOptions(): Promise<WorkflowStageResponse | null> {
    try {
        const response = await apiClient.get<WorkflowStageResponse | null>("/PropertyWorkflowStageMaster");
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch workflow stage options",
                "Get workflow stage options failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch workflow stage options", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches Zone / Division options from the API.
 */
export async function getZoneOptions(): Promise<ZoneResponse | null> {
    try {
        const response = await apiClient.get<ZoneResponse | null>("/Zone?PageSize=-1");
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch zone options",
                "Get zone options failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch zone options", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches Ward options by Zone ID from the API.
 */
export async function getWardOptions(zoneId: number | string): Promise<WardResponse | null> {
    try {
        const response = await apiClient.get<WardResponse | null>(`/Ward?ZoneId=${zoneId}&PageSize=-1`);
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch ward options",
                "Get ward options failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch ward options", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches Property Type options from the API.
 */
export async function getPropertyTypeOptions(): Promise<PropertyTypeResponse | null> {
    try {
        const response = await apiClient.get<PropertyTypeResponse | null>("/PropertyTypeMaster?PageSize=-1");
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch property type options",
                "Get property type options failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch property type options", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches property media detailed coverage metrics from the API.
 */
export async function getPropertyMediaDetailedCoverage(
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    category?: string
): Promise<PropertyMediaApiResponse<DetailedCoverageItem[]> | null> {
    try {
        const query = buildQueryString({
            PageNumber: pageNumber,
            PageSize: pageSize,
            SearchTerm: searchTerm,
            Category: category,
        });

        const response = await apiClient.get<PropertyMediaApiResponse<DetailedCoverageItem[]>>(
            `/PropertyMedia/detailed-coverage-list${query ? `?${query}` : ""}`
        );
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch property media detailed coverage",
                "Get detailed coverage failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch property media detailed coverage", { error: error as Error });
        throw error;
    }
}

/**
 * Executes local media import process for a given photo sub-type and upload count.
 */
export async function executeLocalImport(
    payload: ExecuteLocalImportPayload
): Promise<PropertyMediaApiResponse<ExecuteLocalImportItem>> {
    try {
        if (!payload.photoTypeId || payload.photoTypeId <= 0 || isNaN(payload.photoTypeId)) {
            throw new ApiError(400, "Valid Photo Type ID is required", "Validation failed");
        }
        if (payload.maxFilesToProcess !== undefined && (payload.maxFilesToProcess < 0 || isNaN(payload.maxFilesToProcess))) {
            throw new ApiError(400, "Valid max files to process count is required", "Validation failed");
        }

        const requestBody = {
            photoTypeId: payload.photoTypeId,
            remarks: payload.remarks?.trim() || undefined,

        };

        const response = await apiClient.post<PropertyMediaApiResponse<ExecuteLocalImportItem>>(
            "/PropertyMedia/Server-bulk-upload",
            requestBody
        );

        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to execute local import",
                "Local import execution failed"
            );
        }

        if (!response.data) {
            throw new ApiError(500, "No data received from server", "Invalid response format");
        }

        return response.data;
    } catch (error) {
        logger.error("Failed to execute local import", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches property media import match preview pagination data.
 */
export async function getPropertyMediaImportMatchPreview(
    photoTypeId: number,
    page: number = 1,
    pageSize: number = 10
): Promise<PropertyMediaApiResponse<ImportMatchPreviewData> | null> {
    if (!photoTypeId || isNaN(photoTypeId) || photoTypeId <= 0) {
        return null;
    }

    try {
        const response = await apiClient.get<PropertyMediaApiResponse<ImportMatchPreviewData>>(
            `/PropertyMedia/Server-imports-Match/preview?photoTypeId=${photoTypeId}&page=${page}&pageSize=${pageSize}`
        );
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch import match preview",
                "Get import match preview failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch import match preview", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches missing properties for detailed coverage gap analysis from the API.
 */
export async function getMissingProperties(
    params: MissingPropertiesQueryParams = {}
): Promise<PropertyMediaApiResponse<MissingPropertiesApiData> | null> {
    try {
        const query = buildQueryString({
            photoTypeId: params.photoTypeId ?? params.id,
            PageNumber: params.pageNumber || 1,
            PageSize: params.pageSize || 10,
            SearchTerm: params.searchTerm,
            ZoneId: params.zoneId,
            WardId: params.wardId,
            WorkflowStageId: params.workflowStageId,
            PropertyTypeId: params.propertyTypeId,
        });

        const response = await apiClient.get<PropertyMediaApiResponse<MissingPropertiesApiData>>(
            `/PropertyMedia/detailed-coverage/missing-properties${query ? `?${query}` : ""}`
        );
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch missing properties",
                "Get missing properties failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch missing properties", { error: error as Error });
        throw error;
    }
}

/**
 * Uploads local/device media files for photo matching.
 * Calls POST /PropertyMedia/browse-Match with multipart/form-data.
 */
export async function uploadBrowseMatchMedia(
    formData: FormData
): Promise<BrowseMatchApiResponse> {
    try {
        const photoTypeId = formData.get("photoTypeId");
        if (!photoTypeId || isNaN(Number(photoTypeId)) || Number(photoTypeId) <= 0) {
            throw new ApiError(400, "Valid Photo Type ID is required", "Validation failed");
        }

        const files = formData.getAll("files");
        if (!files || files.length === 0) {
            throw new ApiError(400, "At least one image file is required", "Validation failed");
        }

        const baseUrl = getBaseUrl();
        const url = `${baseUrl}/PropertyMedia/Local-Imports-Match`;
        const headers = await getAuthHeaders();

        const response = await serverFetch(url, {
            method: "POST",
            headers,
            body: formData,
            cache: "no-store",
        });

        const text = await response.text();
        let data: BrowseMatchApiResponse | null = null;
        let parsedJson: Record<string, unknown> | null = null;
        try {
            parsedJson = text ? JSON.parse(text) : null;
            data = parsedJson as unknown as BrowseMatchApiResponse;
        } catch {
            data = { message: text } as BrowseMatchApiResponse;
        }

        if (!response.ok || (data && data.success === false)) {
            let errorMessage = data?.message || (parsedJson?.error as string);
            if (!errorMessage && parsedJson?.title) {
                if (parsedJson.errors && typeof parsedJson.errors === "object") {
                    const validationMessages = Object.values(parsedJson.errors as Record<string, string[]>)
                        .flat()
                        .filter(Boolean)
                        .join("; ");
                    errorMessage = validationMessages ? `${parsedJson.title}: ${validationMessages}` : String(parsedJson.title);
                } else {
                    errorMessage = String(parsedJson.title);
                }
            }
            if (!errorMessage && text && text.trim().length > 0) {
                errorMessage = text.trim();
            }
            if (!errorMessage) {
                errorMessage = `Upload failed with status ${response.status}`;
            }

            throw new ApiError(
                response.status,
                errorMessage,
                "Browse match media upload failed"
            );
        }

        return data as BrowseMatchApiResponse;
    } catch (error) {
        logger.error("Failed to upload browse match media", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches property media browse match preview pagination data for a specific previewId.
 */
export async function getPropertyMediaBrowseMatchPreview(
    previewId: string,
    page: number = 1,
    pageSize: number = 10
): Promise<BrowseMatchPreviewApiResponse | null> {
    try {
        const cleanPreviewId = previewId?.trim();
        if (!cleanPreviewId) {
            throw new ApiError(400, "Valid Preview ID is required", "Validation failed");
        }

        const response = await apiClient.get<BrowseMatchPreviewApiResponse>(
            `/PropertyMedia/Local-Imports-Match/preview/${encodeURIComponent(cleanPreviewId)}?page=${page}&pageSize=${pageSize}`
        );
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch browse match preview",
                "Get browse match preview failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch browse match preview", { error: error as Error });
        throw error;
    }
}

/**
 * Executes local bulk upload process for a matched preview.
 * Calls POST /PropertyMedia/local-bulk-upload with JSON body { previewId }.
 */
export async function executeLocalBulkUpload(
    payload: LocalBulkUploadPayload
): Promise<LocalBulkUploadResponse> {
    try {
        const cleanPreviewId = payload.previewId?.trim();
        if (!cleanPreviewId) {
            throw new ApiError(400, "Valid Preview ID is required", "Validation failed");
        }

        const response = await apiClient.post<LocalBulkUploadResponse>(
            "/PropertyMedia/local-bulk-upload",
            { previewId: cleanPreviewId }
        );

        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to execute local bulk upload",
                "Local bulk upload execution failed"
            );
        }

        if (!response.data) {
            throw new ApiError(500, "No data received from server", "Invalid response format");
        }

        return response.data;
    } catch (error) {
        logger.error("Failed to execute local bulk upload", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches property numbers for download filtering from the API.
 * Uses query parameters: DivisionId, WardIds (comma-separated string), and FromPropertyNo.
 */
export async function getPropertyNumbers(
    params: PropertyNumbersQueryParams = {}
): Promise<PropertyMediaApiResponse<string[]> | null> {
    try {
        const wardIdsString = Array.isArray(params.wardIds)
            ? params.wardIds.filter(Boolean).join(",")
            : params.wardIds;

        const query = buildQueryString({
            DivisionId: params.divisionId,
            WardIds: wardIdsString,
            FromPropertyNo: params.fromPropertyNo,
        });

        const response = await apiClient.get<PropertyMediaApiResponse<string[]>>(
            `/PropertyMedia/property-numbers${query ? `?${query}` : ""}`
        );
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch property numbers",
                "Get property numbers failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch property numbers", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches property media audit trail / jobs history from the API.
 * Uses query parameters: PageNumber, PageSize, and format.
 */
export async function getPropertyMediaAuditTrail(
    params: AuditTrailQueryParams = {}
): Promise<PropertyMediaApiResponse<AuditTrailApiItem[]> | null> {
    try {
        const query = buildQueryString({
            PageNumber: params.pageNumber || 1,
            PageSize: params.pageSize || 10,
            format: params.format,
        });

        const response = await apiClient.get<PropertyMediaApiResponse<AuditTrailApiItem[]>>(
            `/PropertyMedia/jobs-History${query ? `?${query}` : ""}`
        );
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || "Failed to fetch property media job history",
                "Get audit trail failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error("Failed to fetch property media audit trail", { error: error as Error });
        throw error;
    }
}

/**
 * Fetches the status of a property media upload background job.
 * @param jobId The integer ID of the background upload job.
 */
export async function getPropertyMediaJobStatus(
    jobId: number
): Promise<PropertyMediaApiResponse<JobStatusItem> | null> {
    if (!jobId || isNaN(jobId) || jobId <= 0) {
        throw new ApiError(400, "Valid Job ID is required", "Validation failed");
    }

    try {
        const response = await apiClient.get<PropertyMediaApiResponse<JobStatusItem>>(
            `/PropertyMedia/job-status/${jobId}`
        );
        if (!response.success) {
            throw new ApiError(
                response.statusCode ?? 500,
                response.error || `Failed to fetch status for job ${jobId}`,
                "Get job status failed"
            );
        }
        return response.data ?? null;
    } catch (error) {
        logger.error(`Failed to fetch property media job status for jobId: ${jobId}`, {
            error: error as Error,
        });
        throw error;
    }
}


