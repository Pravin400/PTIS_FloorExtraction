"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { locales } from "@/i18n/config";
import {
  getUseFactorCVMasterWithParams,
  getUseFactorCVMasterById,
  updateUseFactorCVMaster,
  createUseFactorCVMaster,
  bulkCreateUseFactorCVMaster,
  bulkUpdateUseFactorCVMaster,
  getTypeOfUseWithParams,
} from "@/lib/api/weightagemaster/useCategoryCvFactor/useCategoryCvFactor.service";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";
import { sanitizeNumericParam } from "@/lib/utils/params";
import {
  UseFactorCVMaster,
  UseFactorCVMasterCreate,
  UseFactorCVMasterUpdate,
  PagedResponse,
  BulkUseFactorCVMasterCreate,
  BulkUseFactorCVMasterUpdate,
  TypeOfUseQueryParams,
  UseType,
} from "@/types/useCategoryCvFactor.types";
import { deleteUseFactorCVMaster } from "@/lib/api/weightagemaster/useCategoryCvFactor/useCategoryCvFactor-queries.service";


/**
 * Fetch paginated UseFactorCVMaster records with filtering and sorting
 */
export async function fetchUseFactorCVMasterPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  selectedYearRange?: string,
  typeOfUseId?: number,
  subTypeOfUseId?: number,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<UseFactorCVMaster>> {
  try {
    const MAX_PAGE_SIZE = 1000; // Increased limit
    const MAX_PAGE_NUMBER = 10000;

    // Handle potential "undefined" string or NaN
    const safeTypeOfUseId = sanitizeNumericParam(typeOfUseId);
    const safeSubTypeOfUseId = sanitizeNumericParam(subTypeOfUseId);

    if (
      pageNumber <= 0 ||
      (pageSize <= 0 && pageSize !== -1) ||
      pageSize > MAX_PAGE_SIZE ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      const { getTranslations } = await import('next-intl/server');
      const t = await getTranslations('useCategoryFactorMaster');
      throw new Error(t('errors.invalidPaginationParameters'));
    }

    const yearRangeParam = sanitizeNumericParam(selectedYearRange);

    // Validate sortBy against allowed columns to prevent injection
    const allowedSortColumns = ["TypeOfUseCode", "TypeOfUseDescription", "SubTypeOfUseDescription", "FromYear"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? (sortOrder.toLowerCase() as "asc" | "desc") : undefined;

    const response = await getUseFactorCVMasterWithParams({
      pageNumber,
      pageSize,
      searchTerm,
      yearRangeCVId: yearRangeParam,
      typeOfUseId: safeTypeOfUseId,
      subTypeOfUseId: safeSubTypeOfUseId,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    });

    if (!response.success || !response.data) {
      const { getTranslations } = await import('next-intl/server');
      const t = await getTranslations('useCategoryFactorMaster');
      throw new Error(response.error || t('errors.fetchFailed'));
    }

    return response.data;
  } catch (error: unknown) {
    const logger = createLogger('fetchUseFactorCVMasterPaged');

    if (error instanceof ApiError) {
      logger.error(
        'Failed to fetch UseFactorCVMaster records',
        {
          operation: 'fetchUseFactorCVMasterPagedServerAction',
          statusCode: error.statusCode,
          pageNumber,
          pageSize,
          hasSearchTerm: !!searchTerm,
          hasYearRange: !!selectedYearRange,
        },
        error
      );
    } else if (error instanceof Error) {
      logger.error(
        'Failed to fetch UseFactorCVMaster records',
        {
          operation: 'fetchUseFactorCVMasterPagedServerAction',
          pageNumber,
          pageSize,
        },
        error
      );
    }
    throw error;
  }
}

/**
 * fetch UseFactorCVMaster by ID
 */
export async function fetchUseFactorCVMasterByIdServerAction(id: number) {
  const logger = createLogger('fetchUseFactorCVMasterById');
  logger.info('Starting request', { operation: 'fetchUseFactorCVMasterByIdServerAction', id });

  try {
    if (!id || id <= 0) {
      throw new Error('Invalid Use Factor CV ID');
    }

    const response = await getUseFactorCVMasterById(id);
    logger.info('Successfully fetched UseFactorCVMaster by ID', { id });

    if (!response?.success || !response.data) {
      throw new Error(response?.error || 'Failed to fetch record');
    }

    return { success: true, data: response.data };
  } catch (error: unknown) {
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
      status: error instanceof ApiError ? error.statusCode : 500,
    };

    logger.error('Failed to fetch UseFactorCVMaster by ID', { error: errorDetails });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch record',
      error: errorDetails,
    };
  }
}

