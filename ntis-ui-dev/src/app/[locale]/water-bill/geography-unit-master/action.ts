"use server";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  createGeographyUnit,
  deleteGeographyUnit,
  getGeographyUnitPaged,
  getGeographyUnitById,
  updateGeographyUnit,
  getParentGeographyUnitCandidates,
  getGeographyUnitHierarchyTree,
} from "@/lib/api/water-bill/geographyunitmaster/geography-unit-crud.service";
import { getGeographyTypePaged } from "@/lib/api/water-bill/geographytypemaster/geography-type-crud.service";
import { ApiError } from "@/lib/utils/api";
import { GeographyUnit, GeographyUnitFormModel, ParentGeographyUnitCandidate, GeographyUnitHierarchyNode } from "@/types/water-bill/geographyUnit.types";
import type { GeographyType } from "@/types/water-bill/geographyType.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("GeographyUnitMaster");

/** Note: GET /GeographyUnit does not support server-side sorting. */
export async function fetchGeographyUnitPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<GeographyUnit>> {
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

    return await getGeographyUnitPaged(pageNumber, pageSize, searchTerm);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      logger.error("fetchGeographyUnitPagedServerAction API error", { statusCode: error.statusCode }, error.responseText);
    } else {
      logger.error("fetchGeographyUnitPagedServerAction failed", undefined, error);
    }
    throw error;
  }
}

/** Fetches all geography types (for the form's type dropdown). */
export async function fetchGeographyTypeOptionsAction(): Promise<GeographyType[]> {
  try {
    const result = await getGeographyTypePaged(1, 100);
    return result.items;
  } catch (error) {
    logger.error("fetchGeographyTypeOptionsAction failed", undefined, error);
    return [];
  }
}

/** Fetches all geography units (for the form's parent-unit dropdown). */
export async function fetchGeographyUnitOptionsAction(): Promise<GeographyUnit[]> {
  try {
    const result = await getGeographyUnitPaged(1, 100);
    return result.items;
  } catch (error) {
    logger.error("fetchGeographyUnitOptionsAction failed", undefined, error);
    return [];
  }
}

/** Fetches valid parent-unit candidates for the given geography type (for the form's parent-unit dropdown). */
export async function fetchParentUnitCandidatesAction(
  geographyTypeId: number
): Promise<ParentGeographyUnitCandidate[]> {
  try {
    if (!geographyTypeId || geographyTypeId <= 0) return [];
    return await getParentGeographyUnitCandidates(geographyTypeId);
  } catch (error) {
    logger.error("fetchParentUnitCandidatesAction failed", { geographyTypeId }, error);
    return [];
  }
}

export async function createGeographyUnitAction(
  data: GeographyUnitFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) {
      data.createdBy = userId;
    }
    await createGeographyUnit(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/geography-unit-master`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to create geography unit" };
  }
}

export async function updateGeographyUnitAction(
  data: GeographyUnitFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) {
      data.updatedBy = userId;
    }
    await updateGeographyUnit(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/geography-unit-master`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to update geography unit" };
  }
}

export async function deleteGeographyUnitAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? parseInt(rawId, 10) : 0;

  if (!id || id <= 0) {
    return { success: false, message: "Valid Geography Unit ID is required", statusCode: 400 };
  }

  try {
    await deleteGeographyUnit(id);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/geography-unit-master`, "page");
    }
    return { success: true, message: "Geography unit deleted successfully" };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: "Failed to delete geography unit" };
  }
}

/** Fetches the full geography unit hierarchy as a nested tree (for the hierarchy view modal). */
export async function fetchGeographyUnitHierarchyTreeAction(): Promise<GeographyUnitHierarchyNode[]> {
  try {
    return await getGeographyUnitHierarchyTree();
  } catch (error) {
    logger.error("fetchGeographyUnitHierarchyTreeAction failed", undefined, error);
    return [];
  }
}

export async function getGeographyUnitByIdAction(id: number): Promise<GeographyUnit> {
  try {
    if (!id || id <= 0) {
      throw new ApiError(400, "Valid Geography Unit ID is required", "Validation failed");
    }
    const result = await getGeographyUnitById(id);
    if (!result) {
      throw new ApiError(404, "Geography Unit not found", "Not Found");
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("getGeographyUnitByIdAction API error", { statusCode: error.statusCode }, error.responseText);
    } else {
      logger.error("getGeographyUnitByIdAction failed", undefined, error);
    }
    throw error;
  }
}
