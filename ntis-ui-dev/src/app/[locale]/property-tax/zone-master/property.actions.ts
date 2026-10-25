"use server";

import { getPropertiesByWard, getPropertyCountByWard, createProperty, createBulkProperties, createPropertyRange, getNextPropertyNumber, searchPropertiesByCategory } from "@/lib/api/zone-property.service";
import { getPropertyCategories } from "@/lib/api/property-category.service";
import { getPropertyTypesPaged } from "@/lib/api/property-type-crud.service";
import { getTaxZonePagedServer } from "@/lib/api/taxZoning/taxzoning.service";
import { ZonePropertyItem, ZonePropertyListResponse } from "@/types/zone-master/properties/zoneProperty.types";
import { PropertyCategory, CreatePropertyPayload, BulkCreatePropertyPayload } from "@/types/property-category.types";
import { PropertyRangeCreatePayload, PropertyRangeCreateResponse } from "@/types/zone-master/properties/property-range.types";
import { PropertyType } from "@/types/property-type.types";
import { TaxZone } from "@/types/taxzoning.types";
import { ApiError } from "@/lib/utils/api";
import { isBackendErrorMessage, getErrorStatusCode } from "@/lib/utils/backend-error-detection";
import { createLogger } from "@/lib/utils/server-logger";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { getTranslations } from "next-intl/server";

const logger = createLogger("property-tax/zone-master/property.actions");

function excludeMarkedForDeletion(items: ZonePropertyItem[]): ZonePropertyItem[] {
  return items.filter((item) => item.markedForDeletion !== true);
}

/* ===================================================================================
   HELPER FUNCTIONS
   =================================================================================== */

async function getCurrentUserId(): Promise<number> {
  const cookieStore = await cookies();
  return getUserIdFromCookies(cookieStore) ?? 0;
}

/* ===================================================================================
   PROPERTY ACTIONS
   =================================================================================== */

/**
 * Fetches paginated properties for a specific ward.
 * Used by page.tsx for SSR data fetching.
 */
export async function fetchPropertiesPagedAction(
  pageNumber: number,
  pageSize: number,
  wardId: number,
  searchTerm?: string
): Promise<ZonePropertyListResponse> {
  try {
    // Basic validation with upper bounds
    const MAX_PAGE_SIZE = 100;
    const MAX_PAGE_NUMBER = 10000;

    if (
      !Number.isFinite(pageNumber) ||
      !Number.isFinite(pageSize) ||
      pageNumber <= 0 ||
      pageSize <= 0 ||
      pageSize > MAX_PAGE_SIZE ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      throw new ApiError(400, "Invalid pagination parameters", "Validation failed");
    }

    if (!Number.isFinite(wardId) || wardId <= 0) {
      throw new ApiError(400, "Invalid ward ID", "Validation failed");
    }

    const result = await searchPropertiesByCategory(pageNumber, pageSize, wardId, searchTerm);
    const visibleItems = excludeMarkedForDeletion(result.items || []);

    return {
      ...result,
      items: visibleItems,
      totalCount: result.totalCount === result.items.length ? visibleItems.length : result.totalCount,
      totalPages:
        result.totalCount === result.items.length
          ? Math.ceil(visibleItems.length / pageSize)
          : result.totalPages,
    };
  } catch (error: unknown) {
    // Log the error for debugging using centralized logger
    if (error instanceof ApiError) {
      logger.error(`[fetchPropertiesPagedAction] API Error ${error.statusCode}`, {
        error,
        statusCode: error.statusCode,
        responseText: error.responseText,
        contextMessage: error.contextMessage,
      });
    } else if (error instanceof Error) {
      logger.error("[fetchPropertiesPagedAction] Error", {
        error,
        message: error.message,
        stack: error.stack,
      });
    } else {
      logger.error("[fetchPropertiesPagedAction] Unknown error", {
        error: error as Error,
      });
    }

    // Re-throw the error so Next.js error boundary can catch it
    throw error;
  }
}

/**
 * Fetches properties with all parameters for a specific ward.
 */
export async function getPropertiesByWardAction({
  wardId,
  page = 1,
  pageSize = 10,
  searchTerm = "",
}: {
  wardId: number;
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}) {
  try {
    const result = await getPropertiesByWard(page, pageSize, wardId, searchTerm || undefined);
    const visibleItems = excludeMarkedForDeletion(result.items || []);

    return {
      success: true,
      data: {
        ...result,
        items: visibleItems,
        totalCount: result.totalCount === result.items.length ? visibleItems.length : result.totalCount,
        totalPages:
          result.totalCount === result.items.length
            ? Math.ceil(visibleItems.length / pageSize)
            : result.totalPages,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      const statusCode = isBackendErrorMessage(error.responseText)
        ? getErrorStatusCode(error.responseText)
        : error.statusCode;
      return {
        success: false,
        error: error.responseText,
        statusCode,
      };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch properties." };
  }
}

/**
 * Fetches total count of properties for a specific ward.
 */
export async function getPropertyTotalCountAction(wardId: number) {
  try {
    const count = await getPropertyCountByWard(wardId);
    return { success: true, data: count };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.responseText,
        statusCode: error.statusCode,
      };
    }
    return { success: false, data: 0 };
  }
}

