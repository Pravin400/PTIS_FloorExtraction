"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { locales } from "@/i18n/config";
import {
  getUseFactorCVMasterWithParams,
  updateUseFactorCVMaster,
  createUseFactorCVMaster,
  bulkCreateUseFactorCVMaster,
  bulkUpdateUseFactorCVMaster,
  getTypeOfUseWithParams,
  getSubTypeOfUseWithParams,
} from "@/lib/api/asset-masters/weightagemaster/useCategoryCvFactor/useCategoryCvFactor.service";
import { ApiError } from "@/lib/utils/api";
import { cleanErrorMessage } from "@/lib/utils/api-error-handler";
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
  SubTypeOfUseResponse,
} from "@/types/asset-masters/useCategoryCvFactor.types";

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
    const MAX_PAGE_SIZE = 1000;
    const MAX_PAGE_NUMBER = 10000;

    const safeTypeOfUseId = sanitizeNumericParam(typeOfUseId);
    const safeSubTypeOfUseId = sanitizeNumericParam(subTypeOfUseId);

    if (
      pageNumber <= 0 ||
      (pageSize <= 0 && pageSize !== -1) ||
      pageSize > MAX_PAGE_SIZE ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      const { getTranslations } = await import('next-intl/server');
      const t = await getTranslations('assetWeightageMaster.subType');
      throw new Error(t('errors.invalidPaginationParameters'));
    }

    const yearRangeParam = sanitizeNumericParam(selectedYearRange);

    const allowedSortColumns = ["TypeOfUseId", "SubTypeOfUseId", "YearRangeCVId", "IsActive", "TypeOfUseCode", "TypeOfUseDescription", "SubTypeOfUseDescription", "FromYear"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    let apiSortBy = validSortBy;
    if (apiSortBy === "TypeOfUseCode" || apiSortBy === "TypeOfUseDescription") apiSortBy = "TypeOfUseId";
    else if (apiSortBy === "SubTypeOfUseDescription") apiSortBy = "SubTypeOfUseId";
    else if (apiSortBy === "FromYear") apiSortBy = "YearRangeCVId";

    const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? (sortOrder.toLowerCase() as "asc" | "desc") : undefined;

    const response = await getUseFactorCVMasterWithParams({
      pageNumber: 1,
      pageSize: -1,
      searchTerm,
      yearRangeCVId: yearRangeParam,
      typeOfUseId: safeTypeOfUseId,
      subTypeOfUseId: safeSubTypeOfUseId,
      sortBy: apiSortBy,
      sortOrder: validSortOrder,
    });

    if (!response.success || !response.data) {
      const { getTranslations } = await import('next-intl/server');
      const t = await getTranslations('assetWeightageMaster.subType');
      throw new Error(response.error || t('errors.fetchFailed'));
    }

    if (!safeSubTypeOfUseId) {
      try {
        const subTypesRes = await getSubTypeOfUseWithParams({
          typeOfUseId: safeTypeOfUseId,
          pageSize: -1,
          filterLogic: 1,
        });

        if (subTypesRes.success && subTypesRes.data?.items) {
          const subTypes = subTypesRes.data.items;
          const items = response.data.items || [];
          const typeMap = new Map<number, { code: string; description: string }>();

          try {
            const allTypesRes = await getTypeOfUseWithParams({ pageSize: -1 });
            if (allTypesRes.success && allTypesRes.data?.items) {
              allTypesRes.data.items.forEach((typeItem: { id: number; typeOfUseCode?: string; description?: string }) => {
                typeMap.set(typeItem.id, {
                  code: typeItem.typeOfUseCode || "",
                  description: typeItem.description || "",
                });
              });
            }
          } catch {
            // Ignore fallback fetch errors
          }

          items.forEach((item: UseFactorCVMaster) => {
            const match = subTypes.find((s: SubTypeOfUseResponse) => Number(s.id) === Number(item.subTypeOfUseId));
            if (match && !item.subTypeOfUseDescription) item.subTypeOfUseDescription = match.description;
            const tInfo = typeMap.get(Number(item.typeOfUseId));
            if (tInfo) {
              if (!item.typeOfUseCode) item.typeOfUseCode = tInfo.code;
              if (!item.typeOfUseDescription) item.typeOfUseDescription = tInfo.description;
            }
          });

          const missingSubTypes = subTypes.filter((sub: SubTypeOfUseResponse) =>
            !items.some((item: UseFactorCVMaster) =>
              Number(item.subTypeOfUseId) === Number(sub.id) &&
              (!yearRangeParam || Number(item.yearRangeCVId) === Number(yearRangeParam)) &&
              (!safeTypeOfUseId || Number(item.typeOfUseId) === Number(safeTypeOfUseId))
            )
          );

          if (missingSubTypes.length > 0) {
            const newPlaceholderItems: UseFactorCVMaster[] = missingSubTypes.map((sub: SubTypeOfUseResponse) => {
              const targetTypeId = Number(sub.typeOfUseId || safeTypeOfUseId || 0);
              const tInfo = typeMap.get(targetTypeId);
              return {
                id: 0,
                typeOfUseId: targetTypeId,
                subTypeOfUseId: sub.id,
                subTypeOfUseDescription: sub.description || "",
                factor: 0,
                yearRangeCVId: yearRangeParam ? Number(yearRangeParam) : (items[0]?.yearRangeCVId || 1),
                isActive: sub.isActive ?? true,
                typeOfUseCode: tInfo?.code || items[0]?.typeOfUseCode || "",
                typeOfUseDescription: tInfo?.description || items[0]?.typeOfUseDescription || "",
              };
            });
            response.data.items = [...items, ...newPlaceholderItems];
          }
        }
      } catch (subErr) {
        const logger = createLogger('fetchUseFactorCVMasterPaged');
        logger.warn('Failed to attach AmsAssetSubTypeOfUse records to UseCategory screen', { safeTypeOfUseId }, subErr instanceof Error ? subErr : new Error(String(subErr)));
      }
    }

    if (validSortBy || validSortOrder) {
      response.data.items.sort((a: UseFactorCVMaster, b: UseFactorCVMaster) => {
        let cmp = 0;
        if (validSortBy === "TypeOfUseCode") cmp = (a.typeOfUseCode || "").localeCompare(b.typeOfUseCode || "");
        else if (validSortBy === "TypeOfUseDescription") cmp = (a.typeOfUseDescription || "").localeCompare(b.typeOfUseDescription || "");
        else if (validSortBy === "TypeOfUseId") cmp = (Number(a.typeOfUseId) || 0) - (Number(b.typeOfUseId) || 0);
        else if (validSortBy === "SubTypeOfUseDescription") cmp = (a.subTypeOfUseDescription || "").localeCompare(b.subTypeOfUseDescription || "");
        else if (validSortBy === "SubTypeOfUseId") cmp = (Number(a.subTypeOfUseId) || 0) - (Number(b.subTypeOfUseId) || 0);
        else if (validSortBy === "FromYear" || validSortBy === "YearRangeCVId") cmp = (Number(a.yearRangeCVId) || 0) - (Number(b.yearRangeCVId) || 0);
        else if (validSortBy === "IsActive") cmp = (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1);
        return validSortOrder === "desc" ? -cmp : cmp;
      });
    }

    const totalCombinedCount = response.data.items.length;
    if (pageSize > 0 && pageSize !== -1) {
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      response.data.items = response.data.items.slice(startIndex, endIndex);
      response.data.totalCount = totalCombinedCount;
      response.data.totalPages = Math.ceil(totalCombinedCount / pageSize) || 1;
    } else {
      response.data.totalCount = totalCombinedCount;
      response.data.totalPages = 1;
    }

    return response.data;
  } catch (error: unknown) {
    const logger = createLogger('fetchUseFactorCVMasterPaged');
    if (error instanceof ApiError) {
      logger.error('Failed to fetch UseFactorCVMaster records', { operation: 'fetchUseFactorCVMasterPagedServerAction', statusCode: error.statusCode, pageNumber, pageSize }, error);
    } else if (error instanceof Error) {
      logger.error('Failed to fetch UseFactorCVMaster records', { operation: 'fetchUseFactorCVMasterPagedServerAction', pageNumber, pageSize }, error);
    }
    throw error;
  }
}

