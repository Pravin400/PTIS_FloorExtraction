'use server';

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
    getPropertyMediaDashboardSummary,
    getPropertyMediaCategoryOptions,
    getSubCategoryOptions,
    getWorkflowStageOptions,
    getZoneOptions,
    getWardOptions,
    getPropertyTypeOptions,
    getPropertyMediaDetailedCoverage,
    executeLocalImport,
    uploadBrowseMatchMedia,
    getPropertyMediaBrowseMatchPreview,
    executeLocalBulkUpload,
    getPropertyMediaImportMatchPreview,
    getMissingProperties,
    getPropertyNumbers,
    getPropertyMediaAuditTrail,
    getPropertyMediaJobStatus
} from "@/lib/api/property-media/propertyMedia.service";
import {
    DashboardStatistics,
    CategoryOption,
    WorkflowStage,
    ZoneItem,
    WardItem,
    PropertyTypeItem,
    DetailedCoverageItem,
    ExecuteLocalImportPayload,
    ExecuteLocalImportItem,
    LocalBulkUploadPayload,
    LocalBulkUploadItem,
    BrowseMatchData,
    BrowseMatchPreviewResult,
    ImportMatchPreviewResult,
    MissingPropertiesQueryParams,
    MissingPropertiesResult,
    MissingPropertyRow,
    PropertyNumbersQueryParams,
    ActivityLog,
    AuditTrailQueryParams,
    AuditTrailResult,
    JobStatusItem
} from "@/types/PropertyMedia/PropertyMedia.types";
import { PagedResponse, ActionResult } from "@/types/common.types";
import { logger } from "@/lib/utils/logger";
import { locales } from "@/i18n/config";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Server action to fetch property media dashboard summary statistics.
 */
export async function fetchPropertyMediaDashboardSummaryAction(): Promise<DashboardStatistics | null> {
    try {
        const data = await getPropertyMediaDashboardSummary();
        if (!data?.items) {
            return null;
        }
        return data.items;
    } catch (error) {
        logger.error("Failed to fetch property media dashboard statistics", { error: error as Error });
        return null;
    }
}

/**
 * Server action to fetch property media category options.
 */
export async function fetchPropertyMediaCategoryOptionsAction(): Promise<CategoryOption[]> {
    try {
        const data = await getPropertyMediaCategoryOptions();
        if (!data?.items) {
            return [];
        }
        return data.items;
    } catch (error) {
        logger.error("Failed to fetch property media category options", { error: error as Error });
        return [];
    }
}

/**
 * Server action to fetch property media subtype options.
 */
export async function fetchSubCategoryOptionsAction(category?: number): Promise<CategoryOption[]> {
    if (!category) {
        return [];
    }
    try {
        const data = await getSubCategoryOptions(category);
        if (!data?.items) {
            return [];
        }
        return data.items;
    } catch (error) {
        logger.error("Failed to fetch property media subtype options", { error: error as Error });
        return [];
    }
}

/**
 * Server action to fetch workflow stage options.
 */
export async function fetchWorkflowStageOptionsAction(): Promise<WorkflowStage[] | null> {
    try {
        const data = await getWorkflowStageOptions();
        if (!data?.items) {
            return null;
        }
        return data.items;
    } catch (error) {
        logger.error("Failed to fetch workflow stage options", { error: error as Error });
        return null;
    }
}

/**
 * Server action to fetch Zone / Division options.
 */
export async function fetchZoneOptionsAction(): Promise<ZoneItem[] | null> {
    try {
        const data = await getZoneOptions();
        if (!data?.items) {
            return null;
        }
        return data.items;
    } catch (error) {
        logger.error("Failed to fetch zone options", { error: error as Error });
        return null;
    }
}

/**
 * Server action to fetch Ward options by Zone ID.
 */
export async function fetchWardOptionsAction(zoneId: number | string): Promise<WardItem[] | null> {
    try {
        const data = await getWardOptions(zoneId);
        if (!data?.items) {
            return null;
        }
        return data.items;
    } catch (error) {
        logger.error("Failed to fetch ward options", { error: error as Error });
        return null;
    }
}

/**
 * Server action to fetch Property Type options.
 */
export async function fetchPropertyTypeOptionsAction(): Promise<PropertyTypeItem[] | null> {
    try {
        const data = await getPropertyTypeOptions();
        if (!data?.items) {
            return null;
        }
        return data.items;
    } catch (error) {
        logger.error("Failed to fetch property type options", { error: error as Error });
        return null;
    }
}

/**
 * Server action to fetch property media detailed coverage metrics.
 */
export async function fetchPropertyMediaDetailedCoverageAction(
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    category?: string,
): Promise<PagedResponse<DetailedCoverageItem>> {
    try {
        const data = await getPropertyMediaDetailedCoverage(pageNumber, pageSize, searchTerm, category);
        const items = data?.items ?? [];
        const total = data?.totalCount ?? items.length;
        return {
            items,
            totalCount: total,
            pageNumber,
            pageSize,
            totalPages: Math.ceil(total / pageSize) || 1,
            hasPrevious: pageNumber > 1,
            hasNext: pageNumber * pageSize < total,
        };
    } catch (error) {
        logger.error("Failed to fetch property media detailed coverage", { error: error as Error });
        return {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
        };
    }
}

