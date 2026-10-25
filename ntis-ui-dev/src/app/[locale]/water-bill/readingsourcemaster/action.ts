"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  getReadingSourcesPaged,
  getReadingSourceById,
  createReadingSource,
  updateReadingSource,
  deleteReadingSource,
} from "@/lib/api/water-bill/reading-source-master.service";
import { ApiError } from "@/lib/utils/api";
import { ReadingSource, ReadingSourceFormModel } from "@/types/water-bill/reading-source-master.types";
import { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

const ALLOWED_SORT_COLUMNS = ["readingSourceCode", "readingSource", "isActive"];
const ALLOWED_SORT_ORDERS = ["asc", "desc"];

export async function fetchReadingSourcesPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<ReadingSource>> {
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

    return await getReadingSourcesPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      console.error(`[fetchReadingSourcesPagedServerAction] API Error ${error.statusCode}:`, error.responseText);
    } else {
      console.error("[fetchReadingSourcesPagedServerAction] Error:", error);
    }
    throw error;
  }
}

export async function createReadingSourceAction(
  data: ReadingSourceFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) data.createdBy = userId;

    await createReadingSource(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/readingsourcemaster`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: error instanceof Error ? error.message : "Failed to create reading source" };
  }
}

export async function updateReadingSourceAction(
  data: ReadingSourceFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (userId) data.updatedBy = userId;

    await updateReadingSource(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/readingsourcemaster`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: error instanceof Error ? error.message : "Failed to update reading source" };
  }
}

export async function deleteReadingSourceAction(
  id: number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    await deleteReadingSource(id);
    for (const locale of locales) {
      revalidatePath(`/${locale}/water-bill/readingsourcemaster`, "page");
    }
    return { success: true, message: "Reading source deleted successfully" };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: "Failed to delete reading source" };
  }
}

export async function getReadingSourceByIdAction(id: number): Promise<ReadingSource> {
  if (!id || id <= 0) {
    throw new ApiError(400, "Valid Reading Source ID is required", "Validation failed");
  }
  const result = await getReadingSourceById(id);
  if (!result) {
    throw new ApiError(404, "Reading Source not found", "Not Found");
  }
  return result;
}
