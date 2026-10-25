"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
    createDesignation,
    deleteDesignation,
    getDesignationsPaged,
    getDesignationById,
    updateDesignation,
    getOwningDepartments
} from "@/lib/api/asset-masters/designation-crud.service";
import { ApiError } from "@/lib/utils/api";
import { Designation, DesignationFormModel } from "@/types/asset-masters/designation.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("DesignationActions");

export async function fetchDesignationsPagedServerAction(
    pageNumber: number,
    pageSize: number,
    searchTerm?: string,
    sortBy?: string,
    sortOrder?: string
): Promise<PagedResponse<Designation>> {
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

        const allowedSortColumns = ["designationCode", "designationName", "designationLocal"];
        const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
        const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : undefined;

        const result = await getDesignationsPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
        return result;
    } catch (error: unknown) {
        logger.error("Failed to fetch designations paged", { pageNumber, pageSize, searchTerm, sortBy, sortOrder }, error);
        throw error;
    }
}

export async function createDesignationAction(
    data: DesignationFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            return { success: false, message: "you are unauthorized", statusCode: 401 };
        }
        data.createdBy = userId;
        const msg = await createDesignation(data);

        for (const locale of locales) {
            revalidatePath(`/${locale}/assets/configuration/master-data/designation-master`, "page");
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
        return { success: false, message: "Failed to create designation" };
    }
}

export async function updateDesignationAction(
    data: DesignationFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            return { success: false, message: "you are unauthorized", statusCode: 401 };
        }
        data.updatedBy = userId;
        const msg = await updateDesignation(data);

        for (const locale of locales) {
            revalidatePath(`/${locale}/assets/configuration/master-data/designation-master`, "page");
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
        return { success: false, message: "Failed to update designation" };
    }
}

export async function deleteDesignationAction(
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
            message: "Valid Designation ID is required",
            statusCode: 400,
        };
    }

    try {
        await deleteDesignation(numericId);

        for (const locale of locales) {
            revalidatePath(`/${locale}/assets/configuration/master-data/designation-master`, "page");
        }
        return {
            success: true,
            message: "Designation deleted successfully",
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
            message: "Failed to delete designation",
        };
    }
}

export async function getDesignationByIdAction(
    id: number
): Promise<Designation> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            throw new ApiError(401, "you are unauthorized", "Unauthorized");
        }
        const numericId = Number(id);
        if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
            throw new ApiError(400, "Valid Designation ID is required", "Validation failed");
        }
        const result = await getDesignationById(numericId);
        if (!result) {
            throw new ApiError(404, "Designation not found", "Not Found");
        }
        return result;
    } catch (error) {
        logger.error("Failed to fetch designation by ID", { id }, error);
        throw error;
    }
}

export async function getOwningDepartmentsAction() {
    try {
        return await getOwningDepartments();
    } catch (error) {
        logger.error("Failed to fetch owning departments", {}, error);
        throw error;
    }
}
