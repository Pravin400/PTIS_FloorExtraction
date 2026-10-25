"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { locales } from "@/i18n/config";
import { getUserIdFromCookies } from "@/lib/utils/auth-session";
import { ApiError } from "@/lib/utils/api";

import {
  getTapStatusPaged,
  getTapStatusById,
  createTapStatus,
  updateTapStatus,
  deleteTapStatus,
} from "@/lib/api/water-connection-master/water-connection-status.service";

import {
  getTapTypePaged,
  getTapTypeById,
  createTapType,
  updateTapType,
  deleteTapType,
  getTapSizePaged,
  getTapSizeById,
  createTapSize,
  updateTapSize,
  deleteTapSize,
} from "@/lib/api/water-connection-master/water-connection-type-size.service";

import {
  getWaterRatesPaged,
  getWaterRateById,
  createWaterRate,
  updateWaterRate,
  deleteWaterRate,
} from "@/lib/api/water-connection-master/water-rate-master.service";

import { getFinancialYearsPaged } from "@/lib/api/financial-year.service";

import type {
  TapStatus,
  TapStatusFormModel,
  TapType,
  TapTypeFormModel,
  TapSize,
  TapSizeFormModel,
  WaterRate,
  WaterRateFormModel,
  PagedResponse,
} from "@/types/water-connection.types";
import type { ApiResponse } from "@/types/common.types";

const REVALIDATE_PATHS = {
  tapStatus: "tap-status",
  tapType: "tap-type",
  tapSize: "tap-size",
  waterRate: "water-rate",
} as const;

function revalidateAll(tab: keyof typeof REVALIDATE_PATHS) {
  for (const locale of locales) {
    revalidatePath(
      `/${locale}/property-tax/water-connection-master/${REVALIDATE_PATHS[tab]}`,
      "page"
    );
  }
}

async function getAuthUserId(): Promise<number> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) throw new ApiError(401, "Unauthorized", "User session expired");
  return userId;
}

function parseWaterConnectionError(error: unknown): ApiResponse<never> {
  if (error instanceof ApiError) {
    // Show a user-friendly message if backend is unreachable or fetch fails
    if (
      error.statusCode === 500 &&
      (error.error?.toLowerCase().includes('fetch failed') || error.error?.toLowerCase().includes('failed to fetch'))
    ) {
      return {
        success: false,
        statusCode: error.statusCode,
        error: "Server is unavailable. Please try again later.",
      };
    }
    return {
      success: false,
      statusCode: error.statusCode,
      error: error.message,
    };
  }
  return { success: false, error: "An unexpected error occurred. Please check your connection or try again later." };
}

/* ============================================================
   TAP STATUS ACTIONS
============================================================ */

export async function fetchTapStatusPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<TapStatus>> {
  return getTapStatusPaged(pageNumber, pageSize, searchTerm);
}

export async function getTapStatusByIdAction(
  id: number
): Promise<TapStatus> {
  return getTapStatusById(id);
}

export async function createTapStatusAction(
  data: TapStatusFormModel
): Promise<ApiResponse<TapStatus>> {
  try {
    const userId = await getAuthUserId();
    const result = await createTapStatus(data, userId);
    revalidateAll("tapStatus");
    return { success: true, data: result };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

export async function updateTapStatusAction(
  id: number,
  data: TapStatusFormModel
): Promise<ApiResponse<TapStatus>> {
  try {
    const userId = await getAuthUserId();
    const result = await updateTapStatus(id, data, userId);
    revalidateAll("tapStatus");
    return { success: true, data: result };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

export async function deleteTapStatusAction(
  id: number
): Promise<ApiResponse<void>> {
  try {
    const userId = await getAuthUserId();
    await deleteTapStatus(id, userId);
    revalidateAll("tapStatus");
    return { success: true };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

/* ============================================================
   TAP TYPE ACTIONS
============================================================ */

export async function fetchTapTypePagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<TapType>> {
  return getTapTypePaged(pageNumber, pageSize, searchTerm);
}

export async function getTapTypeByIdAction(id: number): Promise<TapType> {
  return getTapTypeById(id);
}

export async function createTapTypeAction(
  data: TapTypeFormModel
): Promise<ApiResponse<TapType>> {
  try {
    const userId = await getAuthUserId();
    const result = await createTapType(data, userId);
    revalidateAll("tapType");
    return { success: true, data: result };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

export async function updateTapTypeAction(
  id: number,
  data: TapTypeFormModel
): Promise<ApiResponse<TapType>> {
  try {
    const userId = await getAuthUserId();
    const result = await updateTapType(id, data, userId);
    revalidateAll("tapType");
    return { success: true, data: result };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

export async function deleteTapTypeAction(
  id: number
): Promise<ApiResponse<void>> {
  try {
    const userId = await getAuthUserId();
    await deleteTapType(id, userId);
    revalidateAll("tapType");
    return { success: true };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

/* ============================================================
   TAP SIZE ACTIONS
============================================================ */

export async function fetchTapSizePagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<TapSize>> {
  return getTapSizePaged(pageNumber, pageSize, searchTerm);
}

export async function getTapSizeByIdAction(id: number): Promise<TapSize> {
  return getTapSizeById(id);
}

export async function createTapSizeAction(
  data: TapSizeFormModel
): Promise<ApiResponse<TapSize>> {
  try {
    const userId = await getAuthUserId();
    const result = await createTapSize(data, userId);
    revalidateAll("tapSize");
    return { success: true, data: result };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

export async function updateTapSizeAction(
  id: number,
  data: TapSizeFormModel
): Promise<ApiResponse<TapSize>> {
  try {
    const userId = await getAuthUserId();
    const result = await updateTapSize(id, data, userId);
    revalidateAll("tapSize");
    return { success: true, data: result };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

export async function deleteTapSizeAction(
  id: number
): Promise<ApiResponse<void>> {
  try {
    const userId = await getAuthUserId();
    await deleteTapSize(id, userId);
    revalidateAll("tapSize");
    return { success: true };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

/* ============================================================
   WATER RATE ACTIONS
============================================================ */

export async function fetchWaterRatesPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<WaterRate>> {
  return getWaterRatesPaged(pageNumber, pageSize, searchTerm);
}

export async function getWaterRateByIdAction(id: number): Promise<WaterRate> {
  return getWaterRateById(id);
}

export async function createWaterRateAction(
  data: WaterRateFormModel
): Promise<ApiResponse<WaterRate>> {
  try {
    const userId = await getAuthUserId();
    const result = await createWaterRate(data, userId);
    revalidateAll("waterRate");
    return { success: true, data: result };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

export async function updateWaterRateAction(
  id: number,
  data: WaterRateFormModel
): Promise<ApiResponse<WaterRate>> {
  try {
    const userId = await getAuthUserId();
    const result = await updateWaterRate(id, data, userId);
    revalidateAll("waterRate");
    return { success: true, data: result };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

export async function deleteWaterRateAction(
  id: number
): Promise<ApiResponse<void>> {
  try {
    const userId = await getAuthUserId();
    await deleteWaterRate(id, userId);
    revalidateAll("waterRate");
    return { success: true };
  } catch (error) {
    return parseWaterConnectionError(error);
  }
}

export async function fetchFinancialYearsPagedAction() {
  return getFinancialYearsPaged(1, 2000);
}
