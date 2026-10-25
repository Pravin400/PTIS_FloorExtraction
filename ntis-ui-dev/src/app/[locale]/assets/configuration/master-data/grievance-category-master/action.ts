"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  createAssetGrievanceCategory,
  deleteAssetGrievanceCategory,
  getAssetGrievanceCategoryPaged,
  getAssetGrievanceCategoryById,
  updateAssetGrievanceCategory
} from "@/lib/api/asset-masters/asset-grievance-category-crud.service";
import { ApiError } from "@/lib/utils/api";
import {
  AssetGrievanceCategory,
  AssetGrievanceCategoryFormModel,
  ALLOWED_SORT_COLUMNS,
} from "@/types/asset-masters/asset-grievance-category.types";
import { PagedResponse, ActionResult } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";
import { validateGrievanceCategoryServerAction } from "@/hooks/asset-masters/grievance-category/validation";

const logger = createLogger("GrievanceCategoryActions");

export async function fetchAssetGrievanceCategoryPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetGrievanceCategory>> {
  const validSortBy = sortBy && (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortBy) ? sortBy : undefined;
  const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : undefined;

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

    return await getAssetGrievanceCategoryPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
  } catch (error: unknown) {
    logger.error("Failed to fetch asset grievance categories paged", {
      pageNumber,
      pageSize,
      hasSearch: Boolean(searchTerm),
      searchLength: searchTerm ? searchTerm.length : 0,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    }, error);
    throw error;
  }
}

export async function createAssetGrievanceCategoryAction(
  data: AssetGrievanceCategoryFormModel
): Promise<ActionResult<string>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }

    const validation = validateGrievanceCategoryServerAction(data, false);
    if (!validation.isValid) {
      return {
        success: false,
        message: Object.values(validation.errors)[0] || "Validation failed",
        statusCode: 400,
        validationErrors: validation.errors as Record<string, string>,
      };
    }

    const msg = await createAssetGrievanceCategory({ ...data, createdBy: userId });

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/grievance-category-master`, "page");
    }
    return { success: true, message: msg };
  } catch (error: unknown) {
    logger.error(
      "Failed to create asset grievance category",
      { operation: "create", entity: "asset-grievance-category" },
      error
    );
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
    return { success: false, message: "Failed to create asset grievance category" };
  }
}

export async function updateAssetGrievanceCategoryAction(
  data: AssetGrievanceCategoryFormModel
): Promise<ActionResult<string>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }

    if (!data.id || data.id <= 0) {
      return { success: false, message: "Valid Asset Grievance Category ID is required", statusCode: 400 };
    }

    const validation = validateGrievanceCategoryServerAction(data, true);
    if (!validation.isValid) {
      return {
        success: false,
        message: Object.values(validation.errors)[0] || "Validation failed",
        statusCode: 400,
        validationErrors: validation.errors as Record<string, string>,
      };
    }

    const msg = await updateAssetGrievanceCategory({ ...data, updatedBy: userId });

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/grievance-category-master`, "page");
    }
    return { success: true, message: msg };
  } catch (error: unknown) {
    logger.error(
      "Failed to update asset grievance category",
      { operation: "update", entity: "asset-grievance-category", id: data.id },
      error
    );
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
    return { success: false, message: "Failed to update asset grievance category" };
  }
}

export async function deleteAssetGrievanceCategoryAction(
  formData: FormData
): Promise<ActionResult<void>> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) return { success: false, message: "you are unauthorized", statusCode: 401 };

  const rawId = formData.get("id");
  const numericId = Number(rawId);

  if (rawId == null || !Number.isInteger(numericId) || numericId <= 0) {
    return {
      success: false,
      message: "Valid Asset Grievance Category ID is required",
      statusCode: 400,
    };
  }

  try {
    await deleteAssetGrievanceCategory(numericId);

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/grievance-category-master`, "page");
    }
    return {
      success: true,
      message: "Asset grievance category deleted successfully",
    };
  } catch (error) {
    logger.error("Failed to delete asset grievance category", { numericId }, error);
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: "Failed to delete asset grievance category",
    };
  }
}

export async function getAssetGrievanceCategoryByIdAction(
  id: number
): Promise<AssetGrievanceCategory> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      throw new ApiError(401, "you are unauthorized", "Unauthorized");
    }
    const numericId = Number(id);
    if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
      throw new ApiError(400, "Valid Asset Grievance Category ID is required", "Validation failed");
    }
    const result = await getAssetGrievanceCategoryById(numericId);
    if (!result) {
      throw new ApiError(404, "Asset Grievance Category not found", "Not Found");
    }
    return result;
  } catch (error) {
    logger.error("Failed to fetch asset grievance category by ID", { id }, error);
    throw error;
  }
}