/**
 * Fetches property categories for display mapping.
 * Uses PropertyCategory (not PropertyTypeCategory) for the main property dropdown.
 */
export async function fetchPropertyCategoriesAction(): Promise<{
  success: boolean;
  data?: PropertyCategory[];
  error?: string;
}> {
  try {
    const categories = await getPropertyCategories();
    return { success: true, data: categories };
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("[fetchPropertyCategoriesAction] API Error", {
        error,
        statusCode: error.statusCode,
      });
      return { success: false, error: error.responseText };
    }
    if (error instanceof Error) {
      logger.error("[fetchPropertyCategoriesAction] Error", {
        error,
        message: error.message,
      });
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch categories" };
  }
}

/* ===================================================================================
   PROPERTY CREATION LOOKUP ACTIONS
   =================================================================================== */

/**
 * Fetches all property types for dropdown using PageSize=-1.
 */
export async function fetchPropertyTypesAction(): Promise<{
  success: boolean;
  data?: PropertyType[];
  error?: string;
}> {
  try {
    const response = await getPropertyTypesPaged(1, -1);
    // Filter only active property types
    const activeTypes = response.items.filter((pt) => pt.isActive);
    return { success: true, data: activeTypes };
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("[fetchPropertyTypesAction] API Error", {
        error,
        statusCode: error.statusCode,
      });
      return { success: false, error: error.responseText };
    }
    if (error instanceof Error) {
      logger.error("[fetchPropertyTypesAction] Error", {
        error,
        message: error.message,
      });
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch property types" };
  }
}

/**
 * Fetches all property categories for dropdown.
 * Note: This uses PropertyCategory (propertyCategoryName), not PropertyTypeCategory
 */
export async function fetchPropertyCategoryListAction(): Promise<{
  success: boolean;
  data?: PropertyCategory[];
  error?: string;
}> {
  try {
    const categories = await getPropertyCategories();
    // Filter only active categories
    const activeCategories = categories.filter((c) => c.isActive);
    return { success: true, data: activeCategories };
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("[fetchPropertyCategoryListAction] API Error", {
        error,
        statusCode: error.statusCode,
      });
      return { success: false, error: error.responseText };
    }
    if (error instanceof Error) {
      logger.error("[fetchPropertyCategoryListAction] Error", {
        error,
        message: error.message,
      });
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch property categories" };
  }
}

/**
 * Fetches all tax zones for dropdown.
 */
export async function fetchTaxZonesAction(): Promise<{
  success: boolean;
  data?: TaxZone[];
  error?: string;
}> {
  try {
    // Fetch all tax zones (use large page size to get all)
    const result = await getTaxZonePagedServer(1, 1000);
    const activeZones = (result.items ?? []).filter((z) => z.isActive);
    return { success: true, data: activeZones };
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("[fetchTaxZonesAction] API Error", {
        error,
        statusCode: error.statusCode,
      });
      return { success: false, error: error.responseText };
    }
    if (error instanceof Error) {
      logger.error("[fetchTaxZonesAction] Error", {
        error,
        message: error.message,
      });
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch tax zones" };
  }
}

/* ===================================================================================
   PROPERTY CREATION ACTIONS
   =================================================================================== */

/**
 * Creates a single property.
 */
export async function createPropertyAction(payload: CreatePropertyPayload): Promise<{
  success: boolean;
  data?: { id: number };
  error?: string;
}> {
  try {
    // Validate required fields
    if (!payload.wardId || !payload.propertyTypeId || !payload.categoryId || !payload.propertyNo) {
      return { success: false, error: "Missing required fields" };
    }

    const result = await createProperty(payload);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("[createPropertyAction] API Error", {
        error,
        statusCode: error.statusCode,
        responseText: error.responseText,
      });
      return {
        success: false,
        error: error.responseText,
      };
    }
    if (error instanceof Error) {
      logger.error("[createPropertyAction] Error", {
        error,
        message: error.message,
      });
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create property" };
  }
}

/**
 * Creates multiple properties in bulk.
 */
