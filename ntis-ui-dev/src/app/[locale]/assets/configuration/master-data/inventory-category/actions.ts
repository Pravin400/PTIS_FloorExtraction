"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { inventoryCategoryService } from "@/lib/api/asset-masters/inventory-category.service";
import { cleanErrorMessage } from "@/lib/utils/api-error-handler";
import { deduplicateErrorMessage } from "@/lib/utils/asset-utils/actions.utils";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("InventoryCategory");

export async function saveInventoryCategoryAction(id: string, formData: FormData) {
  try {
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) {
      return { ok: false, error: "Unauthorized" };
    }
    const isEdit = !!id;

    const rawGroupId = Number(formData.get("group") || formData.get("assetCategoryId"));
    if (!Number.isFinite(rawGroupId) || rawGroupId <= 0) {
      return { ok: false, error: "invalid_assetCategoryId" };
    }
    const assetCategoryId = rawGroupId;

    const rawDisplayOrder = formData.get("displayOrder");
    if (rawDisplayOrder === null || rawDisplayOrder === undefined || String(rawDisplayOrder).trim() === "") {
      return { ok: false, error: "Display order is required", field: "displayOrder" };
    }
    const displayOrder = Number(rawDisplayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      return { ok: false, error: "Display order must be a valid integer", field: "displayOrder" };
    }

    const record = {
      typeCode: formData.get("code") as string,
      typeName: formData.get("name") as string,
      assetCategoryId,
      depreciationRate: Number(formData.get("depreciationRate") || 0),
      displayOrder,
      description: formData.get("description") as string,
      isActive: formData.get("isActive") === "true",
      updatedBy: userId,
    };

    if (isEdit) {
      await inventoryCategoryService.update(id, record);
    } else {
      await inventoryCategoryService.create({ ...record, createdBy: userId });
    }


    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/inventory-category`, "page");
    }

    return { ok: true, mode: isEdit ? "update" : "create" };
  } catch (error: unknown) {
    const rawMessage = error instanceof ApiError ? (error.error || error.responseText || error.message) : error instanceof Error ? error.message : String(error);
    const errMessage = deduplicateErrorMessage(cleanErrorMessage(rawMessage, "Failed to save inventory category"));
    const lower = (rawMessage + " " + errMessage).toLowerCase();

    const isCodeDupe = lower.includes("code") && (lower.includes("duplicate") || lower.includes("already exists"));
    const isNameDupe = lower.includes("name") && (lower.includes("duplicate") || lower.includes("already exists"));

    if (isCodeDupe && !isNameDupe) {
      return { ok: false, error: "duplicate_code" };
    }
    if (isNameDupe && !isCodeDupe) {
      return { ok: false, error: "duplicate_name" };
    }
    if (lower.includes("duplicate") || lower.includes("already exists")) {
      return { ok: false, error: "duplicate" };
    }
    return { ok: false, error: errMessage };
  }
}

export async function deleteInventoryCategoryAction(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const userId = getUserIdFromCookies(await cookies());

    if (userId == null) {
      return { ok: false, error: "Unauthorized" };
    }

    await inventoryCategoryService.delete(id);

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/inventory-category`, "page");
    }

    return { ok: true };
  } catch (error: unknown) {
    const rawMessage = error instanceof ApiError ? (error.error || error.responseText) : error instanceof Error ? error.message : String(error);
    const errMessage = deduplicateErrorMessage(cleanErrorMessage(rawMessage, "Failed to delete inventory category"));
    return { ok: false, error: errMessage };
  }
}

export async function getInventoryCategoryByIdAction(id: string | number) {
  try {
    const rawRecord = await inventoryCategoryService.getById(String(id));
    if (!rawRecord) return null;
    return {
      id: String(rawRecord.id),
      code: rawRecord.typeCode || "",
      name: rawRecord.typeName || "",
      group: String(rawRecord.assetCategoryId || (rawRecord as unknown as Record<string, unknown>).categoryId || ""),
      description: rawRecord.description || "",
      depreciationRate: rawRecord.depreciationRate !== undefined && rawRecord.depreciationRate !== null ? String(rawRecord.depreciationRate) : "",
      displayOrder: rawRecord.displayOrder !== undefined && rawRecord.displayOrder !== null ? String(rawRecord.displayOrder) : "",
      isActive: rawRecord.isActive ?? true,
    };
  } catch (error) {
    logger.error("Failed to fetch inventory category by ID", { id: String(id) }, error);
    return null;
  }
}

export async function getAssetCategoriesForInventoryAction() {
  try {
    const records = await inventoryCategoryService.getAssetCategoriesForDropdown();
    return {
      success: true,
      data: records.map((r) => ({
        id: String(r.id),
        name: String(r.categoryName || ""),
        status: (r.isActive === false) ? "Inactive" : "Active",
      })),
    };
  } catch (error) {
    logger.error("Failed to fetch asset categories for inventory category dropdown", {}, error);
    return { success: false, data: [] };
  }
}