export async function updateUseFactorCVMasterAction(
  id: number,
  payload: Omit<UseFactorCVMasterUpdate, 'updatedBy'>
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const userId = getUserIdFromCookies(await cookies()) || 1;

    const finalPayload: UseFactorCVMasterUpdate = {
      ...payload,
      updatedBy: userId
    };

    await updateUseFactorCVMaster(id, finalPayload);

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/weightage-master/sub-type-weightage`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('updateUseFactorCVMaster');
    logger.error('Failed to update UseFactorCVMaster', { operation: 'updateUseFactorCVMasterAction', id }, error);

    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText || 'API Error occurred',
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update record",
      statusCode: 500,
    };
  }
}

/**
 * Create UseFactorCVMaster record
 */
export async function createUseFactorCVMasterAction(
  payload: Omit<UseFactorCVMasterCreate, 'createdBy'>
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const userId = getUserIdFromCookies(await cookies()) || 1;

    const finalPayload: UseFactorCVMasterCreate = {
      ...payload,
      createdBy: userId
    };

    const response = await createUseFactorCVMaster(finalPayload);
    if (response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/property-tax/weightage-master/sub-type-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      return { success: false, message: response.error || 'Failed to create record', statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('createUseFactorCVMaster');
    logger.error('Failed to create UseFactorCVMaster', { operation: 'createUseFactorCVMasterAction' }, error);

    if (error instanceof ApiError) {
      return { success: false, message: error.responseText || 'API Error occurred', statusCode: error.statusCode };
    }
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error', statusCode: 500 };
  }
}

/**
 * Bulk Create UseFactorCVMaster records
 */
export async function bulkCreateUseFactorCVMasterAction(
  payload: Array<Omit<UseFactorCVMasterCreate, 'createdBy'>>
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const userId = getUserIdFromCookies(await cookies()) || 1;

    const finalPayload: BulkUseFactorCVMasterCreate = payload.map(item => ({
      ...item,
      createdBy: userId
    }));

    const response = await bulkCreateUseFactorCVMaster(finalPayload);
    if (response && response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/property-tax/weightage-master/sub-type-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      return { success: false, message: response?.error || 'Failed to bulk create records', statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('bulkCreateUseFactorCVMaster');
    logger.error('Failed to bulk create UseFactorCVMaster', { operation: 'bulkCreateUseFactorCVMasterAction', count: payload.length }, error);

    if (error instanceof ApiError) {
      return { success: false, message: error.responseText || 'API Error occurred', statusCode: error.statusCode };
    }
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error', statusCode: 500 };
  }
}

/**
 * Bulk Update UseFactorCVMaster records
 */
export async function bulkUpdateUseFactorCVMasterAction(
  payload: Array<{ id: number; data: Omit<UseFactorCVMasterUpdate, 'updatedBy'> }>
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const userId = getUserIdFromCookies(await cookies()) || 1;

    const finalPayload: BulkUseFactorCVMasterUpdate = payload.map(item => ({
      id: item.id,
      data: {
        ...item.data,
        updatedBy: userId
      }
    }));

    await bulkUpdateUseFactorCVMaster(finalPayload);

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/weightage-master/sub-type-weightage`, "page");
    }

    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('bulkUpdateUseFactorCVMaster');
    logger.error('Failed to bulk update UseFactorCVMaster', { operation: 'bulkUpdateUseFactorCVMasterAction', count: payload.length }, error);

    if (error instanceof ApiError) {
      return { success: false, message: error.responseText || 'API Error occurred', statusCode: error.statusCode };
    }
    return { success: false, message: error instanceof Error ? error.message : "Failed to bulk update", statusCode: 500 };
  }
}

/**
 * Fetch paginated TypeOfUse records with filtering and sorting
 */
export async function fetchTypeOfUsePaged(
  params: TypeOfUseQueryParams
): Promise<PagedResponse<UseType>> {
  try {
    // Validate sortBy and sortOrder for TypeOfUse
    const allowedSortColumns = ["TypeOfUseCode", "Description"];
    const validSortBy = params.sortBy && allowedSortColumns.includes(params.sortBy) ? params.sortBy : undefined;
    const validSortOrder = params.sortOrder && ["asc", "desc"].includes(params.sortOrder.toLowerCase()) ? (params.sortOrder.toLowerCase() as "asc" | "desc") : undefined;

    const response = await getTypeOfUseWithParams({
      ...params,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    });

    if (!response.success || !response.data) {
      const { getTranslations } = await import('next-intl/server');
      const t = await getTranslations('useCategoryFactorMaster');
      throw new Error(response.error || t('errors.fetchTypeOfUseFailed'));
    }

    // Map API response to UseType interface
    const mappedItems: UseType[] = response.data.items.map((item) => ({
      id: item.id,
      typeOfUseGroupId: item.typeOfUseGroupId || 0,
      typeOfUseCode: item.typeOfUseCode,
      description: item.description,
      isActive: item.isActive,
      type: item.type || '',
      searchKey: item.searchKey || '',
      searchSequence: item.searchSequence || 0,
      createdDate: item.createdDate,
      updatedDate: item.updatedDate,
    }));

    return {
      ...response.data,
      items: mappedItems
    };
  } catch (error: unknown) {
    const logger = createLogger('fetchTypeOfUsePaged');
    logger.error(
      'Failed to fetch TypeOfUse records',
      {
        operation: 'fetchTypeOfUsePaged',
        hasParams: !!params,
      },
      error
    );
    throw error;
  }
}

export async function deleteUseFactorCVMasterAction(id: number): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const response = await deleteUseFactorCVMaster(id);
    if (response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/property-tax/weightage-master/sub-type-weightage`, "page");
      }
      return { success: true };
    } else {
      return { success: false, message: response.error || 'Failed to delete record', statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('deleteUseFactorCVMasterAction');
    logger.error('Failed to delete UseFactorCVMaster', { operation: 'deleteUseFactorCVMasterAction', id }, error);

    if (error instanceof ApiError) {
      return { success: false, message: error.responseText || 'API Error occurred', statusCode: error.statusCode };
    }
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error', statusCode: 500 };
  }
}
