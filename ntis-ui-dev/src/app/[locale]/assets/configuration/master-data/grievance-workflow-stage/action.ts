"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import {
  deleteGrievanceWorkflowStageMaster,
  getGrievanceWorkflowStageMasterById,
  getGrievanceWorkflowStageMastersPaged,
  createGrievanceWorkflowStageMaster,
  updateGrievanceWorkflowStageMaster,
} from "@/lib/api/asset-masters/grievance-workflow-stage-master.service";
import type {
  GrievanceWorkflowStageMaster,
  GrievanceWorkflowStageMasterFormModel,
} from "@/types/asset-masters/grievance-workflow-stage-master.types";
import type { PagedResponse } from "@/types/common.types";
import { createLogger } from "@/lib/utils/server-logger";
import { validateGrievanceWorkflowStageData } from "@/lib/validation/asset/asset-masters/grievance-workflow-stage-validation";

const logger = createLogger("GrievanceWorkflowStageMasterActions");
const PAGE_PATH = "/assets/configuration/master-data/grievance-workflow-stage";

export async function fetchGrievanceWorkflowStageMasterPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<GrievanceWorkflowStageMaster>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      throw new ApiError(401, "you are unauthorized", "Unauthorized");
    }
    return await getGrievanceWorkflowStageMastersPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
  } catch (error) {
    logger.error("Failed to fetch grievance workflow stages paged", { pageNumber, pageSize, searchTerm, sortBy, sortOrder }, error);
    throw error;
  }
}

export async function getGrievanceWorkflowStageMasterByIdAction(
  id: number | string
): Promise<GrievanceWorkflowStageMaster> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) {
    throw new ApiError(401, "you are unauthorized", "Unauthorized");
  }
  const numericId = Number(id);
  if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, "Valid Grievance Workflow Stage Master ID is required", "Validation failed");
  }

  const result = await getGrievanceWorkflowStageMasterById(numericId);
  if (!result) throw new ApiError(404, "Grievance Workflow Stage Master not found", "Not Found");
  return result;
}

export async function saveGrievanceWorkflowStageMaster(id: string, formData: FormData) {
  let locale: string;
  let stageCode: string;
  let stageName: string;
  let stageNameLocal: string;
  let stageOrderRaw: string;
  let status: string;
  let description: string;

  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) return { ok: false, error: "you are unauthorized" };

    locale = String(formData.get("locale") ?? "").trim();
    if (!locale || !locales.includes(locale as (typeof locales)[number]))
      return { ok: false, error: "invalid_locale" };

    stageCode = String(formData.get("stageCode") ?? "").trim();
    stageName = String(formData.get("stageName") ?? "").trim();
    stageNameLocal = String(formData.get("stageNameLocal") ?? "").trim();
    stageOrderRaw = String(formData.get("stageOrder") ?? "").trim();
    status = String(formData.get("status") ?? "").trim();
    description = String(formData.get("description") ?? "").trim();

    const validation = validateGrievanceWorkflowStageData({
      stageCode,
      stageName,
      stageNameLocal,
      stageOrder: stageOrderRaw,
      status,
      description,
    });

    if (!validation.isValid) {
      const firstErrorField = Object.keys(validation.errors)[0];
      return {
        ok: false,
        error: `invalid_${firstErrorField}`,
        fieldErrors: validation.errors,
      };
    }

    const stageOrderNum = Number(stageOrderRaw);
    const isActive = String(formData.get("isActive") ?? "true").toLowerCase() === "true";

    let numericId: number | null = null;
    let isUpdate = false;

    if (id && id.trim() !== "") {
      numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return { ok: false, error: "invalid_id" };
      }
      isUpdate = true;
    }

    const payload: GrievanceWorkflowStageMasterFormModel = {
      id: numericId,
      ulbTypeId: 1,
      stageCode,
      stageName,
      stageNameLocal: stageNameLocal || undefined,
      stageOrder: stageOrderNum,
      status,
      description: description || undefined,
      isActive,
      createdBy: isUpdate ? undefined : userId,
      updatedBy: isUpdate ? userId : undefined,
    };

    if (isUpdate) {
      await updateGrievanceWorkflowStageMaster(payload);
      for (const loc of locales) revalidatePath(`/${loc}${PAGE_PATH}`, "page");
      return { success: true, ok: true, mode: "update" as const };
    }

    await createGrievanceWorkflowStageMaster(payload);
    for (const loc of locales) revalidatePath(`/${loc}${PAGE_PATH}`, "page");
    return { success: true, ok: true, mode: "create" as const };
  } catch (error) {
    if (error instanceof ApiError) {
      const rawMsg = error.responseText || error.error || error.message || "";
      const lower = rawMsg.toLowerCase();
      const isDup =
        error.statusCode === 409 ||
        lower.includes("duplicate") ||
        lower.includes("already exist") ||
        lower.includes("grievanceworkflowstage_stagecode_duplicate") ||
        lower.includes("grievanceworkflowstage_stagename_duplicate") ||
        lower.includes("grievanceworkflowstage_stageorder_duplicate");

      logger.warn("ApiError while saving grievance workflow stage", { statusCode: error.statusCode, isDup }, error);

      return {
        success: false,
        ok: false,
        error: isDup ? "duplicate" : "api_error",
        message: rawMsg,
        statusCode: error.statusCode || (isDup ? 409 : 400),
      };
    }

    logger.error("Unexpected error while saving grievance workflow stage", {}, error);

    return {
      success: false,
      ok: false,
      error: "unknown",
      message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    };
  }
}

export async function deleteGrievanceWorkflowStageMasterAction(formData: FormData) {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) return { success: false, ok: false, message: "UNAUTHORIZED", statusCode: 401 };

  const rawId = formData.get("id");
  const numericId = Number(rawId);
  if (rawId == null || !Number.isInteger(numericId) || numericId <= 0) {
    return { success: false, ok: false, message: "INVALID_ID", statusCode: 400 };
  }
  try {
    await deleteGrievanceWorkflowStageMaster(numericId);
    for (const locale of locales) revalidatePath(`/${locale}${PAGE_PATH}`, "page");
    return { success: true, ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn("ApiError while deleting grievance workflow stage", { id: numericId, statusCode: error.statusCode }, error);
      const rawMsg = error.responseText || error.message || "";
      return {
        success: false,
        ok: false,
        message: rawMsg,
        statusCode: error.statusCode,
      };
    }

    logger.error("Unexpected error while deleting grievance workflow stage", { id: numericId }, error);
    return {
      success: false,
      ok: false,
      message: "DELETE_FAILED",
    };
  }
}
