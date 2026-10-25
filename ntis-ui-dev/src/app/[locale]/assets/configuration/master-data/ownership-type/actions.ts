"use server";

import { ownershipTypeService } from "@/lib/api/asset-masters/ownership-type.service";
import { revalidatePath } from "next/cache";
import { OwnershipTypeFormModel } from "@/types/asset-masters/ownership-type.types";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { cookies } from "next/headers";
import { createLogger } from "@/lib/utils/server-logger";
import { handleActionError } from "@/lib/utils/asset-utils/actions.utils";

import { cleanErrorMessage } from "@/lib/utils/api-error-handler";
import { ApiError } from "@/lib/utils/api";

const logger = createLogger("OwnershipType");

export async function fetchOwnershipTypePagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm: string,
  sortBy: string,
  sortOrder: "asc" | "desc"
) {
  try {
    const response = await ownershipTypeService.getAll({
      PageNumber: pageNumber,
      PageSize: pageSize,
      SearchTerm: searchTerm,
      SortBy: sortBy,
      SortOrder: sortOrder
    });
    
    return {
      items: response.items,
      totalCount: response.totalCount,
      pageNumber: response.pageNumber,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
    };
  } catch (error) {
    logger.error("Error fetching ownership types:", { error });
    return { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
  }
}

export async function createOwnershipTypeAction(formData: OwnershipTypeFormModel) {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, error: "you are unauthorized", statusCode: 401 };
    }
    const result = await ownershipTypeService.create({
      ownershipTypeName: formData.ownershipTypeName ? String(formData.ownershipTypeName).trim() : "",
      description: formData.description ? String(formData.description).trim() : "",
      isActive: formData.isActive,
      createdBy: userId,
      updatedBy: userId,
    });
    const { locales } = await import("@/i18n/config");
    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/ownership-type`, "page");
    }
    return { success: true, createdId: result.id };
  } catch (error: unknown) {
    const rawMsg = error instanceof ApiError
      ? (error.responseText || error.message)
      : (error instanceof Error ? error.message : String(error));
    if (rawMsg.toLowerCase().includes("duplicate") || rawMsg.toLowerCase().includes("already exists")) {
      return { success: false, error: "duplicate" };
    }
    return { success: false, error: cleanErrorMessage(rawMsg, "Failed to save ownership type") };
  }
}

export async function updateOwnershipTypeAction(formData: OwnershipTypeFormModel) {
  try {
    if (!formData.id) throw new Error("ID is required for update");
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, error: "you are unauthorized", statusCode: 401 };
    }
    
    const result = await ownershipTypeService.update(formData.id, {
      ownershipTypeName: formData.ownershipTypeName ? String(formData.ownershipTypeName).trim() : "",
      description: formData.description ? String(formData.description).trim() : "",
      isActive: formData.isActive,
      updatedBy: userId,
    });
    const { locales } = await import("@/i18n/config");
    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/ownership-type`, "page");
    }
    return { success: true, updatedId: result.id };
  } catch (error: unknown) {
    const rawMsg = error instanceof ApiError
      ? (error.responseText || error.message)
      : (error instanceof Error ? error.message : String(error));
    if (rawMsg.toLowerCase().includes("duplicate") || rawMsg.toLowerCase().includes("already exists")) {
      return { success: false, error: "duplicate" };
    }
    return { success: false, error: cleanErrorMessage(rawMsg, "Failed to save ownership type") };
  }
}

export async function deleteOwnershipTypeAction(id: string) {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, error: "you are unauthorized", statusCode: 401 };
    }
    await ownershipTypeService.delete(id);
    const { locales } = await import("@/i18n/config");
    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/ownership-type`, "page");
    }
    return { success: true };
  } catch (error) {
    return handleActionError(error, "messages.deleteFailed");
  }
}

export async function getOwnershipTypeByIdAction(id: string) {
  try {
    return await ownershipTypeService.getById(id);
  } catch (error) {
    logger.error("Error fetching type by ID:", { id, error });
    return null;
  }
}
