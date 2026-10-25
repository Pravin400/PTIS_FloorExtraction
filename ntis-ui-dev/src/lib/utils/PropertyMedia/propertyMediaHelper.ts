import { SearchSelectOption, BadgeVariant } from "@/components/common";
import {
    CategoryOption,
    PropertyTypeItem,
    WardItem,
    WorkflowStage,
    ZoneItem,
} from "@/types/PropertyMedia/PropertyMedia.types";
import { requirementVariants, workflowStatusVariants } from "@/lib/constants/propertyMedia.constants";

export interface PropertyMediaApiErrorInput {
    statusCode?: number;
    message?: string;
    errorCode?: string;
}

export const mapWorkflowStagesToOptions = (workflowStages: WorkflowStage[]): SearchSelectOption[] => {
    return workflowStages.map((stage) => ({
        value: String(stage.id),
        label: stage.stageName
    }));
};

export const mapZonesToOptions = (zones: ZoneItem[]): SearchSelectOption[] => {
    return zones.map((zone) => ({
        value: String(zone.id),
        label: zone.zoneNo
    }));
};

export const mapPropertyTypesToOptions = (propertyTypes: PropertyTypeItem[]): SearchSelectOption[] => {
    return propertyTypes.map((type) => ({
        value: String(type.id),
        label: type.propertyDescription
    }));
};

export const mapWardsToOptions = (wards: WardItem[]): SearchSelectOption[] => {
    return wards.map((ward) => ({
        value: String(ward.id),
        label: ward.wardNo
    }));
};

export const mapSubCategoryToOptions = (subCategory?: CategoryOption[] | null): SearchSelectOption[] => {
    return (subCategory ?? []).map((category) => ({
        value: String(category.id),
        label: category.name
    }));
};

export const mapPropertyNumbersToOptions = (propertyNumbers?: string[] | null): SearchSelectOption[] => {
    return (propertyNumbers ?? []).map((num) => ({
        value: String(num),
        label: String(num),
    }));
};



export function getBadgeColor(value: string): BadgeVariant {
    return requirementVariants[value] ?? "default"
}


export function calculateMissingPercentage(missing: number, applicable: number): number {
    if (!applicable || applicable <= 0) return 0;
    const pct = (missing / applicable) * 100;
    return Number(pct.toFixed(2));
}

export function getWorkflowBadgeColor(value: string): BadgeVariant {
    return workflowStatusVariants[value] ?? "default";
}

/**
 * Generic query string builder that filters out undefined, null, and empty string values.
 * Safe for use in both Server Components and Client Components.
 *
 * @param params Object containing key-value pairs for query parameters
 * @returns Serialized URL query string (without the leading '?')
 */
export function buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            searchParams.set(key, String(value).trim());
        }
    });
    return searchParams.toString();
}


/**
 * Maps PropertyMedia API status codes and errors to localized user-friendly messages.
 *
 * @param result Object containing optional statusCode and message
 * @param t Translation function for 'propertyMedia' namespace
 * @param tCommon Translation function for 'common' namespace
 * @returns Localized error string
 */
export function mapPropertyMediaApiError(
    result: PropertyMediaApiErrorInput,
    t: (key: string, values?: Record<string, string | number>) => string,
    tCommon: (key: string) => string
): string {
    const rawMessage = result.message?.trim() || "";

    if (result.errorCode === "STORAGE_FILES_MISSING") {
        const countMatch = rawMessage.match(/(\d+)\s+matching\s+image\s+record/i);
        if (countMatch && countMatch[1]) {
            return t("uploadDownloadDrawer.apiErrors.storageFilesMissing", { count: countMatch[1] });
        }
        return t("uploadDownloadDrawer.apiErrors.storageFilesMissingGeneric");
    }

    if (result.errorCode === "NO_IMAGES_FOUND") {
        return t("uploadDownloadDrawer.apiErrors.noImagesFound");
    }

    // HTTP status codes and stable API error codes take precedence over messages.
    const errorMap: Record<number, string> = {
        409: t("uploadDownloadDrawer.apiErrors.duplicateMedia"),
        404: t("uploadDownloadDrawer.apiErrors.notFound"),
        401: tCommon("errors.unauthorized"),
        403: tCommon("errors.unauthorized"),
        413: t("uploadDownloadDrawer.apiErrors.payloadTooLarge"),
    };

    const code = result.statusCode ?? 0;
    if (errorMap[code]) return errorMap[code];

    if (result.errorCode === "PAYLOAD_TOO_LARGE") {
        return t("uploadDownloadDrawer.apiErrors.uploadInterruptedOrTooLarge");
    }

    if (code >= 500) return tCommon("errors.serverError");

    if (result.errorCode === "DOWNLOAD_FAILED") {
        return t("uploadDownloadDrawer.apiErrors.downloadFailed");
    }

    if (result.errorCode === "OPERATION_FAILED") {
        return t("uploadDownloadDrawer.apiErrors.operationFailed");
    }

    return rawMessage || t("uploadDownloadDrawer.apiErrors.operationFailed");
}


export function sanitizePositiveInteger(
    value: string | undefined,
    fallback: number,
    maximum: number
): number {
    if (!value || !/^\d+$/.test(value)) return fallback;
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) return fallback;
    return Math.min(Math.max(parsed, 1), maximum);
}