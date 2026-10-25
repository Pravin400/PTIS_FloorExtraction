
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { locales } from "@/i18n/config";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import {
  getFloorFactorCVMasterWithPagination,
  getFloorFactorCVMasterById,
  updateFloorFactorCVMaster,
  bulkCreateFloorWeightageCv,
  bulkUpdateFloorFactorCVMaster,
  deleteFloorFactorCVMasterById,
} from "@/lib/api/floor-cv-weightageMaster.service";
import { ApiError } from "@/lib/utils/api";
import {
  FloorFactorCVMaster,
  FloorFactorCVMasterCreateAction,
  FloorFactorCVMasterUpdateAction,
  BulkFloorFactorCVMasterCreateAction,
  BulkFloorFactorCVMasterUpdateAction,
} from "@/types/floor-cv-weightageMaster.types";
import { createFloorWeightageCv } from '@/lib/api/floor-cv-weightageMaster.service';
import { PagedResponse } from "@/types/common.types";
import { createLogger } from "@/lib/utils/server-logger";

/**
 * Fetch paginated FloorFactorCVMaster records with filtering and sorting
 */
export async function fetchFloorFactorCVMasterPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  selectedYearRange?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<FloorFactorCVMaster>> {
  try {
    const MAX_PAGE_SIZE = 100;
    const MAX_PAGE_NUMBER = 10000;
    if (
      pageNumber <= 0 ||
      pageSize <= 0 ||
      pageSize > MAX_PAGE_SIZE ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      throw new Error("Invalid pagination parameters");
    }

    // Ensure selectedYearRange is not passed if empty
    const yearRangeParam =
      selectedYearRange && selectedYearRange.trim() !== "" ? selectedYearRange : undefined;

    // Whitelist sort columns to prevent injection (API requires PascalCase field names)
    const allowedSortColumns = ["FloorCode", "FloorDescription", "FromYear"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder =
      sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase())
        ? sortOrder.toLowerCase()
        : undefined;

    return await getFloorFactorCVMasterWithPagination(
      pageNumber,
      pageSize,
      searchTerm,
      yearRangeParam,
      validSortBy,
      validSortOrder
    );
  } catch (error: unknown) {
    const logger = createLogger('fetchFloorFactorCVMasterPaged');
    logger.error('Failed to fetch FloorFactorCVMaster records', {
      operation: 'fetchFloorFactorCVMasterPagedServerAction',
      pageNumber,
      pageSize,
    }, error);
    throw error;
  }
}

/**
 * Fetch all FloorFactorCVMaster records (real + placeholder rows for missing
 * Floor/Year combinations) for a given assessment year, unpaginated. Used so
 * "Generate All" can cover every missing combination, not just the current page.
 */
export async function fetchAllFloorFactorCVMasterAction(
  selectedYearRange?: string
): Promise<FloorFactorCVMaster[]> {
  try {
    const yearRangeParam =
      selectedYearRange && selectedYearRange.trim() !== "" ? selectedYearRange : undefined;

    const response = await getFloorFactorCVMasterWithPagination(1, -1, undefined, yearRangeParam);
    return Array.isArray(response.items) ? response.items : [];
  } catch (_error) {
    return [];
  }
}

/**
 * Fetch FloorFactorCVMaster record by ID
 */
export async function fetchFloorFactorCVMasterByIdServerAction(
  id: number
): Promise<{ success: boolean; data?: FloorFactorCVMaster; message?: string; statusCode?: number }> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        message: "Invalid Floor Factor CV Master ID",
        statusCode: 400,
      };
    }
    
    const data = await getFloorFactorCVMasterById(id);
    return { success: true, data };
  } catch (error: unknown) {
    const logger = createLogger('fetchFloorFactorCVMasterById');
    logger.error('Failed to fetch FloorFactorCVMaster by ID', {
      operation: 'fetchFloorFactorCVMasterByIdServerAction',
      id,
    }, error);
    
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText || 'API Error occurred',
        statusCode: error.statusCode,
      };
    }
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to fetch record",
      statusCode: 500,
    };
  }
}

/**
 * Update FloorFactorCVMaster record
 */
export async function updateFloorFactorCVMasterAction(
  id: number,
  payload: FloorFactorCVMasterUpdateAction
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
 
    
    // Validate inputs before calling service
    if (!id || id <= 0) {
      const logger = createLogger('updateFloorFactorCVMaster');
      logger.warn('Invalid Floor Factor CV Master ID provided', { operation: 'updateFloorFactorCVMasterAction', id });
      return {
        success: false,
        message: 'Invalid Floor Factor CV Master ID',
        statusCode: 400,
      };
    }

    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    const updatePayload = {
      ...payload,
      updatedBy: userId
    };

    await updateFloorFactorCVMaster(id, updatePayload);
    // Revalidate all locale variants of the weightage master page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
    }
    
   
    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('updateFloorFactorCVMaster');
    logger.error('Failed to update FloorFactorCVMaster', { operation: 'updateFloorFactorCVMasterAction', id }, error);
    
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
 * Create FloorFactorCVMaster record
 */
export async function createFloorFactorCVMasterAction(
  payload: FloorFactorCVMasterCreateAction
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    const createPayload = {
      ...payload,
      createdBy: userId
    };

    const response = await createFloorWeightageCv(createPayload);
    if (response.success) {
      // Optionally revalidate paths if needed
      for (const locale of locales) {
        revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
      }
      return { success: true, data: response.data };
    } else {
      return { success: false, message: response.error || 'Failed to create record', statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('createFloorFactorCVMaster');
    logger.error('Failed to create FloorFactorCVMaster', { operation: 'createFloorFactorCVMasterAction' }, error);
    
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText || 'API Error occurred',
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    };
  }
}

/**
 * Bulk Create FloorFactorCVMaster records
 */
export async function bulkCreateFloorFactorCVMasterAction(
  payload: BulkFloorFactorCVMasterCreateAction
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
      const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    const bulkCreatePayload = payload.map(item => ({
      ...item,
      createdBy: userId
    }));

    const response = await bulkCreateFloorWeightageCv(bulkCreatePayload);
    if (response && response.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
      }
      return { success: true, data: response.data };
    } else {
      return { success: false, message: response?.error || 'Failed to bulk create records', statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('bulkCreateFloorFactorCVMaster');
    logger.error('Failed to bulk create FloorFactorCVMaster', { operation: 'bulkCreateFloorFactorCVMasterAction', count: payload.length }, error);
    
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText || 'API Error occurred',
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    };
  }
}

/**
 * Bulk Update FloorFactorCVMaster records
 */
export async function bulkUpdateFloorFactorCVMasterAction(
  payload: BulkFloorFactorCVMasterUpdateAction
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

    await bulkUpdateFloorFactorCVMaster(bulkUpdatePayload);

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
    }
    
    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('bulkUpdateFloorFactorCVMaster');
    logger.error('Failed to bulk update FloorFactorCVMaster', { operation: 'bulkUpdateFloorFactorCVMasterAction', count: payload.length }, error);
    
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText || 'API Error occurred',
        statusCode: error.statusCode,
      };
    }
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to bulk update",
      statusCode: 500,
    };
  }
}

/**
 * Delete FloorFactorCVMaster record by ID
 * @param id The ID of the record to delete
 * @returns Promise resolving to an object indicating success or failure
 */

export async function deleteFloorFactorCVMasterActionById(
    id: number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    try {
        const response = await deleteFloorFactorCVMasterById(id);
        if (response.success) {
            for (const locale of locales) {
                revalidatePath(`/${locale}/property-tax/weightage-master`, "page");
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
