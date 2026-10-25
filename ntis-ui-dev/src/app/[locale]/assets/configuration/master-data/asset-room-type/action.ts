"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
    createAssetRoomType,
    deleteAssetRoomType,
    getAssetRoomPaged,
    getAssetRoomTypeById,
    updateAssetRoomType,
    getAssetTypes,
    getAssetCategories
} from "@/lib/api/asset-masters/asset-room-crud.service";
import { ApiError } from "@/lib/utils/api";
import { AssetRoomType, AssetRoomTypeFormModel } from "@/types/asset-masters/asset-room-type.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("AssetRoomTypeActions");


export async function fetchAssetRoomPagedServerAction(
    pageNumber: number,
    pageSize: number,
    searchTerm?: string,
    sortBy?: string,
    sortOrder?: string
): Promise<PagedResponse<AssetRoomType>> {
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

        const allowedSortColumns = ["roomTypeCode", "roomTypeName", "description"];
        const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
        const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : undefined;

        const result = await getAssetRoomPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
        return result;
    } catch (error: unknown) {
        logger.error("Failed to fetch asset room types paged", { pageNumber, pageSize, searchTerm, sortBy, sortOrder }, error);
        throw error;
    }
}

export async function createAssetRoomAction(
    data: AssetRoomTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            return { success: false, message: "you are unauthorized", statusCode: 401 };
        }
        data.createdBy = userId;
        const msg = await createAssetRoomType(data);

        for (const locale of locales) {
            revalidatePath(`/${locale}/assets/configuration/master-data/asset-room-type`, "page");
        }
        return { success: true, message: msg };
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return {
                success: false,
                message: error.responseText,
                statusCode: error.statusCode
            };
        }
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to create asset room type" };
    }
}

export async function updateAssetRoomAction(
    data: AssetRoomTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            return { success: false, message: "you are unauthorized", statusCode: 401 };
        }
        data.updatedBy = userId;
        const msg = await updateAssetRoomType(data);

        for (const locale of locales) {
            revalidatePath(`/${locale}/assets/configuration/master-data/asset-room-type`, "page");
        }
        return { success: true, message: msg };
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return {
                success: false,
                message: error.responseText,
                statusCode: error.statusCode
            };
        }
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to update asset room type" };
    }
}

export async function deleteAssetRoomTypeAction(
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
            message: "Valid Asset Room Type ID is required",
            statusCode: 400,
        };
    }

    try {
        await deleteAssetRoomType(numericId);

        for (const locale of locales) {
            revalidatePath(`/${locale}/assets/configuration/master-data/asset-room-type`, "page");
        }
        return {
            success: true,
            message: "Asset room type deleted successfully",
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
            message: "Failed to delete asset room type",
        };
    }
}

export async function getAssetRoomTypeByIdAction(
    id: number
): Promise<AssetRoomType> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            throw new ApiError(401, "you are unauthorized", "Unauthorized");
        }
        const numericId = Number(id);
        if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
            throw new ApiError(400, "Valid Asset Room Type ID is required", "Validation failed");
        }
        const result = await getAssetRoomTypeById(numericId);
        if (!result) {
            throw new ApiError(404, "Asset Room Type not found", "Not Found");
        }
        return result;
    } catch (error) {
        logger.error("Failed to fetch asset room type by ID", { id }, error);
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
