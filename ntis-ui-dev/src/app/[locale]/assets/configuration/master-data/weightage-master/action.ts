
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { locales } from "@/i18n/config";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import {
  getFloorFactorCVMasterWithPagination,
  updateFloorFactorCVMaster,
  bulkCreateFloorWeightageCv,
  bulkUpdateFloorFactorCVMaster,
  getAssessmentYearsPagedServerCV,
  getFloorPaged,
} from "@/lib/api/asset-masters/floor-cv-weightageMaster.service";
import { ApiError } from "@/lib/utils/api";
import { cleanErrorMessage } from "@/lib/utils/api-error-handler";
import {
  FloorFactorCVMaster,
  FloorFactorCVMasterCreateAction,
  FloorFactorCVMasterUpdateAction,
  BulkFloorFactorCVMasterCreateAction,
  BulkFloorFactorCVMasterUpdateAction,
} from "@/types/asset-masters/floor-cv-weightageMaster.types";
import { createFloorWeightageCv } from '@/lib/api/asset-masters/floor-cv-weightageMaster.service';
import { PagedResponse } from "@/types/common.types";
import { createLogger } from "@/lib/utils/server-logger";

// ---------------------------------------------------------------------------
// Shared constants — single source of truth for sort validation
// ---------------------------------------------------------------------------

/** Column names accepted by the API for sorting */
const ALLOWED_SORT_COLUMNS = [
  "FloorId",
  "YearRangeCVId",
  "IsActive",
  "FloorCode",
  "FloorDescription",
  "FromYear",
] as const;

// ---------------------------------------------------------------------------
// Helper — revalidate every locale variant of the page
// ---------------------------------------------------------------------------

