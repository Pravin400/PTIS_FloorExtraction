"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  getMoujasPaged,
  getMoujasAllActive,
  getMoujaById,
  createMouja,
  updateMouja,
  deleteMouja,
  getSubZonesPaged,
  getSubZoneById,
  createSubZone,
  updateSubZone,
  deleteSubZone
} from "@/lib/api/asset-masters/mouja-subzone.service";
import { ApiError } from "@/lib/utils/api";
import { Mouja, MoujaFormModel, SubZoneDetails, SubZoneFormModel } from "@/types/asset-masters/mouja-subzone.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("MoujaSubZoneActions");

function revalidateMoujaSubZoneRoutes() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/assets/configuration/master-data/mouja-subzone`, "page");
  }
}

// ==========================================
// MOUJA MASTER ACTIONS
// ==========================================

export async function fetchMoujasPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<Mouja>> {
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

    const allowedSortColumns = ["moujaNo", "moujaName"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : undefined;

    return await getMoujasPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
  } catch (error: unknown) {
    logger.error("Failed to fetch Moujas paged", { pageNumber, pageSize, searchTerm, sortBy, sortOrder }, error);
    throw error;
  }
}

export async function createMoujaAction(
  data: MoujaFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    data.createdBy = userId;
    const msg = await createMouja(data);
    revalidateMoujaSubZoneRoutes();
    return { success: true, message: msg };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to create Mouja" };
  }
}

export async function updateMoujaAction(
  data: MoujaFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    data.updatedBy = userId;
    const msg = await updateMouja(data);
    revalidateMoujaSubZoneRoutes();
    return { success: true, message: msg };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to update Mouja" };
  }
}

export async function deleteMoujaAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) return { success: false, message: "you are unauthorized", statusCode: 401 };

  const rawId = formData.get("id");
  const numericId = Number(rawId);

  if (rawId == null || !Number.isInteger(numericId) || numericId <= 0) {
    return { success: false, message: "Valid Mouja ID is required", statusCode: 400 };
  }

  try {
    await deleteMouja(numericId);
    revalidateMoujaSubZoneRoutes();
    return { success: true, message: "Mouja deleted successfully" };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: "Failed to delete Mouja" };
  }
}

export async function fetchMoujaByIdAction(id: number): Promise<Mouja> {
  try {
    const numericId = Number(id);
    if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
      throw new ApiError(400, "Valid Mouja ID is required", "Validation failed");
    }
    const result = await getMoujaById(numericId);
    if (!result) {
      throw new ApiError(404, "Mouja not found", "Not Found");
    }
    return result;
  } catch (error) {
    logger.error("Failed to fetch Mouja by ID", { id }, error);
    throw error;
  }
}

export async function getMoujaDropdownAction(includeMoujaId?: number): Promise<Mouja[]> {
  try {
    const list = await getMoujasAllActive();
    if (includeMoujaId && includeMoujaId > 0 && !list.some((m) => m.id === includeMoujaId)) {
      const extraMouja = await getMoujaById(includeMoujaId);
      if (extraMouja) {
        return [extraMouja, ...list];
      }
    }
    return list;
  } catch (error) {
    logger.error("Failed to fetch Mouja dropdown options", { includeMoujaId }, error);
    throw error;
  }
}

// ==========================================
// SUBZONE MASTER ACTIONS
// ==========================================

export async function fetchSubZonesPagedServerAction(
  pageNumber: number,
  pageSize: number,
  moujaId?: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<SubZoneDetails>> {
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

    const allowedSortColumns = ["subZoneNo", "subZoneName"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : undefined;

    return await getSubZonesPaged(pageNumber, pageSize, moujaId, searchTerm, validSortBy, validSortOrder);
  } catch (error: unknown) {
    logger.error("Failed to fetch SubZones paged", { pageNumber, pageSize, moujaId, searchTerm, sortBy, sortOrder }, error);
    throw error;
  }
}

export async function createSubZoneAction(
  data: SubZoneFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    data.createdBy = userId;
    const msg = await createSubZone(data);
    revalidateMoujaSubZoneRoutes();
    return { success: true, message: msg };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to create SubZone" };
  }
}

export async function updateSubZoneAction(
  data: SubZoneFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    data.updatedBy = userId;
    const msg = await updateSubZone(data);
    revalidateMoujaSubZoneRoutes();
    return { success: true, message: msg };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to update SubZone" };
  }
}

export async function deleteSubZoneAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) return { success: false, message: "you are unauthorized", statusCode: 401 };

  const rawId = formData.get("id");
  const numericId = Number(rawId);

  if (rawId == null || !Number.isInteger(numericId) || numericId <= 0) {
    return { success: false, message: "Valid SubZone ID is required", statusCode: 400 };
  }

  try {
    await deleteSubZone(numericId);
    revalidateMoujaSubZoneRoutes();
    return { success: true, message: "SubZone deleted successfully" };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: "Failed to delete SubZone" };
  }
}

export async function fetchSubZoneByIdAction(id: number): Promise<SubZoneDetails> {
  try {
    const numericId = Number(id);
    if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
      throw new ApiError(400, "Valid SubZone ID is required", "Validation failed");
    }
    const result = await getSubZoneById(numericId);
    if (!result) {
      throw new ApiError(404, "SubZone not found", "Not Found");
    }
    return result;
  } catch (error) {
    logger.error("Failed to fetch SubZone by ID", { id }, error);
    throw error;
  }
}
