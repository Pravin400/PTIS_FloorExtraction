'use server';

import { revalidatePath } from 'next/cache';
import { configMasterService } from '@/lib/api/configuration-settings/config-master/configMaster.service';
import {
  CreateConfigCategorySchema,
  UpdateConfigCategorySchema,
} from '@/lib/validations/config-master.schema';
import type { 
  UpdateConfigCategoryRequest, 
} from '@/types/configMaster.types';
import { verifySession, getLocaleFromHeaders, tConfigMessage, localizeConfigError, localizeBackendMessage } from './utils';
import type { ActionResult } from '@/types/common.types';
import { logError } from '@/lib/utils/logger';
import { sanitizeTextInput } from '@/lib/utils/input-sanitization';


/**
 * Create a new Category
 */
export async function createConfigCategoryAction(formData: FormData): Promise<ActionResult> {
  try {
    const userId = await verifySession();

    const rawData = {
      categoryCode: sanitizeTextInput(formData.get('categoryCode') as string),
      categoryName: sanitizeTextInput(formData.get('categoryName') as string),
      displayOrder: parseInt(formData.get('displayOrder') as string) || 0,
      isActive: formData.get('isActive') === 'true',
    };

    const validation = CreateConfigCategorySchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: await tConfigMessage('unexpectedError', 'Validation failed'),
        validationErrors: validation.error.flatten().fieldErrors,
      };
    }

    // Check if category with the same code already exists (case-insensitive)
    const categoriesRes = await configMasterService.getAllCategories();
    const existingCategory = categoriesRes.success && categoriesRes.data
      ? categoriesRes.data.find(
          (c) => c.code.trim().toLowerCase() === validation.data.categoryCode.trim().toLowerCase()
        )
      : null;

    if (existingCategory) {
      if (existingCategory.isActive) {
        return {
          success: false,
          error: await tConfigMessage('duplicateCode', 'Code already exists. Please use a unique code.'),
          validationErrors: {
            categoryCode: ['messages.duplicateCode'],
          },
        };
      }

      // If it is inactive, reactivate it by calling updateConfigCategory
      const reactivateResult = await configMasterService.updateConfigCategory(
        Number(existingCategory.id),
        {
          categoryCode: validation.data.categoryCode,
          categoryName: validation.data.categoryName,
          displayOrder: validation.data.displayOrder || existingCategory.displayOrder,
          isActive: true,
          updatedBy: userId,
        }
      );

      if (reactivateResult.success) {
        const locale = await getLocaleFromHeaders();
        revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
        return {
          success: true,
          message: await tConfigMessage('categoryCreated', 'Category created successfully'),
        };
      }

      return {
        success: false,
        error: await localizeBackendMessage(
          reactivateResult.error,
          'unexpectedError',
          'Failed to create category'
        ),
      };
    }

    const result = await configMasterService.createConfigCategory({
      ...validation.data,
      createdBy: userId,
    });

    if (result.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
      return { 
        success: true, 
        message: await tConfigMessage('categoryCreated', 'Category created successfully') 
      };
    }

    return {
      success: false,
      error: await localizeBackendMessage(result.error, 'unexpectedError', 'Failed to create category'),
    };
  } catch (err) {
    logError('createConfigCategoryAction failed', { error: err instanceof Error ? err : undefined });
    const errorMessage = await localizeConfigError(err, 'unexpectedError', 'An unexpected error occurred');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update Category
 */
export async function updateConfigCategoryAction(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  try {
    const userId = await verifySession();

    const rawData = {
      categoryCode: sanitizeTextInput(formData.get('categoryCode') as string),
      categoryName: sanitizeTextInput(formData.get('categoryName') as string),
      displayOrder: parseInt(formData.get('displayOrder') as string) || 0,
      isActive: formData.get('isActive') === 'true',
    };

    const validation = UpdateConfigCategorySchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: await tConfigMessage('unexpectedError', 'Validation failed'),
        validationErrors: validation.error.flatten().fieldErrors,
      };
    }

    // Verify that the updated code is not already in use by any other category (active or inactive)
    const categoriesRes = await configMasterService.getAllCategories();
    if (categoriesRes.success && categoriesRes.data) {
      const duplicateCategory = categoriesRes.data.find(
        (c) =>
          c.code.trim().toLowerCase() === validation.data.categoryCode.trim().toLowerCase() &&
          Number(c.id) !== id
      );
      if (duplicateCategory) {
        return {
          success: false,
          error: await tConfigMessage('duplicateCode', 'Code already exists. Please use a unique code.'),
          validationErrors: {
            categoryCode: ['messages.duplicateCode'],
          },
        };
      }
    }

    const result = await configMasterService.updateConfigCategory(id, {
      ...validation.data,
      updatedBy: userId,
    });

    if (result.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
      return { 
        success: true, 
        message: await tConfigMessage('categoryUpdated', 'Category updated successfully') 
      };
    }

    return {
      success: false,
      error: await localizeBackendMessage(result.error, 'unexpectedError', 'Failed to update category'),
    };
  } catch (err) {
    logError('updateConfigCategoryAction failed', { error: err instanceof Error ? err : undefined, id });
    const errorMessage = await localizeConfigError(err, 'unexpectedError', 'An unexpected error occurred');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update Category Status
 */
export async function updateConfigCategoryStatusAction(
  id: number,
  isActive: boolean,
  currentData: { code: string; name: string; displayOrder: number }
): Promise<ActionResult> {
  try {
    const userId = await verifySession();

    const payload: UpdateConfigCategoryRequest = {
      categoryCode: sanitizeTextInput(currentData.code),
      categoryName: sanitizeTextInput(currentData.name),
      displayOrder: currentData.displayOrder,
      isActive: isActive,
      updatedBy: userId,
    };

    const result = await configMasterService.updateConfigCategory(id, payload);

    if (result.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
      return {
        success: true,
        message: await tConfigMessage(isActive ? 'categoryEnabled' : 'categoryDisabled', `Category ${isActive ? 'enabled' : 'disabled'} successfully`),
      };
    }
    return { success: false, error: await localizeBackendMessage(result.error, 'unexpectedError', 'Failed to update category status') };
  } catch (err) {
    logError('updateConfigCategoryStatusAction failed', { error: err instanceof Error ? err : undefined, id, isActive });
    const errorMessage = await localizeConfigError(err, 'unexpectedError', 'An unexpected error occurred');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete Category
 */
export async function deleteConfigCategoryAction(id: number): Promise<ActionResult> {
  try {
    await verifySession();
    
    const res = await configMasterService.deleteConfigCategory(id);
    if (res.success) {
      const locale = await getLocaleFromHeaders();
      revalidatePath(`/${locale}/configuration-settings/config-master`, 'page');
    }
    return {
      success: res.success,
      error: res.success ? undefined : await localizeBackendMessage(res.error, 'unexpectedError', 'Failed to delete category'),
      message: res.success ? await tConfigMessage('categoryDeleted', 'Category deleted successfully') : undefined,
    };
  } catch (err) {
    logError('deleteConfigCategoryAction failed', { error: err instanceof Error ? err : undefined, id });
    const errorMessage = await localizeConfigError(err, 'unexpectedError', 'An unexpected error occurred');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

