"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  getCommonRemarksPaged,
  getCommonRemarkById,
  createCommonRemark,
  updateCommonRemark,
  deleteCommonRemark,
  getCommonRemarkCategories,
  createRemarkCategory,
} from "@/lib/api/common-remark-master/common-remark-crud.service";
import { ApiError } from "@/lib/utils/api";
import type { CommonRemark, CommonRemarkFormModel } from "@/types/common-remark-master/common-remark.types";
import type { PagedResponse } from "@/types/common.types";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import {
  validateRequiredStringFromFormData,
  getBooleanFromFormData,
} from "@/lib/utils/validation-helpers";

/**
 * Fetch paginated remarks
 */
export async function fetchCommonRemarksPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  filterType?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<CommonRemark>> {
  return getCommonRemarksPaged(pageNumber, pageSize, searchTerm, filterType, sortBy, sortOrder);
}

/**
 * Fetch remark categories
 */
export async function fetchRemarkCategoriesAction() {
  try {
    return await getCommonRemarkCategories();
  } catch {
    return [];
  }
}

/**
 * Fetch a single remark by ID
 */
export async function getCommonRemarkByIdAction(id: number): Promise<CommonRemark> {
  const result = await getCommonRemarkById(id);
  if (!result) {
    throw new ApiError(404, "Remark not found", "Not Found");
  }
  return result;
}

/**
 * Delete a remark by ID
 */
export async function deleteCommonRemarkAction(formData: FormData) {
  try {
    validateRequiredStringFromFormData(formData, "locale");
    const idRaw = validateRequiredStringFromFormData(formData, "id");
    const id = Number(idRaw);

    if (!Number.isFinite(id) || id <= 0) {
      return {
        success: false,
        message: "Invalid ID: must be a positive number",
      };
    }

    await deleteCommonRemark(id);

    for (const loc of locales) {
      revalidatePath(`/${loc}/configuration-settings/common-remark-master`, "page");
    }
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete common remark",
    };
  }
}

/**
 * Create or update a common remark
 */
export async function saveCommonRemarkAction(id: string, formData: FormData) {
  let remarkType: string;
  let remark: string;

  try {
    validateRequiredStringFromFormData(formData, "locale");
  } catch {
    return { ok: false, error: "invalid_locale", message: "Locale is required" };
  }

  try {
    remarkType = validateRequiredStringFromFormData(formData, "remarkType");
  } catch {
    return { ok: false, error: "invalid_remarkType", message: "Remark Type is required" };
  }

  try {
    remark = validateRequiredStringFromFormData(formData, "remark");
  } catch {
    return { ok: false, error: "invalid_remark", message: "Remark is required" };
  }

  const isActive = getBooleanFromFormData(formData, "isActive");

  let numericId: number | undefined = undefined;
  let isUpdate = false;

  if (id && id.trim() !== "") {
    numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return {
        ok: false,
        error: "invalid_id",
        message: "Invalid Common Remark ID",
      };
    }
    isUpdate = true;
  }

  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  const numericUserId = userId ? Number(userId) : 1;

  const customRemarkType = formData.get("customRemarkType")?.toString() || "";

  const payload: CommonRemarkFormModel = {
    id: numericId,
    remarkType,
    customRemarkType,
    remark,
    isActive,
  };

  if (isUpdate) {
    payload.updatedBy = numericUserId;
  } else {
    payload.createdBy = numericUserId;
  }

  try {
    if (isUpdate) {
      await updateCommonRemark(payload);
      for (const loc of locales) {
        revalidatePath(`/${loc}/configuration-settings/common-remark-master`, "page");
      }
      return { ok: true, mode: "update" as const };
    } else {
      await createCommonRemark(payload);
      for (const loc of locales) {
        revalidatePath(`/${loc}/configuration-settings/common-remark-master`, "page");
      }
      return { ok: true, mode: "create" as const };
    }
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 409) {
      return {
        ok: false,
        error: "duplicate",
        message: "This remark already exists for the selected Remark Type.",
      };
    }
    if (error instanceof ApiError) {
      return {
        ok: false,
        error: "api_error",
        message: error.message || "An error occurred while saving.",
      };
    }
    return {
      ok: false,
      error: "unknown",
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Create a new remark type category
 */
export async function createRemarkCategoryAction(formData: FormData) {
  try {
    validateRequiredStringFromFormData(formData, "locale");
    const customRemarkType = validateRequiredStringFromFormData(formData, "customRemarkType");

    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    const numericUserId = userId ? Number(userId) : 1;

    const category = await createRemarkCategory(customRemarkType, numericUserId);

    for (const loc of locales) {
      revalidatePath(`/${loc}/configuration-settings/common-remark-master`, "page");
    }
    return { ok: true, data: category };
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 409) {
      return {
        ok: false,
        error: "duplicate",
        message: "This remark type already exists.",
      };
    }
    if (error instanceof ApiError) {
      return {
        ok: false,
        error: "api_error",
        message: error.message || "An error occurred while saving remark type.",
      };
    }
    return {
      ok: false,
      error: "unknown",
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
}
