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
import { capitalValueConfig } from "@/components/modules/property-tax/assessment-year-range/config";
import { ApiError } from "@/lib/utils/api";
import { AssessmentYearRangeCV, AssessmentYearRangeFormModel } from "@/types/assessment-year-range.types";
import { PagedResponse } from "@/types/common.types";

const config = capitalValueConfig;

/**
 * Fetches paginated Assessment Year Range CV data
 */
export async function fetchAssessmentYearRangeCVPagedAction(
  pageNumber: number,
  pageSize: number,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssessmentYearRangeCV>> {
  try {
    const result = await getAssessmentYearRangePaged<AssessmentYearRangeCV>(
      config,
      pageNumber,
      pageSize,
      sortBy,
      sortOrder
    );
    return result;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      console.error(`[fetchAssessmentYearRangeCVPagedAction] API Error ${error.statusCode}:`, error.responseText);
    } else if (error instanceof Error) {
      console.error("[fetchAssessmentYearRangeCVPagedAction] Error:", error.message);
    }
    throw error;
  }
}

/**
 * Fetches a single Assessment Year Range CV by ID
 */
export async function getAssessmentYearRangeCVByIdAction(
  id: number
): Promise<AssessmentYearRangeCV> {
  try {
    const result = await getAssessmentYearRangeById<AssessmentYearRangeCV>(config, id);
    if (!result) {
      throw new ApiError(404, "Assessment Year Range not found", "Not found");
    }
    return result;
  } catch (error) {
    console.error(`[getAssessmentYearRangeCVByIdAction] Error fetching ID ${id}:`, error);
    throw error;
  }
}

/**
 * Creates a new Assessment Year Range CV
 */
export async function createAssessmentYearRangeCVAction(
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
 * Updates an existing Assessment Year Range CV
 */
export async function updateAssessmentYearRangeCVAction(
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
 * Deletes an Assessment Year Range CV
 */
export async function deleteAssessmentYearRangeCVAction(
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
