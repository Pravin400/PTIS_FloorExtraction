"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { inventoryModelService } from "@/lib/api/asset-masters/inventory-model.service";
import { cleanErrorMessage } from "@/lib/utils/api-error-handler";
import { deduplicateErrorMessage } from "@/lib/utils/asset-utils/actions.utils";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("InventoryModel");

export async function saveInventoryModelAction(id: string, formData: FormData) {
  try {
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) {
      return { ok: false, error: "Unauthorized" };
    }
    const isEdit = !!id;

    const rawGroupId = Number(formData.get("group"));
    if (!Number.isFinite(rawGroupId) || rawGroupId <= 0) {
      return { ok: false, error: "invalid_inventoryItemNameId" };
    }
    const inventoryItemNameId = rawGroupId;

    const rawDisplayOrder = formData.get("displayOrder");
    const displayOrder = Number(rawDisplayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder <= 0 || displayOrder > 99999) {
      return { ok: false, error: "Invalid display order", field: "displayOrder" };
    }

    const record = {
      modelName: formData.get("name") as string,
      inventoryItemNameId,
      description: formData.get("description") as string,
      displayOrder,
      isActive: formData.get("isActive") === "true",
    };

    if (isEdit) {
      await inventoryModelService.update(id, { ...record, updatedBy: userId });
    } else {
      await inventoryModelService.create({ ...record, createdBy: userId });
    }


    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/inventory-model`, "page");
    }
    
    return { ok: true, mode: isEdit ? "update" : "create" };
  } catch (error: unknown) {
    const rawMessage = error instanceof ApiError ? (error.error || error.responseText) : error instanceof Error ? error.message : String(error);
    const errMessage = deduplicateErrorMessage(cleanErrorMessage(rawMessage, "Failed to save inventory model"));
    if (errMessage.toLowerCase().includes("duplicate")) {
      return { ok: false, error: "duplicate" };
    }
    return { ok: false, error: errMessage };
  }
}

export async function deleteInventoryModelAction(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const userId = getUserIdFromCookies(await cookies());

    if (userId == null) {
      return { ok: false, error: "Unauthorized" };
    }

    await inventoryModelService.delete(id);

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/inventory-model`, "page");
    }

    return { ok: true };
  } catch (error: unknown) {
    const rawMessage = error instanceof ApiError ? (error.error || error.responseText) : error instanceof Error ? error.message : String(error);
    const errMessage = deduplicateErrorMessage(cleanErrorMessage(rawMessage, "Failed to delete inventory model"));
    return { ok: false, error: errMessage };
  }
}

export async function getInventoryModelByIdAction(id: string | number) {
  try {
    const rawRecord = await inventoryModelService.getById(String(id));
    if (!rawRecord) return null;
    return {
      id: String(rawRecord.id),
      name: rawRecord.modelName || "",
      group: String(rawRecord.inventoryItemNameId || ""),
      description: rawRecord.description || "",
      displayOrder: rawRecord.displayOrder ?? 1,
      isActive: rawRecord.isActive ?? true,
    };
  } catch (error) {
    logger.error("Failed to fetch inventory model by ID", { id: String(id) }, error);
    return null;
  }
}
