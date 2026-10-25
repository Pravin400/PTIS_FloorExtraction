"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";
import {
  getCombinePropertiesPaged,
  getPropertyCombineDetails,
  createCombineProperty,
  getCombinePropertiesHistory,
} from "@/lib/api/combine-property/combine-property.service";
import {
  CombinePropertyParams,
  CombinePropertyItem,
  CombinePropertyPayload,
  GetPropertyCombineDetailsParams,
  PropertyCombineDetails,
  GetCombinePropertiesHistoryParams,
} from "@/types/combine-property.types";
import { PagedResponse } from "@/types/common.types";

const logger = createLogger("CombinePropertyAction");

/* ================================================================
   GET ALL (Paged)
   Mandatory: pageNumber, pageSize
   Optional : taxZoneId, wardId, propertyNo, partitionNo,
              searchTerm, sortBy, sortOrder, filterLogic
================================================================ */
export async function fetchCombinePropertiesPagedAction(
  params: CombinePropertyParams
): Promise<PagedResponse<CombinePropertyItem>> {
  try {
    const MAX_PAGE_SIZE = 5000;
    const MAX_PAGE_NUMBER = 10000;

    // pageSize = -1 is a valid special value meaning "return all records"
    const isAllRecords = params.pageSize === -1;

    if (
      !Number.isFinite(params.pageNumber) ||
      !Number.isFinite(params.pageSize) ||
      params.pageNumber <= 0 ||
      (!isAllRecords && (params.pageSize <= 0 || params.pageSize > MAX_PAGE_SIZE)) ||
      params.pageNumber > MAX_PAGE_NUMBER
    ) {
      logger.warn("Invalid pagination parameters", { pageNumber: params.pageNumber, pageSize: params.pageSize });
      return { items: [], totalCount: 0, pageNumber: params.pageNumber, pageSize: params.pageSize, totalPages: 0, hasPrevious: false, hasNext: false };
    }

    const result = await getCombinePropertiesPaged(params);
    return result;
  } catch (error: unknown) {
    logger.error("Error fetching paged combine properties", undefined, error);
    // Throw a simple error message for the error boundary to display
    throw new Error("Failed to load combine properties. Please try again.");
  }
}

/* ================================================================
   GET PROPERTY COMBINE DETAILS
   Mandatory: wardId, propertyNo, partitionNo
================================================================ */
export async function fetchPropertyCombineDetailsAction(
  params: GetPropertyCombineDetailsParams
): Promise<PropertyCombineDetails[]> {
  try {
    if (!Number.isFinite(params.wardId) || params.wardId <= 0) {
      logger.warn("Invalid Ward ID", { wardId: params.wardId });
      return [];
    }
    if (!params.propertyNo?.trim() && !params.partitionNo?.trim()) {
      logger.warn("At least Property No or Partition No is required");
      return [];
    }

    const result = await getPropertyCombineDetails(params);
    return result;
  } catch (error: unknown) {
    logger.error("Error fetching property combine details", undefined, error);
    // Throw a simple error message for better user experience
    throw new Error("Failed to load property details. Please try again.");
  }
}

/* ================================================================
   POST – COMBINE PROPERTIES
   Required from client:
     mainPropertyId     : number
     combinePropertyIds : comma-separated string of property IDs
     remark             : string
   createdBy is read from cookies (userId)
================================================================ */
export async function createCombinePropertyAction(
  payload: Omit<CombinePropertyPayload, "createdBy">
): Promise<{ success: boolean; message?: string; statusCode?: number; data?: unknown }> {
  try {
    // Get userId from cookies
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      logger.warn("Unauthorized: userId not found in cookies");
      return { success: false, message: "Unauthorized", statusCode: 401 };
    }

    // Validate required fields
    if (!Number.isFinite(payload.sourcePropertyId) || payload.sourcePropertyId <= 0) {
      return { success: false, message: "Valid Source Property ID is required", statusCode: 400 };
    }
    if (!payload.combinedPropertyIds?.trim()) {
      return { success: false, message: "Combined Property IDs are required", statusCode: 400 };
    }

    const fullPayload: CombinePropertyPayload = {
      ...payload,
      createdBy: userId,
    };

    const result = (await createCombineProperty(fullPayload)) as Record<string, unknown>;

    // Check if the API returned an explicit failure
    if (result.success === false) {
      const errorMessage = typeof result.message === 'string' ? result.message : 'Combine operation failed';
      return { success: false, message: errorMessage };
    }

    // Revalidate all locale variants of the combine property page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/ptis/combineproperty`, "page");
    }

    const resultData = result as { message?: string; items?: { message?: string } };
    return { success: true, message: resultData?.message || resultData?.items?.message, data: result };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      if (error.statusCode >= 400 && error.statusCode < 500) {
        logger.warn(`Validation failed combining properties: ${error.responseText}`);
      } else {
        logger.error("Error combining properties", undefined, error);
      }
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    logger.error("Unexpected error combining properties", undefined, error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to combine properties" };
  }
}

/* ================================================================
   GET COMBINE PROPERTIES HISTORY
   Optional: sourcePropertyId, wardId, propertyNo, partitionNo, pageNumber, pageSize
================================================================ */
export async function fetchCombinePropertiesHistoryAction(
  params?: GetCombinePropertiesHistoryParams
): Promise<PagedResponse<PropertyCombineDetails>> {
  try {
    if (params?.sourcePropertyId !== undefined && (!Number.isFinite(params.sourcePropertyId) || params.sourcePropertyId <= 0)) {
      logger.warn("Invalid Source Property ID", { sourcePropertyId: params.sourcePropertyId });
      return { items: [], totalCount: 0, pageNumber: params.pageNumber ?? 1, pageSize: params.pageSize ?? 10, totalPages: 0, hasPrevious: false, hasNext: false };
    }

    const safeParams = {
      ...params,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10
    };

    const result = await getCombinePropertiesHistory(safeParams);
    return result;
  } catch (error: unknown) {
    logger.error("Error fetching property combine history", undefined, error);
    // Throw a simple error message for better user experience
    throw new Error("Failed to load combine properties history. Please try again.");
  }
}