function revalidateWeightagePages() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/assets/configuration/master-data/weightage-master`, "page");
  }
}

// ---------------------------------------------------------------------------
// Helper — get authenticated userId or return 401 result
// ---------------------------------------------------------------------------

async function getAuthenticatedUserId(): Promise<
  { userId: number } | { error: { success: false; message: string; statusCode: 401 } }
> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) {
    return {
      error: {
        success: false,
        message: "Unauthorized: Unable to identify user",
        statusCode: 401,
      },
    };
  }
  return { userId };
}

// ---------------------------------------------------------------------------
// Fetch (read)
// ---------------------------------------------------------------------------

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

    // Whitelist-validate and map sort columns to API allowed fields (FloorId, YearRangeCVId, IsActive)
    let validSortBy: string | undefined =
      sortBy && (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortBy) ? sortBy : undefined;

    if (validSortBy === "FloorCode" || validSortBy === "FloorDescription") {
      validSortBy = "FloorId";
    } else if (validSortBy === "FromYear") {
      validSortBy = "YearRangeCVId";
    }

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

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update FloorFactorCVMaster record
 */
export async function updateFloorFactorCVMasterAction(
  id: number,
  payload: FloorFactorCVMasterUpdateAction
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    if (!id || id <= 0) {
      const logger = createLogger('updateFloorFactorCVMaster');
      logger.warn('Invalid Floor Factor CV Master ID provided', { operation: 'updateFloorFactorCVMasterAction', id });
      return {
        success: false,
        message: 'Invalid Floor Factor CV Master ID',
        statusCode: 400,
      };
    }

    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) return authResult.error;
    const { userId } = authResult;

    const updatePayload = { ...payload, updatedBy: userId };

    await updateFloorFactorCVMaster(id, updatePayload);
    revalidateWeightagePages();

    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('updateFloorFactorCVMaster');
    logger.error('Failed to update FloorFactorCVMaster', { operation: 'updateFloorFactorCVMasterAction', id }, error);

    if (error instanceof ApiError) {
      return {
        success: false,
        message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'),
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: cleanErrorMessage(error instanceof Error ? error.message : "Failed to update record", "Failed to update record"),
      statusCode: 500,
    };
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create FloorFactorCVMaster record
 */
export async function createFloorFactorCVMasterAction(
  payload: FloorFactorCVMasterCreateAction
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) return authResult.error;
    const { userId } = authResult;

    const createPayload = { ...payload, createdBy: userId };

    const response = await createFloorWeightageCv(createPayload);
    if (response.success) {
      revalidateWeightagePages();
      return { success: true, data: response.data };
    } else {
      return { success: false, message: cleanErrorMessage(response.error, 'Failed to create record'), statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('createFloorFactorCVMaster');
    logger.error('Failed to create FloorFactorCVMaster', { operation: 'createFloorFactorCVMasterAction' }, error);

    if (error instanceof ApiError) {
      return {
        success: false,
        message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'),
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: cleanErrorMessage(error instanceof Error ? error.message : 'Unknown error', 'Unknown error'),
      statusCode: 500,
    };
  }
}

// ---------------------------------------------------------------------------
// Bulk Create
// ---------------------------------------------------------------------------

/**
 * Bulk Create FloorFactorCVMaster records
 */
export async function bulkCreateFloorFactorCVMasterAction(
  payload: BulkFloorFactorCVMasterCreateAction
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) return authResult.error;
    const { userId } = authResult;

    const bulkCreatePayload = payload.map(item => ({ ...item, createdBy: userId }));

    const response = await bulkCreateFloorWeightageCv(bulkCreatePayload);
    if (response && response.success) {
      revalidateWeightagePages();
      return { success: true, data: response.data };
    } else {
      return { success: false, message: cleanErrorMessage(response?.error, 'Failed to bulk create records'), statusCode: 500 };
    }
  } catch (error: unknown) {
    const logger = createLogger('bulkCreateFloorFactorCVMaster');
    logger.error('Failed to bulk create FloorFactorCVMaster', { operation: 'bulkCreateFloorFactorCVMasterAction', count: payload.length }, error);

    if (error instanceof ApiError) {
      return {
        success: false,
        message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'),
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: cleanErrorMessage(error instanceof Error ? error.message : 'Unknown error', 'Unknown error'),
      statusCode: 500,
    };
  }
}

// ---------------------------------------------------------------------------
// Bulk Update
// ---------------------------------------------------------------------------

/**
 * Bulk Update FloorFactorCVMaster records
 */
export async function bulkUpdateFloorFactorCVMasterAction(
  payload: BulkFloorFactorCVMasterUpdateAction
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) return authResult.error;
    const { userId } = authResult;

    const bulkUpdatePayload = payload.map(item => ({
      ...item,
      data: { ...item.data, updatedBy: userId },
    }));

    await bulkUpdateFloorFactorCVMaster(bulkUpdatePayload);
    revalidateWeightagePages();

    return { success: true };
  } catch (error: unknown) {
    const logger = createLogger('bulkUpdateFloorFactorCVMaster');
    logger.error('Failed to bulk update FloorFactorCVMaster', { operation: 'bulkUpdateFloorFactorCVMasterAction', count: payload.length }, error);

    if (error instanceof ApiError) {
      return {
        success: false,
        message: cleanErrorMessage(error.responseText || error.message, 'API Error occurred'),
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: cleanErrorMessage(error instanceof Error ? error.message : "Failed to bulk update", "Failed to bulk update"),
      statusCode: 500,
    };
  }
}

// ---------------------------------------------------------------------------
// Dropdown helpers — wraps service calls as Server Actions
// ---------------------------------------------------------------------------

/**
 * Fetch paginated AssessmentYears for dropdown (Floor CV Weightage)
 */
export async function fetchAssessmentYearsPagedAction(
  pageNumber: number,
  pageSize: number
) {
  try {
    return await getAssessmentYearsPagedServerCV(pageNumber, pageSize);
  } catch (error: unknown) {
    const logger = createLogger('fetchAssessmentYearsPaged');
    logger.error('Failed to fetch Assessment Years', {
      operation: 'fetchAssessmentYearsPagedAction',
      pageNumber,
      pageSize,
    }, error);
    throw error;
  }
}

/**
 * Fetch paginated Floor records for dropdown
 */
export async function fetchFloorPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
) {
  try {
    return await getFloorPaged(pageNumber, pageSize, searchTerm);
  } catch (error: unknown) {
    const logger = createLogger('fetchFloorPaged');
    logger.error('Failed to fetch Floor records', {
      operation: 'fetchFloorPagedAction',
      pageNumber,
      pageSize,
    }, error);
    throw error;
  }
}