"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  getAssessmentYearRangePaged,
  getAssessmentYearRangeById,
  createAssessmentYearRange,
  updateAssessmentYearRange,
  deleteAssessmentYearRange,
} from "@/lib/api/asset-masters/asset-assessment-year-range.service";
import { capitalValueConfig } from "@/components/modules/assets/configuration/master-data/assessment-year-range/config";
import { ApiError } from "@/lib/utils/api";
import { AssessmentYearRangeCV, AssessmentYearRangeFormModel } from "@/types/asset-masters/assessment-year-range.types";
import { PagedResponse } from "@/types/common.types";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

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
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    data.createdBy = userId;
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
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    data.updatedBy = userId;
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
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) {
    return { success: false, message: "you are unauthorized", statusCode: 401 };
  }

  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? parseInt(rawId, 10) : 0;

  if (!id || id <= 0) {
    return { success: false, message: "Valid ID is required", statusCode: 400 };
  }

  try {
    await deleteAssessmentYearRange(config, id);
    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}${config.routePath}`, "page");
    }
    return { success: true, message: "Assessment year range deleted successfully" };
  } catch (error) {
    if (error instanceof ApiError) {
      const isFkError =
        error.statusCode === 409 ||
        error.statusCode === 500 ||
        (typeof error.responseText === "string" && (
          error.responseText.includes("An error occurred") ||
          error.responseText.includes("Something went wrong") ||
          error.responseText.includes("FOREIGN KEY") ||
          error.responseText.includes("REFERENCE constraint") ||
          error.responseText.includes("conflicted") ||
          error.responseText.includes("in use")
        ));

      if (isFkError) {
        return { success: false, message: "Cannot delete this year range as it is in use.", statusCode: 409 };
      }
      return { success: false, message: error.responseText, statusCode: error.statusCode };
    }
    return { success: false, message: "Failed to delete assessment year range" };
  }
}
