"use server";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {createConstructionType, deleteConstructionType, getConstruction, getConstructionPaged, getConstructionTypeById, updateConstructionType } from "@/lib/api/constructiontypemaster/construction-crud.service";
import { ApiError } from "@/lib/utils/api";
import { ConstructionType, ConstructionTypeFormModel} from "@/types/construction.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

export async function fetchConstructionPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<ConstructionType>> {
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
    const allowedSortColumns = ["constructionCode", "description", "descriptionEnglish", "searchSequence"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : undefined;

    const result = await getConstructionPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
    return result;
  } catch (error: unknown) {
    // Log the error for debugging
    if (error instanceof ApiError) {
      console.error(
        `[fetchConstructionPagedServerAction] API Error ${error.statusCode}:`,
        error.responseText
      );
    } else if (error instanceof Error) {
      console.error(
        "[fetchConstructionPagedServerAction] Error:",
        error.message
      );
    } else {
      console.error(
        "[fetchConstructionPagedServerAction] Unknown error:",
        error
      );
    }

    // Re-throw the error so Next.js error boundary can catch it
    throw error;
  }
}
export async function createConstructionAction(
  data: ConstructionTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) {
      data.createdBy = userId;
    }
    await createConstructionType(data);
    // Revalidate all locale variants of the construction type page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/constructiontype`, "page");
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
    return { success: false, message: "Failed to create construction type" };
  }
}
/* ================= UPDATE ================= */
export async function updateConstructionAction(
  data: ConstructionTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) {
      data.updatedBy = userId;
    }
    await updateConstructionType(data);
    // Revalidate all locale variants of the construction type page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/constructiontype`, "page");
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
    return { success: false, message: "Failed to update construction type" };
  }
}
export async function deleteConstructionTypeAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const rawid = formData.get("id");
  const id =
    typeof rawid === "string" ? parseInt(rawid, 10) : 0;

  if (!id || id <= 0) {
    return {
      success: false,
      message: "Valid Construction Type ID is required",
      statusCode: 400,
    };
  }

  try {
    await deleteConstructionType(id);

    // Revalidate all locale variants of the construction type page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/constructiontype`, "page");
    }
    return {
      success: true,
      message: "Construction type deleted successfully",
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
      message: "Failed to delete construction type",
    };
  }
}

export async function getConstructionTypeByIdAction(
  id: number
): Promise<ConstructionType> {
  try {
    if (!id || id <= 0) {
      throw new ApiError(400, "Valid Construction Type ID is required", "Validation failed");
    }
    const result = await getConstructionTypeById(id);
    if (!result) {
      throw new ApiError(404, "Construction Type not found", "Not Found");
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(
        `[getConstructionTypeByIdAction] API Error ${error.statusCode}:`,
        error.responseText
      );
    } else {
      console.error(
        "[getConstructionTypeByIdAction] Error:",
        error
      );
    }
    throw error; // rethrow so UI can handle it
  }
}

export async function getAllConstructionTypesAction(): Promise<ConstructionType[]> {
  try {
    return await getConstruction();
  } catch (error) {
    console.error("[getAllConstructionTypesAction] Error:", error);
    return [];
  }
}