export async function createBulkPropertiesAction(payload: BulkCreatePropertyPayload): Promise<{
  success: boolean;
  data?: { count: number };
  error?: string;
}> {
  try {
    // Validate required fields
    if (!payload.wardId || !payload.propertyTypeId || !payload.categoryId || 
        !payload.fromPropertyNo || !payload.toPropertyNo) {
      return { success: false, error: "Missing required fields" };
    }

    // Validate property number range
    const fromNo = parseInt(payload.fromPropertyNo, 10);
    const toNo = parseInt(payload.toPropertyNo, 10);
    
    if (isNaN(fromNo) || isNaN(toNo)) {
      return { success: false, error: "Property numbers must be valid numbers" };
    }
    
    if (fromNo >= toNo) {
      return { success: false, error: "From property number must be less than To property number" };
    }
    
    // Limit bulk creation (inclusive count is toNo - fromNo + 1)
    if (toNo - fromNo >= 1000) {
      return { success: false, error: "Cannot create more than 1000 properties at once" };
    }

    const result = await createBulkProperties(payload);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("[createBulkPropertiesAction] API Error", {
        error,
        statusCode: error.statusCode,
        responseText: error.responseText,
      });
      return {
        success: false,
        error: error.responseText,
      };
    }
    if (error instanceof Error) {
      logger.error("[createBulkPropertiesAction] Error", {
        error,
        message: error.message,
      });
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create properties" };
  }
}

/**
 * Creates properties using the Range API.
 * For single property: rangeFrom === rangeTo (same value)
 * For bulk properties: rangeFrom < rangeTo (creates multiple)
 */
export async function createPropertyRangeAction(
  locale: string,
  payload: PropertyRangeCreatePayload
): Promise<{
  success: boolean;
  data?: PropertyRangeCreateResponse;
  error?: string;
}> {
  const t = await getTranslations({ locale, namespace: "zoneMaster.createProperty.errors" });
  
  try {
    // Validate required fields
    if (!payload.rangeFrom || !payload.rangeTo) {
      return { success: false, error: t("rangeFromToRequired") };
    }

    if (!payload.template.wardId || !payload.template.propertyTypeId || !payload.template.categoryId) {
      return { success: false, error: t("wardPropertyTypeCategoryRequired") };
    }

    // Validate range for bulk creation
    const fromNo = parseInt(payload.rangeFrom, 10);
    const toNo = parseInt(payload.rangeTo, 10);

    if (isNaN(fromNo) || isNaN(toNo)) {
      return { success: false, error: t("invalidRangeValues") };
    }

    if (fromNo > toNo) {
      return { success: false, error: t("rangeFromMustBeLessOrEqual") };
    }

    // Limit bulk creation to prevent excessive load (inclusive count is toNo - fromNo + 1)
    if (toNo - fromNo >= 1000) {
      return { success: false, error: t("cannotCreateMoreThan1000") };
    }

    // Get authenticated user ID and inject into template
    const userId = await getCurrentUserId();
    payload.template.createdBy = userId;

    const result = await createPropertyRange(payload);
    
    // Check if there were any failures
    if (result.failedCount > 0 && result.successCount === 0) {
      return {
        success: false,
        error: t("allPropertiesFailed", { count: result.failedCount }),
        data: result,
      };
    }

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("[createPropertyRangeAction] API Error", {
        error,
        statusCode: error.statusCode,
        responseText: error.responseText,
      });
      return {
        success: false,
        error: error.responseText,
      };
    }
    if (error instanceof Error) {
      logger.error("[createPropertyRangeAction] Error", {
        error,
        message: error.message,
      });
      return { success: false, error: error.message };
    }
    return { success: false, error: t("createPropertyRangeFailed") };
  }
}

/**
 * Gets the next available property number for a ward.
 * Used by CreatePropertyDrawer to pre-populate property number fields.
 * SSR-safe action that can be called from page.tsx.
 */
export async function getNextPropertyNumberAction(wardId: number): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    // Validate ward ID
    if (!Number.isFinite(wardId) || wardId <= 0) {
      return { success: false, error: "Invalid ward ID" };
    }

    const nextNumber = await getNextPropertyNumber(wardId);
    return { success: true, data: nextNumber };
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("[getNextPropertyNumberAction] API Error", {
        error,
        statusCode: error.statusCode,
        responseText: error.responseText,
      });
      return {
        success: false,
        error: error.responseText,
      };
    }
    if (error instanceof Error) {
      logger.error("[getNextPropertyNumberAction] Error", {
        error,
        message: error.message,
      });
      return { success: false, error: error.message };
    }
    // Default to "1" if fetching fails - safe fallback
    return { success: true, data: "1" };
  }
}
