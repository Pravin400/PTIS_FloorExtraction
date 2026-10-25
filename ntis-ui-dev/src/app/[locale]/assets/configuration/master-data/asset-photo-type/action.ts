"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
    createAssetPhotoType,
    deleteAssetPhotoType,
    getAssetPhotoPaged,
    getAssetPhotoTypeById,
    updateAssetPhotoType,
    getAssetCategories,
    getAssetTypes
} from "@/lib/api/asset-masters/asset-photo-crud.service";
import { ApiError } from "@/lib/utils/api";
import { AssetPhotoType, AssetPhotoTypeFormModel } from "@/types/asset-masters/asset-photo-type.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("AssetPhotoTypeActions");


export async function fetchAssetPhotoPagedServerAction(
    pageNumber: number,
    pageSize: number,
    searchTerm?: string,
    sortBy?: string,
    sortOrder?: string
): Promise<PagedResponse<AssetPhotoType>> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            throw new ApiError(401, "you are unauthorized", "Unauthorized");
        }
        const MAX_PAGE_SIZE = 100;
        const MAX_PAGE_NUMBER = 10000;
        if (
            !Number.isFinite(pageNumber) ||
            !Number.isFinite(pageSize) ||
            pageNumber <= 0 ||
            pageSize <= 0 ||
            pageSize > MAX_PAGE_SIZE ||
            pageNumber > MAX_PAGE_NUMBER
        ) {
            throw new ApiError(400, "Invalid pagination parameters", "Validation failed");
        }

        const allowedSortColumns = ["photoTypeCode", "photoTypeName", "displayOrder", "description"];
        const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
        const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : undefined;

        const result = await getAssetPhotoPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
        return result;
    } catch (error: unknown) {
        logger.error("Failed to fetch asset photo types paged", { pageNumber, pageSize, searchTerm, sortBy, sortOrder }, error);
        throw error;
    }
}

export async function createAssetPhotoAction(
    data: AssetPhotoTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number; validationErrors?: Record<string, string> }> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            return { success: false, message: "you are unauthorized", statusCode: 401 };
        }
        data.createdBy = userId;
        const msg = await createAssetPhotoType(data);

        for (const locale of locales) {
            revalidatePath(`/${locale}/assets/configuration/master-data/asset-photo-type`, "page");
        }
        return { success: true, message: msg };
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            let validationErrors: Record<string, string> | undefined = undefined;
            let errorMessage = error.responseText;
            try {
                const parsed = JSON.parse(error.responseText);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.errors) validationErrors = parsed.errors;
                    if (parsed.message) errorMessage = parsed.message;
                }
            } catch (_e) {
                // Not JSON, fallback to raw responseText
            }

            // Fallback parsing: apiClient flattens JSON errors into responseText string. 
            // We need to recreate field-level errors for UI mapping.
            if (!validationErrors && errorMessage) {
                const lowerMsg = errorMessage.toLowerCase();
                if (lowerMsg.includes("already exists") || lowerMsg.includes("duplicate")) {
                    validationErrors = {};
                    if (lowerMsg.includes("photo type code")) {
                        validationErrors["PhotoTypeCode"] = errorMessage;
                    }
                    if (lowerMsg.includes("photo type name")) {
                        validationErrors["PhotoTypeName"] = errorMessage;
                    }
                    if (Object.keys(validationErrors).length === 0) {
                         validationErrors = undefined;
                    }
                }
            }

            return {
                success: false,
                message: errorMessage,
                statusCode: error.statusCode,
                validationErrors
            };
        }
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to create asset photo type" };
    }
}

export async function updateAssetPhotoAction(
    data: AssetPhotoTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number; validationErrors?: Record<string, string> }> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            return { success: false, message: "you are unauthorized", statusCode: 401 };
        }
        data.updatedBy = userId;
        const msg = await updateAssetPhotoType(data);

        for (const locale of locales) {
            revalidatePath(`/${locale}/assets/configuration/master-data/asset-photo-type`, "page");
        }
        return { success: true, message: msg };
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            let validationErrors: Record<string, string> | undefined = undefined;
            let errorMessage = error.responseText;
            try {
                const parsed = JSON.parse(error.responseText);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.errors) validationErrors = parsed.errors;
                    if (parsed.message) errorMessage = parsed.message;
                }
            } catch (_e) {
                // Not JSON, fallback to raw responseText
            }

            // Fallback parsing: apiClient flattens JSON errors into responseText string. 
            // We need to recreate field-level errors for UI mapping.
            if (!validationErrors && errorMessage) {
                const lowerMsg = errorMessage.toLowerCase();
                if (lowerMsg.includes("already exists") || lowerMsg.includes("duplicate")) {
                    validationErrors = {};
                    if (lowerMsg.includes("photo type code")) {
                        validationErrors["PhotoTypeCode"] = errorMessage;
                    }
                    if (lowerMsg.includes("photo type name")) {
                        validationErrors["PhotoTypeName"] = errorMessage;
                    }
                    if (Object.keys(validationErrors).length === 0) {
                         validationErrors = undefined;
                    }
                }
            }

            return {
                success: false,
                message: errorMessage,
                statusCode: error.statusCode,
                validationErrors
            };
        }
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to update asset photo type" };
    }
}

export async function deleteAssetPhotoTypeAction(
    formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) return { success: false, message: "you are unauthorized", statusCode: 401 };

    const rawId = formData.get("id");
    const numericId = Number(rawId);

    if (rawId == null || !Number.isInteger(numericId) || numericId <= 0) {
        return {
            success: false,
            message: "Valid Asset Photo Type ID is required",
            statusCode: 400,
        };
    }

    try {
        await deleteAssetPhotoType(numericId);

        for (const locale of locales) {
            revalidatePath(`/${locale}/assets/configuration/master-data/asset-photo-type`, "page");
        }
        return {
            success: true,
            message: "Asset photo type deleted successfully",
        };
    } catch (error) {
        if (error instanceof ApiError) {
            return {
                success: false,
                message: error.responseText,
                statusCode: error.statusCode,
            };
        }
        return {
            success: false,
            message: "Failed to delete asset photo type",
        };
    }
}

export async function getAssetPhotoTypeByIdAction(
    id: number
): Promise<AssetPhotoType> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            throw new ApiError(401, "you are unauthorized", "Unauthorized");
        }
        const numericId = Number(id);
        if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
            throw new ApiError(400, "Valid Asset Photo Type ID is required", "Validation failed");
        }
        const result = await getAssetPhotoTypeById(numericId);
        if (!result) {
            throw new ApiError(404, "Asset Photo Type not found", "Not Found");
        }
        return result;
    } catch (error) {
        logger.error("Failed to fetch asset photo type by ID", { id }, error);
        throw error;
    }
}

export async function getAssetCategoriesAction() {
    try {
        return await getAssetCategories();
    } catch (error) {
        logger.error("Failed to fetch asset categories", {}, error);
        throw error;
    }
}

export async function getAssetTypesByCategoryAction(assetCategoryId?: number) {
    try {
        return await getAssetTypes(assetCategoryId);
    } catch (error) {
        logger.error("Failed to fetch asset types by category", { assetCategoryId }, error);
        throw error;
    }
}
