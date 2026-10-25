"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { locales } from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import {
  getNatureFactorCVMasterWithPagination,
  updateNatureFactorCVMaster,
  createNatureFactorCVMaster,
  bulkCreateNatureFactorCVMaster,
  bulkUpdateNatureFactorCVMaster,
  getNatureFactorCVMasterById,
  deleteNatureFactorCVMasterById,
} from "@/lib/api/natureofbuilding-cv-weightageMaster.service";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";
import {
  NatureFactorCVMaster,
  NatureFactorCVMasterCreate,
  NatureFactorCVMasterUpdate,
  BulkNatureFactorCVMasterCreate,
  BulkNatureFactorCVMasterUpdate,
} from "@/types/natureofbuilding-cv-weightageMaster.types";
import { PagedResponse } from "@/types/common.types";

/**
 * Fetch paginated NatureFactorCVMaster records with filtering and sorting
 */
export async function fetchNatureFactorCVMasterPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  selectedYearRange?: string,
  constructionTypeId?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<NatureFactorCVMaster>> {
  try {
    const MAX_PAGE_SIZE = 100;
    const MAX_PAGE_NUMBER = 10000;
    if (
      pageNumber <= 0 ||
      (pageSize <= 0 && pageSize !== -1) ||
      (pageSize > MAX_PAGE_SIZE && pageSize !== -1) ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      const t = await getTranslations('common');
      throw new Error(t('errors.apiValidationFailed'));
    }

    // Ensure selectedYearRange is not passed if empty
    const yearRangeParam =
      selectedYearRange && selectedYearRange.trim() !== "" ? selectedYearRange : undefined;

    // Whitelist sort columns to prevent injection
    const allowedSortColumns = ["ConstructionCode", "ConstructionDescription", "FromYear"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder =
      sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase())
        ? (sortOrder.toLowerCase() as "asc" | "desc")
        : undefined;

    return await getNatureFactorCVMasterWithPagination(
      pageNumber,
      pageSize,
      searchTerm,
      yearRangeParam,
      constructionTypeId,
      validSortBy,
      validSortOrder
    );
  } catch (error: unknown) {
    const logger = createLogger('fetchNatureFactorCVMasterPaged');
    logger.error('Failed to fetch NatureFactorCVMaster records', {
      operation: 'fetchNatureFactorCVMasterPagedServerAction',
      pageNumber,
      pageSize,
    }, error);
    throw error;
  }
}

/**
 * Update NatureFactorCVMaster record
 */
export async function updateNatureFactorCVMasterAction(
  id: number,
  payload: NatureFactorCVMasterUpdate
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    if (!id || id <= 0) {
      const t = await getTranslations('natureFactorCVMaster');
      return {
        success: false,
        message: t('errors.invalidNatureFactorCVId'),
        statusCode: 400,
      };
    }

    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    const updatePayload = {
      ...payload,
      updatedBy: userId
    };

    await updateNatureFactorCVMaster(id, updatePayload);

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
      revalidatePath(`/${locale}/property-tax/weightage-master/nature-weightage`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('updateNatureFactorCVMaster');
    logger.error('Failed to update NatureFactorCVMaster', { operation: 'updateNatureFactorCVMasterAction', id }, error);
    if (error instanceof ApiError) {
      const t = await getTranslations('common');
      return {
        success: false,
        message: error.responseText || t('errors.serverError'),
        statusCode: error.statusCode,
      };
    }
    const t = await getTranslations('common');
    return {
      success: false,
      message: error instanceof Error ? error.message : t('errors.generic'),
      statusCode: 500,
    };
  }
}

/**
 * Create NatureFactorCVMaster record
 */