/**
 * Update UseFactorCVMaster record
 */
export async function updateUseFactorCVMasterAction(
  id: number,
  payload: Omit<UseFactorCVMasterUpdate, 'updatedBy'>
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    const finalPayload: UseFactorCVMasterUpdate = { ...payload, updatedBy: userId };
    await updateUseFactorCVMaster(id, finalPayload);

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/sub-type-weightage`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('updateUseFactorCVMaster');
    logger.error('Failed to update UseFactorCVMaster', { operation: 'updateUseFactorCVMasterAction', id }, error);

    if (error instanceof ApiError) {
      return { success: false, message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'), statusCode: error.statusCode };
    }
    return { success: false, message: cleanErrorMessage(error instanceof Error ? error.message : "Failed to update record", "Failed to update record"), statusCode: 500 };
  }
}

/**
 * Create UseFactorCVMaster record
 */
export async function createUseFactorCVMasterAction(
  payload: Omit<UseFactorCVMasterCreate, 'createdBy'>
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    const finalPayload: UseFactorCVMasterCreate = { ...payload, createdBy: userId };
    const response = await createUseFactorCVMaster(finalPayload);

    if (response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/sub-type-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      return { success: false, message: cleanErrorMessage(response.error, 'Failed to create record'), statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('createUseFactorCVMaster');
    logger.error('Failed to create UseFactorCVMaster', { operation: 'createUseFactorCVMasterAction' }, error);

    if (error instanceof ApiError) {
      return { success: false, message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'), statusCode: error.statusCode };
    }
    return { success: false, message: cleanErrorMessage(error instanceof Error ? error.message : 'Unknown error', 'Unknown error'), statusCode: 500 };
  }
}

/**
 * Bulk Create UseFactorCVMaster records
 */
export async function bulkCreateUseFactorCVMasterAction(
  payload: Array<Omit<UseFactorCVMasterCreate, 'createdBy'>>
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    const finalPayload: BulkUseFactorCVMasterCreate = payload.map(item => ({ ...item, createdBy: userId }));
    const response = await bulkCreateUseFactorCVMaster(finalPayload);

    if (response && response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/sub-type-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      return { success: false, message: cleanErrorMessage(response?.error, 'Failed to bulk create records'), statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('bulkCreateUseFactorCVMaster');
    logger.error('Failed to bulk create UseFactorCVMaster', { operation: 'bulkCreateUseFactorCVMasterAction', count: payload.length }, error);

    if (error instanceof ApiError) {
      return { success: false, message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'), statusCode: error.statusCode };
    }
    return { success: false, message: cleanErrorMessage(error instanceof Error ? error.message : 'Unknown error', 'Unknown error'), statusCode: 500 };
  }
}

/**
 * Bulk Update UseFactorCVMaster records
 */
export async function bulkUpdateUseFactorCVMasterAction(
  payload: Array<{ id: number; data: Omit<UseFactorCVMasterUpdate, 'updatedBy'> }>
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return { success: false, message: "you are unauthorized", statusCode: 401 };
    }
    const finalPayload: BulkUseFactorCVMasterUpdate = payload.map(item => ({
      id: item.id,
      data: { ...item.data, updatedBy: userId },
    }));

    await bulkUpdateUseFactorCVMaster(finalPayload);

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/sub-type-weightage`, "page");
    }

    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('bulkUpdateUseFactorCVMaster');
    logger.error('Failed to bulk update UseFactorCVMaster', { operation: 'bulkUpdateUseFactorCVMasterAction', count: payload.length }, error);

    if (error instanceof ApiError) {
      return { success: false, message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'), statusCode: error.statusCode };
    }
    return { success: false, message: cleanErrorMessage(error instanceof Error ? error.message : "Failed to bulk update", "Failed to bulk update"), statusCode: 500 };
  }
}

