"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  getMeterTypesPaged,
  getMeterTypeById,
  createMeterType,
  updateMeterType,
  deleteMeterType,
} from "@/lib/api/water-bill/meter-type-master.service";
import { ApiError } from "@/lib/utils/api";
import { MeterType, MeterTypeFormModel } from "@/types/water-bill/meter-type-master.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

const ALLOWED_SORT_COLUMNS = ["meterTypeCode", "meterType", "isActive"];
const ALLOWED_SORT_ORDERS = ["asc", "desc"];

export async function fetchMeterTypesPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<MeterType>> {
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

    const validSortBy = sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy) ? sortBy : undefined;
    const validSortOrder =
      sortOrder && ALLOWED_SORT_ORDERS.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : undefined;

    return await getMeterTypesPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      console.error(`[fetchMeterTypesPagedServerAction] API Error ${error.statusCode}:`, error.responseText);
    } else {
      console.error("[fetchMeterTypesPagedServerAction] Error:", error);
    }
    throw error;
  }
}

export async function createMeterTypeAction(
  data: MeterTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) data.createdBy = userId;

    await createMeterType(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/metertypemaster`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: error instanceof Error ? error.message : "Failed to create meter type" };
  }
}

export async function updateMeterTypeAction(
  data: MeterTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) data.updatedBy = userId;

    await updateMeterType(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/metertypemaster`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: error instanceof Error ? error.message : "Failed to update meter type" };
  }
}

export async function deleteMeterTypeAction(
  id: number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    await deleteMeterType(id);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/metertypemaster`, "page");
    }
    return { success: true, message: "Meter type deleted successfully" };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: "Failed to delete meter type" };
  }
}

export async function getMeterTypeByIdAction(id: number): Promise<MeterType> {
  if (!id || id <= 0) {
    throw new ApiError(400, "Valid Meter Type ID is required", "Validation failed");
  }
  const result = await getMeterTypeById(id);
  if (!result) {
    throw new ApiError(404, "Meter Type not found", "Not Found");
  }
  return result;
}