/**
 * Server action to execute local import for property media files.
 */
export async function executeLocalImportAction(
    payload: ExecuteLocalImportPayload
): Promise<ActionResult<ExecuteLocalImportItem>> {
    try {
        const userId = getUserIdFromCookies(await cookies());
        if (!userId) {
            return { success: false, error: "You are unauthorized.", statusCode: 401 };
        }
        if (!payload.photoTypeId || isNaN(payload.photoTypeId)) {
            return {
                success: false,
                error: "Valid Photo Type ID is required",
            };
        }
        if (payload.maxFilesToProcess !== undefined && (isNaN(payload.maxFilesToProcess) || payload.maxFilesToProcess < 0)) {
            return {
                success: false,
                error: "Valid upload count is required",
            };
        }

        const data = await executeLocalImport(payload);
        if (!data?.items) {
            return {
                success: false,
                error: data?.message || "Failed to execute local media import",
            };
        }

        for (const locale of locales) {
            revalidatePath(`/${locale}${ROUTES.PROPERTY_TAX.PROPERTY_MEDIA}`, "page");
        }
        return {
            success: true,
            data: data.items,
            message: data.message || "Media upload in progress. Please wait while files are being processed...",
        };
    } catch (error) {
        logger.error("Failed to execute local media import action", { error: error as Error });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to execute local media import",
        };
    }
}

/**
 * Server action to fetch property media import match preview pagination data.
 */
export async function fetchPropertyMediaImportMatchPreviewAction(
    photoTypeId?: number,
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<ActionResult<ImportMatchPreviewResult>> {
    if (!photoTypeId || isNaN(photoTypeId) || photoTypeId <= 0) {
        return { success: false, error: "Valid Photo Type ID is required.", statusCode: 400 };
    }

    try {
        const data = await getPropertyMediaImportMatchPreview(photoTypeId, pageNumber, pageSize);
        const pagination = data?.items;
        const total = pagination?.totalCount ?? 0;
        const size = pagination?.pageSize ?? pageSize;

        return {
            success: true,
            data: {
                items: pagination?.items ?? [],
                page: pagination?.page ?? pageNumber,
                pageSize: size,
                totalCount: total,
                totalPages: Math.ceil(total / size) || 1,
                totalMatched: pagination?.totalMatched ?? 0,
                totalUnmatched: pagination?.totalUnmatched ?? 0,
                hasPrevious: pageNumber > 1,
                hasNext: pageNumber * size < total,
            },
        };
    } catch (error) {
        logger.error("Failed to fetch property media import match preview", { error: error as Error });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch import match preview.",
        };
    }
}

/**
 * Server action to fetch missing properties for gap analysis view.
 */
export async function fetchMissingPropertiesAction(
    params: MissingPropertiesQueryParams = {}
): Promise<MissingPropertiesResult> {
    const pageNumber = params.pageNumber || 1;
    const pageSize = params.pageSize || 10;

    try {
        const data = await getMissingProperties(params);
        const apiData = data?.items;
        const rawItems = apiData?.items ?? [];

        const mappedItems: MissingPropertyRow[] = rawItems.map((item) => ({
            propertyId: item.propertyId,
            propertyNumber: item.propertyNo,
            division: item.zoneNo,
            ward: item.wardNo,
            ownerName: item.ownerName,
            propertyType: item.propertyType,
            missingType: item.missingType,
            workflowStatus: item.stageName?.trim() || "",
            lastUpdatedDate: item.updatedDate?.trim() || "",
        }));

        const totalCount = data?.totalCount ?? apiData?.gapRecords ?? mappedItems.length;

        return {
            items: mappedItems,
            photoTypeId: apiData?.photoTypeId,
            photoTypeName: apiData?.photoTypeName,
            gapRecords: apiData?.gapRecords ?? totalCount,
            totalCount,
            pageNumber,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize) || 1,
            hasPrevious: pageNumber > 1,
            hasNext: pageNumber * pageSize < totalCount,
        };
    } catch (error) {
        logger.error("Failed to fetch missing properties", { error: error as Error });
        return {
            items: [],
            totalCount: 0,
            pageNumber,
            pageSize,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
        };
    }
}

/**
 * Server action to execute local media files upload for photo matching.
 */
export async function uploadBrowseMatchMediaAction(
    formData: FormData
): Promise<ActionResult<BrowseMatchData>> {
    try {
        const photoTypeId = formData.get("photoTypeId");
        if (!photoTypeId || isNaN(Number(photoTypeId)) || Number(photoTypeId) <= 0) {
            return {
                success: false,
                error: "Valid Photo Type ID is required",
            };
        }

        const files = formData.getAll("files");
        if (!files || files.length === 0) {
            return {
                success: false,
                error: "At least one image file is required",
            };
        }

        const response = await uploadBrowseMatchMedia(formData);
        const matchData = response?.items;

        if (!matchData) {
            return {
                success: false,
                error: response?.message || "Failed to upload browse match media",
            };
        }

        return {
            success: true,
            data: matchData,
            message: response.message || "Media uploaded and matched successfully",
        };
    } catch (error) {
        logger.error("Failed to execute upload browse match media action", { error: error as Error });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to upload browse match media",
        };
    }
}

