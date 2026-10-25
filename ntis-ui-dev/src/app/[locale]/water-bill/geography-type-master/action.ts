"use server";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  createGeographyType,
  deleteGeographyType,
  getGeographyTypePaged,
  getGeographyTypeById,
  updateGeographyType,
} from "@/lib/api/water-bill/geographytypemaster/geography-type-crud.service";
import { ApiError } from "@/lib/utils/api";

import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";
import { GeographyType, GeographyTypeFormModel } from "@/types/water-bill/geographyType.types";

const logger = createLogger("GeographyTypeMaster");

/** Note: GET /GeographyTypeMaster does not support server-side sorting. */
export async function fetchGeographyTypePagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<GeographyType>> {
  try {
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

    return await getGeographyTypePaged(pageNumber, pageSize, searchTerm);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      logger.error("fetchGeographyTypePagedServerAction API error", { statusCode: error.statusCode }, error.responseText);
    } else {
      logger.error("fetchGeographyTypePagedServerAction failed", undefined, error);
    }
    throw error;
  }
}

export async function createGeographyTypeAction(
  data: GeographyTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) {
      data.createdBy = userId;
    }
    await createGeographyType(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/geography-type-master`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to create geography type" };
  }
}

export async function updateGeographyTypeAction(
  data: GeographyTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) {
      data.updatedBy = userId;
    }
    await updateGeographyType(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/geography-type-master`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to update geography type" };
  }
}

export async function deleteGeographyTypeAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? parseInt(rawId, 10) : 0;

  if (!id || id <= 0) {
    return { success: false, message: "Valid Geography Type ID is required", statusCode: 400 };
  }

  try {
    await deleteGeographyType(id);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/geography-type-master`, "page");
    }
    return { success: true, message: "Geography type deleted successfully" };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: "Failed to delete geography type" };
  }
}

export async function getGeographyTypeByIdAction(id: number): Promise<GeographyType> {
  try {
    if (!id || id <= 0) {
      throw new ApiError(400, "Valid Geography Type ID is required", "Validation failed");
    }
    const result = await getGeographyTypeById(id);
    if (!result) {
      throw new ApiError(404, "Geography Type not found", "Not Found");
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("getGeographyTypeByIdAction API error", { statusCode: error.statusCode }, error.responseText);
    } else {
      logger.error("getGeographyTypeByIdAction failed", undefined, error);
    }
    throw error;
  }
}
