"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  createAssetGrievanceRemark,
  deleteAssetGrievanceRemark,
  getAssetGrievanceRemarkPaged,
  getAssetGrievanceRemarkById,
  updateAssetGrievanceRemark
} from "@/lib/api/asset-masters/asset-grievance-remark-crud.service";
import { getAssetGrievanceCategories } from "@/lib/api/asset-masters/asset-grievance-category-crud.service";
import { ApiError } from "@/lib/utils/api";
import { AssetGrievanceRemark, AssetGrievanceRemarkFormModel } from "@/types/asset-masters/asset-grievance-remark.types";
import { PagedResponse, ActionResult } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";
import { validateGrievanceRemarkServerAction } from "@/hooks/asset-masters/grievance-remark/validation";

const logger = createLogger("GrievanceRemarkActions");

export async function fetchAssetGrievanceRemarkPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetGrievanceRemark>> {
  const allowedSortColumns = ["remark"];
  const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
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

    return await getAssetGrievanceRemarkPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
  } catch (error: unknown) {
    logger.error("Failed to fetch asset grievance remarks paged", {
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

export async function createAssetGrievanceRemarkAction(
  data: AssetGrievanceRemarkFormModel
): Promise<ActionResult<string>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }

    const validation = validateGrievanceRemarkServerAction(data, false);
    if (!validation.isValid) {
      return {
        success: false,
        message: Object.values(validation.errors)[0] || "Validation failed",
        statusCode: 400,
        validationErrors: validation.errors as Record<string, string>,
      };
    }

    const msg = await createAssetGrievanceRemark({ ...data, createdBy: userId });

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/grievance-remark-master`, "page");
    }
    return { success: true, message: msg };
  } catch (error: unknown) {
    logger.error(
      "Failed to create asset grievance remark",
      { operation: "create", entity: "asset-grievance-remark" },
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
    return { success: false, message: "Failed to create asset grievance remark" };
  }
}

export async function updateAssetGrievanceRemarkAction(
  data: AssetGrievanceRemarkFormModel
): Promise<ActionResult<string>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }

    if (!data.id || data.id <= 0) {
      return { success: false, message: "Valid Asset Grievance Remark ID is required", statusCode: 400 };
    }

    const validation = validateGrievanceRemarkServerAction(data, true);
    if (!validation.isValid) {
      return {
        success: false,
        message: Object.values(validation.errors)[0] || "Validation failed",
        statusCode: 400,
        validationErrors: validation.errors as Record<string, string>,
      };
    }

    const msg = await updateAssetGrievanceRemark({ ...data, updatedBy: userId });

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/grievance-remark-master`, "page");
    }
    return { success: true, message: msg };
  } catch (error: unknown) {
    logger.error(
      "Failed to update asset grievance remark",
      { operation: "update", entity: "asset-grievance-remark", id: data.id },
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
    return { success: false, message: "Failed to update asset grievance remark" };
  }
}

export async function deleteAssetGrievanceRemarkAction(
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
      message: "Valid Asset Grievance Remark ID is required",
      statusCode: 400,
    };
  }

  try {
    await deleteAssetGrievanceRemark(numericId);

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/grievance-remark-master`, "page");
    }
    return {
      success: true,
      message: "Asset grievance remark deleted successfully",
    };
  } catch (error) {
    logger.error("Failed to delete asset grievance remark", { numericId }, error);
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: "Failed to delete asset grievance remark",
    };
  }
}

export async function getAssetGrievanceRemarkByIdAction(
  id: number
): Promise<AssetGrievanceRemark> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      throw new ApiError(401, "you are unauthorized", "Unauthorized");
    }
    const numericId = Number(id);
    if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
      throw new ApiError(400, "Valid Asset Grievance Remark ID is required", "Validation failed");
    }
    const result = await getAssetGrievanceRemarkById(numericId);
    if (!result) {
      throw new ApiError(404, "Asset Grievance Remark not found", "Not Found");
    }
    return result;
  } catch (error) {
    logger.error("Failed to fetch asset grievance remark by ID", { id }, error);
    throw error;
  }
}

export async function getGrievanceCategoriesAction() {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      throw new ApiError(401, "you are unauthorized", "Unauthorized");
    }
    return await getAssetGrievanceCategories();
  } catch (error) {
    logger.error("Failed to fetch active grievance categories", {}, error);
    throw error;
  }
}
