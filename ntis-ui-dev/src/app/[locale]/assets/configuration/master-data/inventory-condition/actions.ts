'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { inventoryConditionService } from '@/lib/api/asset-masters/inventory-condition.service';
import { assetCategoryService } from '@/lib/api/asset-masters/asset-category-crud.service';
import { inventoryCategoryService } from '@/lib/api/asset-masters/inventory-category.service';
import { getUserIdFromCookies } from '@/lib/utils/cookie';
import { handleActionError } from '@/lib/utils/asset-utils/actions.utils';
import { createLogger } from '@/lib/utils/server-logger';
import { validateInventoryConditionServerInput } from '@/hooks/asset-masters/inventory-condition/validation';
import type {
  InventoryConditionFormModel,
  AssetConditionCategory,
  InventoryConditionCategory,
  CreateInventoryConditionDto,
  UpdateInventoryConditionDto,
  InventoryConditionPagedResult,
} from '@/types/asset-masters/inventory-condition.types';
import type { AssetCategory } from '@/types/asset-masters/asset-category.types';
import type { InventoryCategoryItem } from '@/types/asset-masters/inventory-category.types';

const logger = createLogger('InventoryConditionActions');

function normalizeInventoryConditionFormData(formData: InventoryConditionFormModel): InventoryConditionFormModel {
  return {
    ...formData,
    conditionCategory: formData.conditionCategory || formData.conditionType || "",
    categoryId: formData.categoryId ?? formData.inventoryItemCategoryId,
  };
}

export async function fetchInventoryConditionPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm: string,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Promise<InventoryConditionPagedResult> {
  // Errors rethrown to trigger Next.js error boundary (error.tsx)
  return await inventoryConditionService.getAll({
    PageNumber: pageNumber,
    PageSize: pageSize,
    SearchTerm: searchTerm,
    SortBy: sortBy,
    SortOrder: sortOrder,
    MarkedForDeletion: false,
  });
}

export async function getAssetCategoriesForConditionAction(): Promise<AssetConditionCategory[]> {
  try {
    const res = await assetCategoryService.getAll({
      PageSize: -1,
      IsActive: 'true',
    });
    return (res.items || []).map((c: AssetCategory) => ({
      id: c.id,
      categoryName: c.categoryName,
    }));
  } catch (error) {
    logger.error('Error fetching asset categories for condition:', { operation: 'getAssetCategoriesForConditionAction' }, error);
    throw error;
  }
}

export async function getInventoryConditionCategoriesAction(): Promise<InventoryConditionCategory[]> {
  try {
    const res = await inventoryCategoryService.getAll({
      PageSize: -1,
      IsActive: true,
    });
    return (res.items || []).map((c: InventoryCategoryItem) => ({
      id: c.id,
      categoryName: c.typeName || '',
    }));
  } catch (error) {
    logger.error('Error fetching inventory categories for condition:', { operation: 'getInventoryConditionCategoriesAction' }, error);
    throw error;
  }
}

export async function createInventoryConditionAction(formData: InventoryConditionFormModel) {
  try {
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) {
      return { success: false, statusCode: 401, error: 'Unauthorized' };
    }

    const validation = validateInventoryConditionServerInput(normalizeInventoryConditionFormData(formData), false);
    if (!validation.isValid || !validation.sanitizedDto) {
      return {
        success: false,
        statusCode: 400,
        error: 'Validation failed',
        validationErrors: validation.errors,
      };
    }

    const dto: CreateInventoryConditionDto = {
      ...validation.sanitizedDto,
      createdBy: userId,
    };

    const result = await inventoryConditionService.create(dto);

    const { locales } = await import('@/i18n/config');
    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/inventory-condition`, 'page');
    }
    return { success: true, createdId: result.id };
  } catch (error) {
    return handleActionError(error, 'messages.createFailed');
  }
}

export async function updateInventoryConditionAction(formData: InventoryConditionFormModel) {
  try {
    const id = Number(formData.id);
    if (!Number.isFinite(id) || id <= 0) {
      return { success: false, statusCode: 400, message: 'Valid ID is required for update' };
    }

    const userId = getUserIdFromCookies(await cookies());
    if (!userId) {
      return { success: false, statusCode: 401, error: 'Unauthorized' };
    }

    const validation = validateInventoryConditionServerInput(normalizeInventoryConditionFormData(formData), true);
    if (!validation.isValid || !validation.sanitizedDto) {
      return {
        success: false,
        statusCode: 400,
        error: 'Validation failed',
        validationErrors: validation.errors,
      };
    }

    const dto: UpdateInventoryConditionDto = {
      ...validation.sanitizedDto,
      updatedBy: userId,
    };

    const result = await inventoryConditionService.update(id, dto);

    const { locales } = await import('@/i18n/config');
    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/inventory-condition`, 'page');
    }
    return { success: true, updatedId: result.id };
  } catch (error) {
    return handleActionError(error, 'messages.updateFailed');
  }
}

export async function deleteInventoryConditionAction(id: string | number) {
  try {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return { success: false, statusCode: 400, message: 'Valid ID is required' };
    }

    const userId = getUserIdFromCookies(await cookies());
    if (!userId) {
      return { success: false, statusCode: 401, error: 'Unauthorized' };
    }

    await inventoryConditionService.delete(numericId);
    const { locales } = await import('@/i18n/config');
    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/inventory-condition`, 'page');
    }
    return { success: true };
  } catch (error) {
    return handleActionError(error, 'messages.deleteFailed');
  }
}

export async function getInventoryConditionByIdAction(id: string | number): Promise<InventoryConditionFormModel | null> {
  const numericId = typeof id === 'number' ? id : Number.parseInt(String(id), 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return null;
  }
  try {
    const item = await inventoryConditionService.getById(numericId);
    if (!item || !item.id) {
      return null;
    }
    return {
      id: item.id,
      conditionCategory: item.conditionCategory,
      categoryId: item.categoryId,
      conditionName: item.conditionName,
      description: item.description || '',
      conditionFactor: item.conditionFactor,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
      // Legacy normalization aliases
      inventoryItemCategoryId: item.categoryId,
      conditionType: item.conditionCategory,
    };
  } catch (error: unknown) {
    // If 404 Not Found, return null so edit page triggers Next.js notFound()
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode?: number }).statusCode === 404) {
      return null;
    }
    logger.error('Error fetching condition by ID:', { id }, error);
    throw error;
  }
}
