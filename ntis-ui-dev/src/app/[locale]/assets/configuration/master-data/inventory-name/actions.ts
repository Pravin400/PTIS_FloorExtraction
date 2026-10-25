"use server";

import { inventoryItemNameService } from "@/lib/api/asset-masters/inventory-item-name.service";
import { inventoryCategoryService } from "@/lib/api/asset-masters/inventory-category.service";
import { revalidatePath } from "next/cache";
import { InventoryNameFormModel, InventoryNameCategory } from "@/types/asset-masters/inventory-name.types";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { cookies } from "next/headers";
import { createLogger } from "@/lib/utils/server-logger";
import { handleActionError } from "@/lib/utils/asset-utils/actions.utils";

const logger = createLogger("InventoryName");

export async function fetchInventoryNamePagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm: string,
  sortBy: string,
  sortOrder: "asc" | "desc"
) {
  try {
    const response = await inventoryItemNameService.getAll({
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
    logger.error("Error fetching inventory names:", { error });
    return { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
  }
}

export async function getInventoryNameCategoriesAction(): Promise<InventoryNameCategory[]> {
  try {
    const res = await inventoryCategoryService.getAll({ PageNumber: 1, PageSize: 1000 });
    return res.items.map(item => ({
      id: item.id,
      categoryName: item.typeName || "",
    }));
  } catch (error) {
    logger.error("Error fetching inventory name categories:", { error });
    return [];
  }
}

export async function createInventoryNameAction(formData: InventoryNameFormModel) {
  try {
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    const rawCatId = Number(formData.inventoryItemCategoryId);
    if (!Number.isFinite(rawCatId) || rawCatId <= 0) {
      return { success: false, error: "invalid_inventoryItemCategoryId" };
    }
    const inventoryItemCategoryId = rawCatId;

    const rawDisplayOrder = formData.displayOrder;
    const displayOrder = Number(rawDisplayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder <= 0 || displayOrder > 99999) {
      return { success: false, error: "Invalid display order", field: "displayOrder" };
    }

    const result = await inventoryItemNameService.create({
      inventoryItemCategoryId,
      subTypeCode: formData.subTypeCode,
      subTypeName: formData.subTypeName,
      description: formData.description,
      displayOrder,
      isActive: formData.isActive,
      createdBy: userId,
      updatedBy: userId,
    });
    const { locales } = await import("@/i18n/config");
    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/inventory-name`, "page");
    }
    return { success: true, createdId: result.id };
  } catch (error) {
    return handleActionError(error, "messages.createFailed");
  }
}

export async function updateInventoryNameAction(formData: InventoryNameFormModel) {
  try {
    if (!formData.id) throw new Error("ID is required for update");
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    const rawCatId = Number(formData.inventoryItemCategoryId);
    if (!Number.isFinite(rawCatId) || rawCatId <= 0) {
      return { success: false, error: "invalid_inventoryItemCategoryId" };
    }
    const inventoryItemCategoryId = rawCatId;
    
    const rawDisplayOrder = formData.displayOrder;
    const displayOrder = Number(rawDisplayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder <= 0 || displayOrder > 99999) {
      return { success: false, error: "Invalid display order", field: "displayOrder" };
    }

    const result = await inventoryItemNameService.update(formData.id, {
      inventoryItemCategoryId,
      subTypeCode: formData.subTypeCode,
      subTypeName: formData.subTypeName,
      description: formData.description,
      displayOrder,
      isActive: formData.isActive,
      updatedBy: userId,
    });
    const { locales } = await import("@/i18n/config");
    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/inventory-name`, "page");
    }
    return { success: true, updatedId: result.id };
  } catch (error) {
    return handleActionError(error, "messages.updateFailed");
  }
}

export async function deleteInventoryNameAction(id: string) {
  try {
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    await inventoryItemNameService.delete(id);
    const { locales } = await import("@/i18n/config");
    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/inventory-name`, "page");
    }
    return { success: true };
  } catch (error) {
    return handleActionError(error, "messages.deleteFailed");
  }
}

export async function getInventoryNameByIdAction(id: string) {
  try {
    // The backend might not have a dedicated GET by ID endpoint for InventoryItemName.
    // Fetch all and filter by ID to ensure we find it.
    const response = await inventoryItemNameService.getAll({
      PageNumber: 1,
      PageSize: 1000,
    });
    const item = response.items.find((x) => String(x.id) === String(id));
    if (item) {
      return {
        ...item,
        inventoryItemCategoryId: item.inventoryItemCategoryId || (item as unknown as Record<string, unknown>).categoryId as number || (item as unknown as Record<string, unknown>).inventoryCategoryId as number || 0,
        subTypeCode: item.subTypeCode || (item as unknown as Record<string, unknown>).code as string || "",
        subTypeName: item.subTypeName || (item as unknown as Record<string, unknown>).name as string || "",
        displayOrder: item.displayOrder ?? 1,
      };
    }
    
    // Fallback just in case
    const data = await inventoryItemNameService.getById(id);
    if (data) {
      return {
        ...data,
        inventoryItemCategoryId: data.inventoryItemCategoryId || (data as unknown as Record<string, unknown>).categoryId as number || (data as unknown as Record<string, unknown>).inventoryCategoryId as number || 0,
        subTypeCode: data.subTypeCode || (data as unknown as Record<string, unknown>).code as string || "",
        subTypeName: data.subTypeName || (data as unknown as Record<string, unknown>).name as string || "",
        displayOrder: data.displayOrder ?? 1,
      };
    }
    return null;
  } catch (error) {
    logger.error("Error fetching name by ID:", { error, id });
    return null;
  }
}
