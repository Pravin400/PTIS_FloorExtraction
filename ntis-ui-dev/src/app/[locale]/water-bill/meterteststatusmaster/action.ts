"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  getMeterTestStatusesPaged,
  getMeterTestStatusById,
  createMeterTestStatus,
  updateMeterTestStatus,
  deleteMeterTestStatus,
} from "@/lib/api/water-bill/meter-test-status-master.service";
import { ApiError } from "@/lib/utils/api";
import { MeterTestStatus, MeterTestStatusFormModel } from "@/types/water-bill/meter-test-status-master.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

const ALLOWED_SORT_COLUMNS = ["meterTestStatusCode", "meterTestStatus", "isActive"];
const ALLOWED_SORT_ORDERS = ["asc", "desc"];

export async function fetchMeterTestStatusesPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<MeterTestStatus>> {
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

    return await getMeterTestStatusesPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      console.error(`[fetchMeterTestStatusesPagedServerAction] API Error ${error.statusCode}:`, error.responseText);
    } else {
      console.error("[fetchMeterTestStatusesPagedServerAction] Error:", error);
    }
    throw error;
  }
}

export async function createMeterTestStatusAction(
  data: MeterTestStatusFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) data.createdBy = userId;

    await createMeterTestStatus(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/meterteststatusmaster`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: error instanceof Error ? error.message : "Failed to create meter test status" };
  }
}

export async function updateMeterTestStatusAction(
  data: MeterTestStatusFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) data.updatedBy = userId;

    await updateMeterTestStatus(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/meterteststatusmaster`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: error instanceof Error ? error.message : "Failed to update meter test status" };
  }
}

export async function deleteMeterTestStatusAction(
  id: number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    await deleteMeterTestStatus(id);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/meterteststatusmaster`, "page");
    }
    return { success: true, message: "Meter test status deleted successfully" };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: "Failed to delete meter test status" };
  }
}

export async function getMeterTestStatusByIdAction(id: number): Promise<MeterTestStatus> {
  if (!id || id <= 0) {
    throw new ApiError(400, "Valid Meter Test Status ID is required", "Validation failed");
  }
  const result = await getMeterTestStatusById(id);
  if (!result) {
    throw new ApiError(404, "Meter Test Status not found", "Not Found");
  }
  return result;
}
