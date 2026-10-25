"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import {
  getAgeFactorCVMasterWithParams,
  updateAgeFactorCVMaster,
  createAgeFactorCVMaster,
  deleteAgeFactorCVMaster,
} from "@/lib/api/asset-masters/weightagemaster/ageOfBuildingCvFactor/ageFactorCv.service";
import {
  bulkCreateAgeFactorCVMaster,
  bulkUpdateAgeFactorCVMaster,
  bulkDeleteAgeFactorCVMaster,
} from "@/lib/api/asset-masters/weightagemaster/ageOfBuildingCvFactor/ageFactorCv.bulk.service";

import { ApiError } from "@/lib/utils/api";
import { cleanErrorMessage } from "@/lib/utils/api-error-handler";
import {
  AgeFactorCVMaster,
  AgeFactorCVMasterCreate,
  AgeFactorCVMasterUpdate,
  BulkAgeFactorCVMasterCreate,
  BulkAgeFactorCVMasterUpdate,
  PagedResponse,
} from "@/types/asset-masters/ageFactorCv.types";
import { getAssetConstructionPaged } from "@/lib/api/asset-masters/natureofbuilding-cv-weightageMaster.service";



/**
 * Fetch all AgeFactorCVMaster records to extract unique age ranges
 */
export async function fetchAllAgeFactorsAction(): Promise<AgeFactorCVMaster[]> {
  const PAGE_SIZE = 250;
  const MAX_TOTAL_RECORDS = 10000;

  try {
    const firstPageRes = await getAgeFactorCVMasterWithParams(
      { pageNumber: 1, pageSize: PAGE_SIZE },
      { cache: 'no-store' }
    );

    if (!firstPageRes?.success || !firstPageRes.data) {
      return [];
    }

    const firstItems = Array.isArray(firstPageRes.data.items) ? firstPageRes.data.items : [];
    const totalCount = firstPageRes.data.totalCount ?? firstItems.length;
    const totalPages = Math.min(
      firstPageRes.data.totalPages ?? Math.ceil(totalCount / PAGE_SIZE),
      Math.ceil(MAX_TOTAL_RECORDS / PAGE_SIZE)
    );

    const allItems: AgeFactorCVMaster[] = [...firstItems];

    if (totalPages > 1 && firstItems.length === PAGE_SIZE) {
      const remainingRequests = Array.from({ length: totalPages - 1 }, (_, index) =>
        getAgeFactorCVMasterWithParams(
          { pageNumber: index + 2, pageSize: PAGE_SIZE },
          { cache: 'no-store' }
        )
      );

      const remainingResponses = await Promise.all(remainingRequests);
      for (const res of remainingResponses) {
        if (res?.success && res.data?.items && Array.isArray(res.data.items)) {
          allItems.push(...res.data.items);
        }
      }
    }

    return allItems.slice(0, MAX_TOTAL_RECORDS);
  } catch (_error) {
    return [];
  }
}

/**
 * Fetch paginated AgeFactorCVMaster records with filtering and sorting
 */
export async function fetchAgeFactorCVMasterPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  selectedYearRange?: string,
  constructionTypeId?: number,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AgeFactorCVMaster>> {
  try {
    // Sanitize and clamp pagination parameters to prevent SSR crashes or bad API requests
    const normalizedPageNumber = Math.max(1, Number(pageNumber) || 1);
    const normalizedPageSize = Math.max(1, Math.min(100, Number(pageSize) || 10));

    const yearRangeParam = normalizeYearRangeParam(selectedYearRange);

    const normalizedConstructionTypeId = constructionTypeId !== undefined && Number.isFinite(constructionTypeId)
      ? constructionTypeId
      : undefined;

    const allowedSortFields = ["ConstructionTypeId", "YearRangeCVId", "IsActive", "ConstructionCode", "ConstructionDescription", "AgeFrom", "AgeTo", "FromYear"];
    let normalizedSortBy = allowedSortFields.includes(sortBy?.trim() || "") ? sortBy?.trim() : undefined;
    if (normalizedSortBy === "ConstructionCode" || normalizedSortBy === "ConstructionDescription" || normalizedSortBy === "AgeFrom" || normalizedSortBy === "AgeTo") {
      normalizedSortBy = "ConstructionTypeId";
    } else if (normalizedSortBy === "FromYear") {
      normalizedSortBy = "YearRangeCVId";
    }

    const normalizedSortOrder = ["asc", "desc"].includes(sortOrder?.trim().toLowerCase() || "") ? (sortOrder?.trim().toLowerCase() as "asc" | "desc") : undefined;

    const response = await getAgeFactorCVMasterWithParams({
      pageNumber: normalizedPageNumber,
      pageSize: normalizedPageSize,
      searchTerm,
      yearRangeCVId: yearRangeParam,
      constructionTypeId: normalizedConstructionTypeId,
      sortBy: normalizedSortBy,
      sortOrder: normalizedSortOrder,
    });

    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode || 500, response.error || "Failed to fetch AgeFactorCVMaster records", "Fetch failed");
    }

    const data = response.data;

    return normalizePagedResponse(data, normalizedPageNumber, normalizedPageSize);
  } catch (error: unknown) {
    throw error;
  }
}

/**
 * Update AgeFactorCVMaster record
 */
