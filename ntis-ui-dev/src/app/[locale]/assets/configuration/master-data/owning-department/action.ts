"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import {
  deleteOwningDepartment,
  getOwningDepartmentById,
  getOwningDepartmentsPaged,
  createOwningDepartment,
  updateOwningDepartment,
} from "@/lib/api/asset-masters/owning-department.service";
import type { OwningDepartment, OwningDepartmentFormModel } from "@/types/asset-masters/owning-department.types";
import type { PagedResponse } from "@/types/common.types";

const PAGE_PATH = "/assets/configuration/master-data/owning-department";

export async function fetchOwningDepartmentPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<OwningDepartment>> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) {
    throw new ApiError(401, "you are unauthorized", "Unauthorized");
  }
  return getOwningDepartmentsPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
}

export async function getOwningDepartmentByIdAction(id: number | string): Promise<OwningDepartment> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) {
    throw new ApiError(401, "you are unauthorized", "Unauthorized");
  }
  const numericId = Number(id);
  if (id == null || !Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, "Valid Owning Department ID is required", "Validation failed");
  }

  const result = await getOwningDepartmentById(numericId);
  if (!result) throw new ApiError(404, "Owning Department not found", "Not Found");
  return result;
}

export async function saveOwningDepartment(id: string, formData: FormData) {
  let locale: string;
  let owningDepartmentName: string;
  let description: string;

  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) return { ok: false, error: "you are unauthorized" };

    locale = String(formData.get("locale") ?? "").trim();
    if (!locale || !locales.includes(locale as (typeof locales)[number])) return { ok: false, error: "invalid_locale" };

    owningDepartmentName = String(formData.get("owningDepartmentName") ?? "").trim();
    description = String(formData.get("description") ?? "").trim();

    if (!owningDepartmentName) return { ok: false, error: "invalid_owningDepartmentName" };
    if (!description) return { ok: false, error: "invalid_description" };

    const isActive = String(formData.get("isActive") ?? "true").toLowerCase() === "true";

    let numericId: number | null = null;
    let isUpdate = false;

    if (id && id.trim() !== "") {
      numericId = Number(id);
      if (!Number.isFinite(numericId) || numericId <= 0) {
        return { ok: false, error: "invalid_id" };
      }
      isUpdate = true;
    }

    const payload: OwningDepartmentFormModel = {
      id: numericId,
      owningDepartmentName,
      description,
      isActive,
      createdBy: isUpdate ? undefined : userId,
      updatedBy: isUpdate ? userId : undefined,
    };

    if (isUpdate) {
      await updateOwningDepartment(payload);
      for (const loc of locales) revalidatePath(`/${loc}${PAGE_PATH}`, "page");
      return { ok: true, mode: "update" as const };
    }

    await createOwningDepartment(payload);
    for (const loc of locales) revalidatePath(`/${loc}${PAGE_PATH}`, "page");
    return { ok: true, mode: "create" as const };
  } catch (error) {
    if (error instanceof ApiError) {
      const msg = error.responseText || error.error || error.message;
      const lower = msg.toLowerCase();
      const isDup = error.statusCode === 409 || lower.includes("duplicate") || lower.includes("already exist") || lower.includes("owningdepartment_duplicate");
      return {
        ok: false,
        error: isDup ? "duplicate" : "api_error",
        message: msg,
        statusCode: error.statusCode || (isDup ? 409 : 400),
      };
    }
    return { ok: false, error: "unknown", message: error instanceof Error ? error.message : "An unexpected error occurred." };
  }
}

export async function createOwningDepartmentAction(data: OwningDepartmentFormModel) {
  const payload = new FormData();
  payload.set("locale", "en");
  payload.set("owningDepartmentName", data.owningDepartmentName);
  payload.set("description", data.description);
  payload.set("isActive", String(data.isActive));
  return saveOwningDepartment("", payload);
}

export async function updateOwningDepartmentAction(data: OwningDepartmentFormModel) {
  const payload = new FormData();
  payload.set("locale", "en");
  payload.set("owningDepartmentName", data.owningDepartmentName);
  payload.set("description", data.description);
  payload.set("isActive", String(data.isActive));
  return saveOwningDepartment(String(data.id ?? ""), payload);
}

export async function deleteOwningDepartmentAction(formData: FormData) {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) return { success: false, message: "you are unauthorized", statusCode: 401 };

  const rawId = formData.get("id");
  const numericId = Number(rawId);
  if (rawId == null || !Number.isInteger(numericId) || numericId <= 0) {
    return { success: false, message: "Valid Owning Department ID is required", statusCode: 400 };
  }
  try {
    await deleteOwningDepartment(numericId);
    for (const locale of locales) revalidatePath(`/${locale}${PAGE_PATH}`, "page");
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) return { success: false, message: error.responseText, statusCode: error.statusCode };
    return { success: false, message: error instanceof Error ? error.message : "Delete Owning Department failed" };
  }
}