/**
 * Server action to fetch property media browse match preview pagination data for a specific previewId.
 */
export async function fetchPropertyMediaBrowseMatchPreviewAction(
    previewId: string,
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<BrowseMatchPreviewResult> {
    const emptyResult: BrowseMatchPreviewResult = {
        previewId: previewId?.trim() || "",
        items: [],
        page: pageNumber,
        pageSize,
        totalCount: 0,
        totalPages: 0,
        totalMatched: 0,
        totalUnmatched: 0,
        hasPrevious: false,
        hasNext: false,
    };

    const targetPreviewId = previewId?.trim();
    if (!targetPreviewId) {
        return emptyResult;
    }

    try {
        const response = await getPropertyMediaBrowseMatchPreview(targetPreviewId, pageNumber, pageSize);
        const preview = response?.items;

        if (!preview) {
            return emptyResult;
        }

        const items = preview.items ?? [];
        const totalCount = preview.totalCount ?? items.length;
        const currentPageSize = preview.pageSize || pageSize;
        const totalPages = Math.ceil(totalCount / currentPageSize) || 1;

        return {
            previewId: preview.previewId || targetPreviewId,
            items,
            page: preview.page || pageNumber,
            pageSize: currentPageSize,
            totalCount,
            totalPages,
            totalMatched: preview.totalMatched ?? 0,
            totalUnmatched: preview.totalUnmatched ?? 0,
            hasPrevious: pageNumber > 1,
            hasNext: pageNumber * currentPageSize < totalCount,
        };
    } catch (error) {
        logger.error("Failed to fetch browse match preview", { error: error as Error });
        return emptyResult;
    }
}

/**
 * Server action to execute local bulk upload for a matched job ID.
 */
export async function executeLocalBulkUploadAction(
    payload: LocalBulkUploadPayload
): Promise<ActionResult<LocalBulkUploadItem>> {
    try {
        const userId = getUserIdFromCookies(await cookies());
        if (!userId) {
            return { success: false, error: "You are unauthorized.", statusCode: 401 };
        }
        const data = await executeLocalBulkUpload(payload);
        if (!data?.items) {
            return {
                success: false,
                error: data?.message || "Failed to queue local bulk upload",
            };
        }

        for (const locale of locales) {
            revalidatePath(`/${locale}${ROUTES.PROPERTY_TAX.PROPERTY_MEDIA}`, "page");
        }
        return {
            success: true,
            data: data.items,
            message: data.message || "Media upload in progress. Please wait while files are being processed...",
        };
    } catch (error) {
        logger.error("Failed to execute local bulk upload action", { error: error as Error });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to queue local bulk upload",
        };
    }
}

/**
 * Server action to fetch property numbers for download filter.
 */
export async function fetchPropertyNumbersAction(
    params: PropertyNumbersQueryParams = {}
): Promise<string[]> {
    try {
        const data = await getPropertyNumbers(params);
        if (!data?.items) {
            return [];
        }
        return data.items;
    } catch (error) {
        logger.error("Failed to fetch property numbers", { error: error as Error });
        return [];
    }
}

/**
 * Server action to fetch property media audit trail / jobs history.
 */
export async function fetchPropertyMediaAuditTrailAction(
    params: AuditTrailQueryParams = {}
): Promise<AuditTrailResult> {
    const pageNumber = params.pageNumber || 1;
    const pageSize = params.pageSize || 10;

    try {
        const data = await getPropertyMediaAuditTrail(params);
        const rawItems = data?.items ?? [];

        const mappedItems: ActivityLog[] = rawItems.map((item) => ({
            dateTime: item["Date & Time"] || "",
            user: item.User || "",
            action: item.Action || "",
            category: item.Category || "",
            result: item.Result,
        }));

        const totalCount = data?.totalCount ?? mappedItems.length;

        return {
            items: mappedItems,
            totalCount,
            pageNumber,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize) || 1,
            hasPrevious: pageNumber > 1,
            hasNext: pageNumber * pageSize < totalCount,
        };
    } catch (error) {
        logger.error("Failed to fetch property media audit trail action", { error: error as Error });
        return {
            items: [],
            totalCount: 0,
            pageNumber,
            pageSize,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
        };
    }
}

/**
 * Server action to fetch status for a background media upload job.
 */
export async function fetchPropertyMediaJobStatusAction(
    jobId: number
): Promise<ActionResult<JobStatusItem>> {
    if (!jobId || isNaN(jobId) || jobId <= 0) {
        return {
            success: false,
            error: "Valid Job ID is required",
        };
    }

    try {
        const data = await getPropertyMediaJobStatus(jobId);
        if (!data?.items) {
            return {
                success: false,
                error: data?.message || "Failed to fetch job status",
            };
        }

        return {
            success: true,
            data: data.items,
            message: data.message,
        };
    } catch (error) {
        logger.error("Failed to fetch property media job status action", { error: error as Error });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to retrieve job status",
        };
    }
}