/**
 * Fetch paginated TypeOfUse records with filtering and sorting
 */
export async function fetchTypeOfUsePaged(
  params: TypeOfUseQueryParams
): Promise<PagedResponse<UseType>> {
  try {
    const allowedSortColumns = [
      "AssetCategoryId",
      "AssetTypeId",
      "TypeOfUseGroupId",
      "TypeOfUseGroupCVId",
      "TypeOfUseCode",
      "Description",
      "Type",
      "SearchSequence",
      "IsActive",
      "MarkedForDeletion",
    ];
    const validSortBy = params.sortBy && allowedSortColumns.includes(params.sortBy) ? params.sortBy : undefined;
    const validSortOrder = params.sortOrder && ["asc", "desc"].includes(params.sortOrder.toLowerCase()) ? (params.sortOrder.toLowerCase() as "asc" | "desc") : undefined;

    const response = await getTypeOfUseWithParams({
      ...params,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    });

    if (!response.success || !response.data) {
      const { getTranslations } = await import('next-intl/server');
      const t = await getTranslations('assetWeightageMaster.subType');
      throw new Error(response.error || t('errors.fetchTypeOfUseFailed'));
    }

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

    return { ...response.data, items: mappedItems };
  } catch (error: unknown) {
    const logger = createLogger('fetchTypeOfUsePaged');
    logger.error('Failed to fetch TypeOfUse records', { operation: 'fetchTypeOfUsePaged', hasParams: !!params }, error);
    throw error;
  }
}