export async function createNatureFactorCVMasterAction(
  payload: NatureFactorCVMasterCreate
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    const createPayload = {
      ...payload,
      createdBy: userId
    };

    const response = await createNatureFactorCVMaster(createPayload);
    if (response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
        revalidatePath(`/${locale}/property-tax/weightage-master/nature-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      const t = await getTranslations('natureFactorCVMaster');
      return { success: false, message: response.error || t('errors.createFailed'), statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('createNatureFactorCVMaster');
    logger.error('Failed to create NatureFactorCVMaster', { operation: 'createNatureFactorCVMasterAction' }, error);
    if (error instanceof ApiError) {
      const t = await getTranslations('common');
      return {
        success: false,
        message: error.responseText || t('errors.serverError'),
        statusCode: error.statusCode,
      };
    }
    const t = await getTranslations('common');
    return {
      success: false,
      message: error instanceof Error ? error.message : t('errors.generic'),
      statusCode: 500,
    };
  }
}

/**
 * Bulk Create NatureFactorCVMaster records
 */
export async function bulkCreateNatureFactorCVMasterAction(
  payload: BulkNatureFactorCVMasterCreate
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    const bulkCreatePayload = payload.map(item => ({
      ...item,
      createdBy: userId
    }));

    const response = await bulkCreateNatureFactorCVMaster(bulkCreatePayload);
    if (response && response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
        revalidatePath(`/${locale}/property-tax/weightage-master/nature-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      const t = await getTranslations('natureFactorCVMaster');
      return { success: false, message: response?.error || t('errors.bulkCreateFailed'), statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('bulkCreateNatureFactorCVMaster');
    logger.error('Failed to bulk create NatureFactorCVMaster', { operation: 'bulkCreateNatureFactorCVMasterAction', count: payload.length }, error);
    if (error instanceof ApiError) {
      const t = await getTranslations('common');
      return {
        success: false,
        message: error.responseText || t('errors.serverError'),
        statusCode: error.statusCode,
      };
    }
    const t = await getTranslations('common');
    return {
      success: false,
      message: error instanceof Error ? error.message : t('errors.generic'),
      statusCode: 500,
    };
  }
}

/**
 * Bulk Update NatureFactorCVMaster records
 */
export async function bulkUpdateNatureFactorCVMasterAction(
  payload: BulkNatureFactorCVMasterUpdate
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    const bulkUpdatePayload = payload.map(item => ({
      ...item,
      data: {
        ...item.data,
        updatedBy: userId
      }
    }));

    await bulkUpdateNatureFactorCVMaster(bulkUpdatePayload);
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
      revalidatePath(`/${locale}/property-tax/weightage-master/nature-weightage`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('bulkUpdateNatureFactorCVMaster');
    logger.error('Failed to bulk update NatureFactorCVMaster', { operation: 'bulkUpdateNatureFactorCVMasterAction', count: payload.length }, error);

    if (error instanceof ApiError) {
      const t = await getTranslations('common');
      return {
        success: false,
        message: error.responseText || t('errors.serverError'),
        statusCode: error.statusCode,
      };
    }
    const t = await getTranslations('common');
    return {
      success: false,
      message: error instanceof Error ? error.message : t('errors.generic'),
      statusCode: 500,
    };
  }
}

/**
 * Server action to fetch a single NatureFactorCVMaster record by ID
 */
export async function fetchNatureFactorCVMasterByIdServerAction(id: number) {
  const logger = createLogger('fetchNatureFactorCVMasterById');
  logger.info('Starting request', { operation: 'fetchNatureFactorCVMasterByIdServerAction', id });
  try {
    if (!id || id <= 0) {
      throw new Error("Invalid Nature Factor ID");
    }
    const data = await getNatureFactorCVMasterById(id);
    logger.info('Successfully fetched NatureFactorCVMaster by ID', { id });
    return { success: true, data };
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number; status?: number };
    const errorDetails = {
      message: err.message || 'Unknown error occurred',
      stack: err.stack,
      status: err.statusCode || err.status || 500,
    };
    logger.error('Failed to fetch NatureFactorCVMaster by ID', { error: errorDetails });
    return {
      success: false,
      message: err.message || 'Failed to fetch record',
      error: errorDetails,
    };
  }
}

/**
 * Delete NatureFactorCVMaster record by ID
 * @param id The ID of the record to delete
 * @returns Promise resolving to an object indicating success or failure
 */

export async function deleteNatureFactorCVMasterActionById(
    id: number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    try {
        const response = await deleteNatureFactorCVMasterById(id);
        if (response.success) {
            for (const locale of locales) {
                revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
                revalidatePath(`/${locale}/property-tax/weightage-master/nature-weightage`, "page");
            }
            return { success: true };
        } else {
            return { success: false, message: response.error || 'Failed to delete record', statusCode: 500 };
        }
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return { success: false, message: error.responseText || 'API Error occurred', statusCode: error.statusCode };
        }
        if (error instanceof Error) {
            return { success: false, message: error.message, statusCode: 500 };
        }
        return { success: false, message: 'Unknown error', statusCode: 500 };
    }
}
