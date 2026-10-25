"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  createAssetDocumentDefinition,
  deleteAssetDocumentDefinition,
  getAssetDocumentDefinitionById,
  getAssetDocumentDefinitionPaged,
  updateAssetDocumentDefinition,
} from "@/lib/api/asset-masters/asset-document-definition.service";
import { assetCategoryService } from "@/lib/api/asset-masters/asset-category-crud.service";
import { assetTypeService } from "@/lib/api/asset-masters/asset-type-crud.service";
import { ApiError } from "@/lib/utils/api";
import {
  AssetDocumentDefinition,
  AssetDocumentDefinitionFormModel,
} from "@/types/asset-masters/asset-document-definition.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("AssetDocumentDefinitionActions");
const ROUTE_PATH = "assets/configuration/master-data/asset-document-definition";

function revalidateMasterRoutes() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/${ROUTE_PATH}`, "page");
  }
}

export async function fetchAssetDocumentDefinitionPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetDocumentDefinition>> {
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

    const allowedSortColumns = ["documentCode", "documentName", "displayOrder"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder =
      sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase())
        ? sortOrder.toLowerCase()
        : undefined;

    return await getAssetDocumentDefinitionPaged(
      pageNumber,
      pageSize,
      searchTerm,
      validSortBy,
      validSortOrder
    );
  } catch (error: unknown) {
    logger.error("Failed to fetch asset document definitions paged", { pageNumber, pageSize, searchTerm, sortBy, sortOrder }, error);
    throw error;
  }
}

export async function createAssetDocumentDefinitionAction(
  data: AssetDocumentDefinitionFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }

    const msg = await createAssetDocumentDefinition({
      ...data,
      displayOrder: data.displayOrder ? Number(data.displayOrder) : null,
      createdBy: userId,
    });

    revalidateMasterRoutes();
    return { success: true, message: msg };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to create asset document definition" };
  }
}

export async function updateAssetDocumentDefinitionAction(
  data: AssetDocumentDefinitionFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }

    if (!data.id) {
      return { success: false, message: "Valid ID is required", statusCode: 400 };
    }

    const msg = await updateAssetDocumentDefinition({
      ...data,
      id: data.id,
      displayOrder: data.displayOrder ? Number(data.displayOrder) : null,
      updatedBy: userId,
    });

    revalidateMasterRoutes();
    return { success: true, message: msg };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to update asset document definition" };
  }
}

export async function deleteAssetDocumentDefinitionAction(
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
      message: "Valid Asset Document Definition ID is required",
      statusCode: 400,
    };
  }

  try {
    const msg = await deleteAssetDocumentDefinition(numericId);
    revalidateMasterRoutes();
    return { success: true, message: msg };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    return { success: false, message: "Failed to delete asset document definition" };
  }
}

export async function getAssetDocumentDefinitionByIdAction(
  id: number
): Promise<AssetDocumentDefinition> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      throw new ApiError(401, "you are unauthorized", "Unauthorized");
    }

    const numericId = Number(id);
    if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
      throw new ApiError(400, "Valid Asset Document Definition ID is required", "Validation failed");
    }

    return await getAssetDocumentDefinitionById(numericId);
  } catch (error) {
    logger.error("Failed to fetch asset document definition by ID", { id }, error);
    throw error;
  }
}

export async function getAssetCategoriesAction() {
  try {
    const res = await assetCategoryService.getAll({ PageSize: -1, IsActive: "true" });
    return res.items.map((item) => ({ id: item.id, categoryName: item.categoryName }));
  } catch (error) {
    logger.error("Failed to fetch asset categories", {}, error);
    throw error;
  }
}

export async function getAssetTypesByCategoryAction(assetCategoryId?: number) {
  try {
    const res = await assetTypeService.getAll({
      PageSize: -1,
      IsActive: "true",
      CategoryId: assetCategoryId,
    });
    return res.items.map((item) => ({ id: item.id, typeName: item.typeName }));
  } catch (error) {
    logger.error("Failed to fetch asset types by category", { assetCategoryId }, error);
    throw error;
  }
}