export async function updateAgeFactorCVMasterAction(
  id: number,
  payload: AgeFactorCVMasterUpdate
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const t = await getTranslations('assetWeightageMaster.age');
    if (!id || id <= 0) {
      return {
        success: false,
        message: t('errors.validIdRequired'),
        statusCode: 400,
      };
    }

    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return {
        success: false,
        message: 'Authentication required',
        statusCode: 401,
      };
    }
    const updatePayload = {
      ...payload,
      updatedBy: userId
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
    await updateAgeFactorCVMaster(id, updatePayload, tService);

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "layout");
      revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'),
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return {
        success: false,
        message: cleanErrorMessage(error.message, 'Failed to update AgeFactorCVMaster'),
        statusCode: 500,
      };
    }
    return {
      success: false,
      message: cleanErrorMessage(error instanceof Error ? error.message : "Failed to update AgeFactorCVMaster", "Failed to update AgeFactorCVMaster"),
      statusCode: 500,
    };
  }
}

/**
 * Create AgeFactorCVMaster record
 */
export async function createAgeFactorCVMasterAction(
  payload: AgeFactorCVMasterCreate
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return {
        success: false,
        message: 'Authentication required',
        statusCode: 401,
      };
    }
    const createPayload = {
      ...payload,
      createdBy: userId
    };

    const t = await getTranslations('assetWeightageMaster.age');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
    const response = await createAgeFactorCVMaster(createPayload, tService);
    if (response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "layout");
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      return { success: false, message: cleanErrorMessage(response.error, 'Failed to create record'), statusCode: 500 };
    }
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'), statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: cleanErrorMessage(error.message, 'Unknown error'), statusCode: 500 };
    }
    return { success: false, message: 'Unknown error', statusCode: 500 };
  }
}

/**
 * Bulk Create AgeFactorCVMaster records
 */
export async function bulkCreateAgeFactorCVMasterAction(
  payload: BulkAgeFactorCVMasterCreate
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return {
        success: false,
        message: 'Authentication required',
        statusCode: 401,
      };
    }
    const bulkCreatePayload = payload.map(item => ({
      ...item,
      createdBy: userId
    }));

    const t = await getTranslations('assetWeightageMaster.age');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
    const response = await bulkCreateAgeFactorCVMaster(bulkCreatePayload, tService);
    if (response && response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "layout");
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      return { success: false, message: cleanErrorMessage(response?.error, 'Failed to bulk create records'), statusCode: 500 };
    }
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'), statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: cleanErrorMessage(error.message, 'Unknown error'), statusCode: 500 };
    }
    return { success: false, message: 'Unknown error', statusCode: 500 };
  }
}

/**
 * Bulk Update AgeFactorCVMaster records
 */
export async function bulkUpdateAgeFactorCVMasterAction(
  payload: BulkAgeFactorCVMasterUpdate
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      return {
        success: false,
        message: 'Authentication required',
        statusCode: 401,
      };
    }
    const bulkUpdatePayload = payload.map(item => ({
      ...item,
      data: {
        ...item.data,
        updatedBy: userId
      }
    }));

    const t = await getTranslations('assetWeightageMaster.age');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
    await bulkUpdateAgeFactorCVMaster(bulkUpdatePayload, tService);

    for (const locale of locales) {
      revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "layout");
      revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage`, "page");
    }

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'), statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: cleanErrorMessage(error.message, 'Failed to bulk update AgeFactorCVMaster'), statusCode: 500 };
    }

    return { success: false, message: "Failed to bulk update AgeFactorCVMaster", statusCode: 500 };
  }
}

/**
 * Delete AgeFactorCVMaster record
 */
export async function deleteAgeFactorCVMasterAction(
  id: number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const t = await getTranslations('assetWeightageMaster.age');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
    const response = await deleteAgeFactorCVMaster(id, tService);
    if (response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "layout");
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage`, "page");
      }
      return { success: true };
    } else {
      return { success: false, message: cleanErrorMessage(response.error, 'Failed to delete record'), statusCode: 500 };
    }
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'), statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: cleanErrorMessage(error.message, 'Unknown error'), statusCode: 500 };
    }
    return { success: false, message: 'Unknown error', statusCode: 500 };
  }
}

/**
 * Bulk Delete AgeFactorCVMaster records
 */
export async function bulkDeleteAgeFactorCVMasterAction(
  ids: number[]
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const t = await getTranslations('assetWeightageMaster.age');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
    const response = await bulkDeleteAgeFactorCVMaster(ids, tService);
    if (response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "layout");
        revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage`, "page");
      }
      return { success: true };
    } else {
      return { success: false, message: cleanErrorMessage(response.error, 'Failed to bulk delete records'), statusCode: 500 };
    }
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'), statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: cleanErrorMessage(error.message, 'Unknown error'), statusCode: 500 };
    }
    return { success: false, message: 'Unknown error', statusCode: 500 };
  }
}


/**
 * Fetch paginated ConstructionType records
 */
export async function fetchConstructionTypePagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<{ id: number; constructionCode: string; description: string; isActive: boolean }>> {
  try {
    return await getAssetConstructionPaged(pageNumber, pageSize, searchTerm);
  } catch (error: unknown) {
    throw error;
  }
}
/**
 * Normalizes the year range parameter from a string to a valid number or undefined
 * @param selectedYearRange The year range string to normalize
 */
function normalizeYearRangeParam(selectedYearRange?: string): number | undefined {
  const trimmed = selectedYearRange?.trim();
  if (!trimmed || trimmed === "") return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Normalizes a paged response with defensive defaults and fallback calculations.
 */
function normalizePagedResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  pageNumber: number,
  pageSize: number
): PagedResponse<AgeFactorCVMaster> {
  const totalCount = data.totalCount ?? 0;
  const totalPages = data.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));
  const normalizedPageNumber = data.pageNumber ?? pageNumber;

  return {
    items: data.items || [],
    totalCount,
    pageNumber: normalizedPageNumber,
    pageSize: data.pageSize ?? pageSize,
    totalPages,
    hasPrevious: data.hasPrevious ?? (normalizedPageNumber > 1),
    hasNext: data.hasNext ?? (normalizedPageNumber < totalPages)
  };
}
