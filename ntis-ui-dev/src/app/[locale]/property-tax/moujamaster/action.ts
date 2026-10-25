"use server";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { createMouja, deleteMouja, getMoujaPaged, getMoujaById, updateMouja } from "@/lib/api/moujamaster/mouja-crud.service";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { Mouja, MoujaFormModel } from "@/types/mouja.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

export async function fetchMoujaPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<Mouja>> {
  try {
    // Basic validation with upper bounds
    const MAX_PAGE_SIZE = 100;
    const MAX_PAGE_NUMBER = 10000;
    if (
      !Number.isFinite(pageNumber) ||
      !Number.isFinite(pageSize) ||
      pageNumber <= 0 ||
      (pageSize <= 0 && pageSize !== -1) ||
      (pageSize > MAX_PAGE_SIZE && pageSize !== -1) ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      throw new ApiError(400, "Invalid pagination parameters", "Validation failed");
    }

    // Validate sortBy against allowed columns to prevent injection
    const allowedSortColumns = ["moujaNo", "moujaName"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : undefined;

    const result = await getMoujaPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
    return result;
  } catch (error: unknown) {
    // Log the error for debugging
    if (error instanceof ApiError) {
      logger.error(
        `[fetchMoujaPagedServerAction] API Error ${error.statusCode}`,
        { error: error as Error, responseText: error.responseText }
      );
    } else if (error instanceof Error) {
      logger.error(
        "[fetchMoujaPagedServerAction] Error",
        { error, message: error.message }
      );
    } else {
      logger.error(
        "[fetchMoujaPagedServerAction] Unknown error",
        { errorValue: error }
      );
    }

    // Re-throw the error so Next.js error boundary can catch it
    throw error;
  }
}

export async function createMoujaAction(
  data: MoujaFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) {
      data.createdBy = userId;
    }
    await createMouja(data);
    // Revalidate all locale variants of the mouja page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/moujamaster`, "page");
    }
    return { success: true };
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
    return { success: false, message: "Failed to create mouja" };
  }
}

/* ================= UPDATE ================= */
export async function updateMoujaAction(
  data: MoujaFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) {
      data.updatedBy = userId;
    }
    await updateMouja(data);
    // Revalidate all locale variants of the mouja page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/moujamaster`, "page");
    }
    return { success: true };
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
    return { success: false, message: "Failed to update mouja" };
  }
}

export async function deleteMoujaAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const rawId = formData.get("id");
  const id =
    typeof rawId === "string" ? parseInt(rawId, 10) : 0;

  if (!id || id <= 0) {
    return {
      success: false,
      message: "Valid Mouja ID is required",
      statusCode: 400,
    };
  }

  try {
    await deleteMouja(id);

    // Revalidate all locale variants of the mouja page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/moujamaster`, "page");
    }
    return {
      success: true,
      message: "Mouja deleted successfully",
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
      message: "Failed to delete mouja",
    };
  }
}

export async function getMoujaByIdAction(
  id: number
): Promise<Mouja> {
  try {
    if (!id || id <= 0) {
      throw new ApiError(400, "Valid Mouja ID is required", "Validation failed");
    }
    const result = await getMoujaById(id);
    if (!result) {
      throw new ApiError(404, "Mouja not found", "Not Found");
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error(
        `[getMoujaByIdAction] API Error ${error.statusCode}`,
        { error, responseText: error.responseText }
      );
    } else {
      logger.error(
        "[getMoujaByIdAction] Error",
        { error: error as Error }
      );
    }
    throw error; // rethrow so UI can handle it
  }
}
