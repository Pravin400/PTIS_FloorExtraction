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
  getAgeFactorCVMasterById,
} from "@/lib/api/weightagemaster/ageOfBuildingCvFactor/ageFactorCv.service";
import {
  bulkCreateAgeFactorCVMaster,
  bulkUpdateAgeFactorCVMaster,
  bulkDeleteAgeFactorCVMaster,
} from "@/lib/api/weightagemaster/ageOfBuildingCvFactor/ageFactorCv.bulk.service";

import { ApiError } from "@/lib/utils/api";
import {
  AgeFactorCVMaster,
  AgeFactorCVMasterCreate,
  AgeFactorCVMasterUpdate,
  BulkAgeFactorCVMasterCreate,
  BulkAgeFactorCVMasterUpdate,
  PagedResponse,
} from "@/types/ageFactorCv.types";
import { ConstructionType } from "@/types/construction.types";
import { getConstructionPaged } from "@/lib/api/constructiontypemaster/construction-crud.service";
import { createLogger } from "@/lib/utils/server-logger";



/**
 * Fetch all AgeFactorCVMaster records to extract unique age ranges
 */
export async function fetchAllAgeFactorsAction(): Promise<AgeFactorCVMaster[]> {
  const PAGE_SIZE = 250;
  const MAX_TOTAL_RECORDS = 10000;

  try {
    const allItems: AgeFactorCVMaster[] = [];
    let pageNumber = 1;

    while (allItems.length < MAX_TOTAL_RECORDS) {
      const response = await getAgeFactorCVMasterWithParams({
        pageNumber,
        pageSize: PAGE_SIZE,
      });

      if (!response?.success || !response.data) {
        break;
      }

      const items = Array.isArray(response.data.items) ? response.data.items : [];

      if (items.length === 0) {
        break;
      }

      allItems.push(...items);

      if (items.length < PAGE_SIZE) {
        break;
      }

      pageNumber += 1;
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
  constructionTypeId?: number | number[],
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AgeFactorCVMaster>> {
  try {
    // Sanitize and clamp pagination parameters to prevent SSR crashes or bad API requests
    const normalizedPageNumber = Math.max(1, Number(pageNumber) || 1);
    const normalizedPageSize = Math.max(1, Math.min(100, Number(pageSize) || 10));

    const yearRangeParam = normalizeYearRangeParam(selectedYearRange);

    const normalizedConstructionTypeId = Array.isArray(constructionTypeId)
      ? (() => {
          const ids = constructionTypeId.filter((id) => Number.isFinite(id));
          return ids.length > 0 ? ids : undefined;
        })()
      : constructionTypeId !== undefined && Number.isFinite(constructionTypeId)
        ? constructionTypeId
        : undefined;

    const allowedSortFields = ["ConstructionCode", "ConstructionDescription", "AgeFrom", "AgeTo", "FromYear"];
    const normalizedSortBy = allowedSortFields.includes(sortBy?.trim() || "") ? sortBy?.trim() : undefined;
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
    const t = await getTranslations('ageFactorMaster');
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
      revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
      revalidatePath(`/${locale}/property-tax/weightage-master/age-weightage`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText || 'API Error occurred',
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return { 
        success: false, 
        message: error.message,
        statusCode: 500,
      };
    }
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to update AgeFactorCVMaster",
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

    const t = await getTranslations('ageFactorMaster');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
    const response = await createAgeFactorCVMaster(createPayload, tService);
    if (response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
        revalidatePath(`/${locale}/property-tax/weightage-master/age-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      return { success: false, message: response.error || 'Failed to create record', statusCode: 500 };
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

    const t = await getTranslations('ageFactorMaster');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
    const response = await bulkCreateAgeFactorCVMaster(bulkCreatePayload, tService);
    if (response && response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
        revalidatePath(`/${locale}/property-tax/weightage-master/age-weightage`, "page");
      }
      return { success: true, data: response.data };
    } else {
      return { success: false, message: response?.error || 'Failed to bulk create records', statusCode: 500 };
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

    const t = await getTranslations('ageFactorMaster');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
    await bulkUpdateAgeFactorCVMaster(bulkUpdatePayload, tService);

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
      revalidatePath(`/${locale}/property-tax/weightage-master/age-weightage`, "page");
    }
    
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText || 'API Error occurred', statusCode: error.statusCode };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message, statusCode: 500 };
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
        const t = await getTranslations('ageFactorMaster');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
        const response = await deleteAgeFactorCVMaster(id, tService);
        if (response.success) {
            for (const locale of locales) {
                revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
                revalidatePath(`/${locale}/property-tax/weightage-master/age-weightage`, "page");
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

/**
 * Bulk Delete AgeFactorCVMaster records
 */
export async function bulkDeleteAgeFactorCVMasterAction(
    ids: number[]
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    try {
        const t = await getTranslations('ageFactorMaster');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tService = (key: string) => t(key as any);
        const response = await bulkDeleteAgeFactorCVMaster(ids, tService);
        if (response.success) {
            for (const locale of locales) {
                revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
                revalidatePath(`/${locale}/property-tax/weightage-master/age-weightage`, "page");
            }
            return { success: true };
        } else {
            return { success: false, message: response.error || 'Failed to bulk delete records', statusCode: 500 };
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


/**
 * Fetch paginated ConstructionType records
 */
export async function fetchConstructionTypePagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<ConstructionType>> {
  try {
    return await getConstructionPaged(pageNumber, pageSize, searchTerm);
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

/**
 * Fetch AgeFactorCVMaster by ID
 */

export async function fetchAgeFactorCVMasterByIdServerAction(id: number) {
  const logger = createLogger('fetchAgeFactorCVMasterById');
  logger.info('Starting request', { operation: 'fetchAgeFactorCVMasterByIdServerAction', id });
  try {
    if (!id || id <= 0) {
      throw new Error("Invalid Age Factor ID");
    }
    const data = await getAgeFactorCVMasterById(id);
    logger.info('Successfully fetched AgeFactorCVMaster by ID', { id });
    return { success: true, data };
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number; status?: number };
    const errorDetails = {
      message: err.message || 'Unknown error occurred',
      stack: err.stack,
      status: err.statusCode || err.status || 500,
    };
    logger.error('Failed to fetch AgeFactorCVMaster by ID', { error: errorDetails });
    return {
      success: false,
      message: err.message || 'Failed to fetch record',
      error: errorDetails,
    };
  }
}

