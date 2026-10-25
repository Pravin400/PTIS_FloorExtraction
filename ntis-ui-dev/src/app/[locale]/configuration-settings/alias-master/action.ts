"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import {
  getAliasMastersPaged,
  getAliasMasterById,
  createAliasMaster,
  updateAliasMaster,
  toggleAliasMasterStatus,
  getAliasMasterCounts,
  ALIAS_MASTER_ACTIVE_TAG,
} from "@/lib/api/configuration-settings/alias-master/alias-master.service";
import type { AliasMaster, AliasMasterCounts, AliasMasterFormModel } from "@/types/alias-master.types";
import type { PagedResponse } from "@/types/common.types";

const PAGE_PATH = "/configuration-settings/alias-master";

export async function fetchAliasMasterPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AliasMaster>> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) {
    throw new ApiError(401, "you are unauthorized", "Unauthorized");
  }
  return getAliasMastersPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
}

export async function fetchAliasMasterCountsServerAction(): Promise<AliasMasterCounts> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) {
    throw new ApiError(401, "you are unauthorized", "Unauthorized");
  }
  return getAliasMasterCounts();
}

export async function getAliasMasterByIdAction(id: number | string): Promise<AliasMaster> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) {
    throw new ApiError(401, "you are unauthorized", "Unauthorized");
  }
  const numericId = Number(id);
  if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, "Valid Alias Master ID is required", "Validation failed");
  }

  const result = await getAliasMasterById(numericId);
  if (!result) throw new ApiError(404, "Alias Master not found", "Not Found");
  return result;
}

export async function saveAliasMaster(id: string, formData: FormData) {
  let locale: string;
  let keyName: string;
  let labelName: string;

  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) return { ok: false, error: "you are unauthorized" };

    locale = String(formData.get("locale") ?? "").trim();
    if (!locale || !locales.includes(locale as (typeof locales)[number])) return { ok: false, error: "invalid_locale" };

    keyName = String(formData.get("keyName") ?? "").trim();
    labelName = String(formData.get("labelName") ?? "").trim();
    const englishName = String(formData.get("englishName") ?? "").trim();
    const regionalName = String(formData.get("regionalName") ?? "").trim();
    const hindiName = String(formData.get("hindiName") ?? "").trim();

    if (labelName === "") return { ok: false, error: "invalid_labelName" };

    const isActive = String(formData.get("isActive") ?? "true").toLowerCase() === "true";

    let numericId: number | null = null;
    let isUpdate = false;

    if (id && id.trim() !== "") {
      numericId = Number(id);
      if (!Number.isFinite(numericId) || numericId <= 0) {
        return { ok: false, error: "invalid_id" };
      }
      isUpdate = true;
    } else if (keyName === "") {
      return { ok: false, error: "invalid_keyName" };
    }

    const payload: AliasMasterFormModel = {
      id: numericId,
      keyName,
      labelName,
      englishName,
      regionalName,
      hindiName,
      isActive,
    };

    if (isUpdate) {
      await updateAliasMaster(payload);
      for (const loc of locales) revalidatePath(`/${loc}${PAGE_PATH}`, "page");
      revalidateTag(ALIAS_MASTER_ACTIVE_TAG, "default");
      return { ok: true, mode: "update" as const };
    }

    await createAliasMaster(payload);
    for (const loc of locales) revalidatePath(`/${loc}${PAGE_PATH}`, "page");
    revalidateTag(ALIAS_MASTER_ACTIVE_TAG, "default");
    return { ok: true, mode: "create" as const };
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 409) return { ok: false, error: "duplicate" };
    if (error instanceof ApiError) return { ok: false, error: "api_error", message: error.message };
    return { ok: false, error: "unknown", message: error instanceof Error ? error.message : "An unexpected error occurred." };
  }
}

export async function toggleAliasMasterStatusAction(id: number, isActive: boolean) {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) return { success: false, message: "you are unauthorized", statusCode: 401 };

  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, message: "Valid Alias Master ID is required", statusCode: 400 };
  }

  try {
    await toggleAliasMasterStatus(id, isActive);
    for (const loc of locales) revalidatePath(`/${loc}${PAGE_PATH}`, "page");
    revalidateTag(ALIAS_MASTER_ACTIVE_TAG, "default");
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, message: error.responseText, statusCode: error.statusCode };
    return { success: false, message: error instanceof Error ? error.message : "Update Alias Master status failed" };
  }
}
