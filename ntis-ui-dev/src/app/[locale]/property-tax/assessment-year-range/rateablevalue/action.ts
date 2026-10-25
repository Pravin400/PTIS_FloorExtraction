"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  getAssessmentYearRangePaged,
  getAssessmentYearRangeById,
  createAssessmentYearRange,
  updateAssessmentYearRange,
  purgeDeleteAssessmentYearRange,
} from "@/lib/api/assessment-year-range.service";
import { rateableValueConfig } from "@/components/modules/property-tax/assessment-year-range/config";
import { ApiError } from "@/lib/utils/api";
import { AssessmentYearRangeRV, AssessmentYearRangeFormModel } from "@/types/assessment-year-range.types";
import { PagedResponse } from "@/types/common.types";

const config = rateableValueConfig;

/**
 * Fetches paginated Assessment Year Range RV data
 */
export async function fetchAssessmentYearRangeRVPagedAction(
  pageNumber: number,
  pageSize: number,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssessmentYearRangeRV>> {
  try {
    const result = await getAssessmentYearRangePaged<AssessmentYearRangeRV>(
      config,
      pageNumber,
      pageSize,
      sortBy,
      sortOrder
    );
    return result;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      console.error(`[fetchAssessmentYearRangeRVPagedAction] API Error ${error.statusCode}:`, error.responseText);
    } else if (error instanceof Error) {
      console.error("[fetchAssessmentYearRangeRVPagedAction] Error:", error.message);
    }
    throw error;
  }
}

/**
 * Fetches a single Assessment Year Range RV by ID
 */
export async function getAssessmentYearRangeRVByIdAction(
  id: number
): Promise<AssessmentYearRangeRV> {
  try {
    const result = await getAssessmentYearRangeById<AssessmentYearRangeRV>(config, id);
    if (!result) {
      throw new ApiError(404, "Assessment Year Range not found", "Not found");
    }
    return result;
  } catch (error) {
    console.error(`[getAssessmentYearRangeRVByIdAction] Error fetching ID ${id}:`, error);
    throw error;
  }
}

/**
 * Creates a new Assessment Year Range RV
 */
export async function createAssessmentYearRangeRVAction(
  data: AssessmentYearRangeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    await createAssessmentYearRange(config, data);
    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}${config.routePath}`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to create assessment year range" };
  }
}

/**
 * Updates an existing Assessment Year Range RV
 */
export async function updateAssessmentYearRangeRVAction(
  data: AssessmentYearRangeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    await updateAssessmentYearRange(config, data);
    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}${config.routePath}`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to update assessment year range" };
  }
}

/**
 * Deletes an Assessment Year Range RV
 */
export async function deleteAssessmentYearRangeRVAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? parseInt(rawId, 10) : 0;

  if (!id || id <= 0) {
    return { success: false, message: "Valid ID is required", statusCode: 400 };
  }

  try {
    await purgeDeleteAssessmentYearRange(config, id);
    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}${config.routePath}`, "page");
    }
    return { success: true, message: "Assessment year range deleted successfully" };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: "Failed to delete assessment year range" };
  }
}
