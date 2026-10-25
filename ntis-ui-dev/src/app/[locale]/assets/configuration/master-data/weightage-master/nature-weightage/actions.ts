"use server";

import { getConstructionPaged } from "@/lib/api/constructiontypemaster/construction-crud.service";

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
} from "@/lib/api/asset-masters/natureofbuilding-cv-weightageMaster.service";
import { ApiError } from "@/lib/utils/api";
import { cleanErrorMessage } from "@/lib/utils/api-error-handler";
import { createLogger } from "@/lib/utils/server-logger";
import {
  NatureFactorCVMaster,
  NatureFactorCVMasterCreate,
  NatureFactorCVMasterUpdate,
  BulkNatureFactorCVMasterCreate,
  BulkNatureFactorCVMasterUpdate,
} from "@/types/asset-masters/natureofbuilding-cv-weightageMaster.types";
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
      const t = await getTranslations('assetWeightageMaster.nature');
      throw new Error(t('errors.invalidPaginationParameters'));
    }

    // Ensure selectedYearRange is not passed if empty
    const yearRangeParam =
      selectedYearRange && selectedYearRange.trim() !== "" ? selectedYearRange : undefined;

    // Whitelist and map sort columns to API allowed fields (ConstructionTypeId, YearRangeCVId, IsActive)
    const allowedSortColumns = ["ConstructionTypeId", "YearRangeCVId", "IsActive", "ConstructionCode", "ConstructionDescription", "FromYear"];
    let validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    if (validSortBy === "ConstructionCode" || validSortBy === "ConstructionDescription") {
      validSortBy = "ConstructionTypeId";
    } else if (validSortBy === "FromYear") {
      validSortBy = "YearRangeCVId";
    }

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
      const t = await getTranslations('assetWeightageMaster.nature');
      return {
        success: false,
        message: t('errors.invalidNatureFactorCVId'),
        statusCode: 400,
      };
    }

    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    const updatePayload = {
      ...payload,
      updatedBy: userId
    };

    await updateNatureFactorCVMaster(id, updatePayload);

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "layout");
      revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/nature-weightage`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('updateNatureFactorCVMaster');
    logger.error('Failed to update NatureFactorCVMaster', { operation: 'updateNatureFactorCVMasterAction', id }, error);
    if (error instanceof ApiError) {
      const t = await getTranslations('common');
      return {
        success: false,
        message: cleanErrorMessage(error.responseText || error.message, t('errors.serverError')),
        statusCode: error.statusCode,
      };
    }
    const t = await getTranslations('common');
    return {
      success: false,
      message: cleanErrorMessage(error instanceof Error ? error.message : t('errors.generic'), t('errors.generic')),
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
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    const createPayload = {
      ...payload,
      createdBy: userId
    };

    const response = await createNatureFactorCVMaster(createPayload);
    if (response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "layout");
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/nature-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      const t = await getTranslations('assetWeightageMaster.nature');
      return { success: false, message: cleanErrorMessage(response.error, t('errors.createFailed')), statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('createNatureFactorCVMaster');
    logger.error('Failed to create NatureFactorCVMaster', { operation: 'createNatureFactorCVMasterAction' }, error);
    if (error instanceof ApiError) {
      const t = await getTranslations('common');
      return {
        success: false,
        message: cleanErrorMessage(error.responseText || error.message, t('errors.serverError')),
        statusCode: error.statusCode,
      };
    }
    const t = await getTranslations('common');
    return {
      success: false,
      message: cleanErrorMessage(error instanceof Error ? error.message : t('errors.generic'), t('errors.generic')),
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
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    const bulkCreatePayload = payload.map(item => ({
      ...item,
      createdBy: userId
    }));

    const response = await bulkCreateNatureFactorCVMaster(bulkCreatePayload);
    if (response && response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "layout");
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/nature-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      const t = await getTranslations('assetWeightageMaster.nature');
      return { success: false, message: cleanErrorMessage(response?.error, t('errors.bulkCreateFailed')), statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('bulkCreateNatureFactorCVMaster');
    logger.error('Failed to bulk create NatureFactorCVMaster', { operation: 'bulkCreateNatureFactorCVMasterAction', count: payload.length }, error);
    if (error instanceof ApiError) {
      const t = await getTranslations('common');
      return {
        success: false,
        message: cleanErrorMessage(error.responseText || error.message, t('errors.serverError')),
        statusCode: error.statusCode,
      };
    }
    const t = await getTranslations('common');
    return {
      success: false,
      message: cleanErrorMessage(error instanceof Error ? error.message : t('errors.generic'), t('errors.generic')),
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
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    const bulkUpdatePayload = payload.map(item => ({
      ...item,
      data: {
        ...item.data,
        updatedBy: userId
      }
    }));

    await bulkUpdateNatureFactorCVMaster(bulkUpdatePayload);
    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "layout");
      revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/nature-weightage`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('bulkUpdateNatureFactorCVMaster');
    logger.error('Failed to bulk update NatureFactorCVMaster', { operation: 'bulkUpdateNatureFactorCVMasterAction', count: payload.length }, error);

    if (error instanceof ApiError) {
      const t = await getTranslations('common');
      return {
        success: false,
        message: cleanErrorMessage(error.responseText || error.message, t('errors.serverError')),
        statusCode: error.statusCode,
      };
    }
    const t = await getTranslations('common');
    return {
      success: false,
      message: cleanErrorMessage(error instanceof Error ? error.message : t('errors.generic'), t('errors.generic')),
      statusCode: 500,
    };
  }
}

/**
 * Fetch Asset Construction Paged
 */
export async function fetchAssetConstructionPagedAction(
  pageNumber: number,
  pageSize: number
) {
  try {
    return await getConstructionPaged(pageNumber, pageSize);
  } catch (error: unknown) {
    const logger = createLogger('fetchAssetConstructionPaged');
    logger.error('Failed to fetch Asset Construction records', { operation: 'fetchAssetConstructionPagedAction' }, error);
    throw error;
  }
}
