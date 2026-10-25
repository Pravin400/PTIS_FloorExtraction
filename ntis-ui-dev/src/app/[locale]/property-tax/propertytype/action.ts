"use server";
import { cookies } from "next/headers";
import { getUseTypesPagedServer } from "@/lib/api/typeofusemaster.service";
import type { UseType } from "@/types/typeOfUse.types";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { createPropertyType, getPropertyTypesPaged, getPropertyTypeById, updatePropertyType, purgeDeletePropertyType } from "@/lib/api/property-type-crud.service";
import { 
  getPropertyTypeAndTypeOfUseValidation, 
  updatePropertyTypeValidations
} from "@/lib/api/property-type-validation-mapping.service";
import { getPropertyTypeCategories } from "@/lib/api/property-type-category.service";
import { ApiError } from "@/lib/utils/api";
import { PropertyType, PropertyTypeFormModel, PropertyTypeAndTypeOfUseValidation } from "@/types/property-type.types";
import { PropertyTypeCategory } from "@/types/property-type-category.types";
import { PagedResponse } from "@/types/common.types";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { 
  PROPERTY_TYPE_ERROR_CODES, 
  PROPERTY_TYPE_SEARCH_MAX_RECORDS 
} from "@/lib/constants/property-type-error-codes";

/**
 * SSR action to fetch all TypeOfUse (for PropertyTypeForm)
 * Uses -1 pageSize to fetch all records without pagination limit
 * 
 * Business context: Type of Use master needs all records for form selection
 */
export async function getTypeOfUseListAction(): Promise<UseType[]> {
  try {
    // Use -1 to fetch all records without pagination
    // The backend API interprets -1 as "return all records"
    const result = await getUseTypesPagedServer({ pageNumber: 1, pageSize: -1 });
    return result.items;
  } catch (error) {
    throw error; // Rethrow so UI can distinguish between 'no data' and 'failed to load'
  }
}

export async function fetchPropertyTypePagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<PropertyType>> {
  try {
    // Basic validation with upper bounds
    const MAX_PAGE_SIZE = 100;
    const MAX_PAGE_NUMBER = 10000;
    if (
      !Number.isFinite(pageNumber) ||
      !Number.isFinite(pageSize) ||
      pageNumber <= 0 ||
      (pageSize <= 0 && pageSize !== -1) ||
      pageSize > MAX_PAGE_SIZE ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      throw new ApiError(400, "Invalid pagination parameters", "Validation failed");
    }

    // Validate sortBy against allowed columns to prevent injection
    const allowedSortColumns = ["propertyDescription", "descriptionEnglish", "propertyDescriptionEnglish", "type", "propertyTypeGroup"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder = sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : undefined;

    const result = await getPropertyTypesPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
    return result;
  } catch (error: unknown) {
    // Re-throw the error so Next.js error boundary can catch it
    throw error;
  }
}

export async function createPropertyTypeAction(
  data: PropertyTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number; createdId?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    const createdPropertyType = await createPropertyType(data, userId);
    
    // Revalidate all locale variants of the property type page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/propertytype`, "page");
    }
    
    // If API returned the created entity with ID, use it directly
    if (createdPropertyType?.id) {
      return { success: true, createdId: createdPropertyType.id };
    }

    /**
     * FALLBACK SEARCH LOGIC
     *
     * This fallback is needed because the API currently does not always return
     * the created entity ID in the response. The search approach has drawbacks:
     *
     * 1. Performance: Additional API call with search overhead
     * 2. Race condition: Another identical record could match first
     * 3. Reliability: Search might fail, leaving the ID unknown
     *
     * RECOMMENDED: The API should be updated to always return the created entity
     * ID in the POST response. Once the API is updated, this fallback can be removed.
     *
     * See: Backend endpoint POST /PropertyTypeMaster should return { id: number }
     */
    try {
      const searchResult = await getPropertyTypesPaged(1, PROPERTY_TYPE_SEARCH_MAX_RECORDS, data.propertyDescription.trim());
      const match = searchResult.items.find(
        (item) =>
          item.propertyDescription === data.propertyDescription.trim() &&
          item.type === data.type.trim()
      );
      if (match?.id) {
        return { success: true, createdId: match.id };
      }
      // Fallback search found no exact match; still return success
    } catch (_searchError) {
      // Fallback search failed; still return success
    }
    
    // Property type created but couldn't retrieve ID - still success
    // Type of use validations won't be saved, but core entity is created
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: PROPERTY_TYPE_ERROR_CODES.CREATE_FAILED };
  }
}

/* ================= UPDATE ================= */
export async function updatePropertyTypeAction(
  data: PropertyTypeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    await updatePropertyType(data, userId);
    // Revalidate all locale variants of the property type page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/propertytype`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: PROPERTY_TYPE_ERROR_CODES.UPDATE_FAILED };
  }
}

export async function deletePropertyTypeAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const rawId = formData.get("id");
  const id =
    typeof rawId === "string" ? parseInt(rawId, 10) : 0;

  if (!id || id <= 0) {
    return {
      success: false,
      message: PROPERTY_TYPE_ERROR_CODES.INVALID_PROPERTY_TYPE_ID,
      statusCode: 400,
    };
  }

  try {
    // Purge the property type master record
    await purgeDeletePropertyType(id);

    // Revalidate all locale variants of the property type page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/propertytype`, "page");
    }
    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }

    return {
      success: false,
      message: PROPERTY_TYPE_ERROR_CODES.PURGE_DELETE_FAILED,
    };
  }
}

export async function getPropertyTypeByIdAction(
  id: number
): Promise<PropertyType> {
  try {
    if (!id || id <= 0) {
      throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.INVALID_PROPERTY_TYPE_ID, "Validation failed");
    }
    const result = await getPropertyTypeById(id);
    if (!result) {
      throw new ApiError(404, "Property Type not found", "Not Found");
    }
    return result;
  } catch (error) {
    throw error; // rethrow so UI can handle it
  }
}

export async function getPropertyTypeCategoriesAction(): Promise<PropertyTypeCategory[]> {
  try {
    const result = await getPropertyTypeCategories();
    return result;
  } catch (error) {
    throw error; // rethrow so UI does not treat a load failure as "no categories"
  }
}

// SSR action to fetch PropertyType to TypeOfUse validation mappings
export async function getPropertyTypeAndTypeOfUseValidationAction(): Promise<PropertyTypeAndTypeOfUseValidation[]> {
  try {
    const result = await getPropertyTypeAndTypeOfUseValidation();
    return result;
  } catch (error) {
    throw error; // rethrow so UI does not treat a load failure as 'no validations'
  }
}

// SSR action to fetch validation mappings for specific property type IDs (optimized for list page)
export async function getValidationsByPropertyTypeIdsAction(
  propertyTypeIds: number[]
): Promise<PropertyTypeAndTypeOfUseValidation[]> {
  try {
    if (!propertyTypeIds || propertyTypeIds.length === 0) {
      return [];
    }
    
    // Fetch all validations once and filter client-side
    // This avoids N round-trips for N property types on the page
    const allValidations = await getPropertyTypeAndTypeOfUseValidation();
    
    // Filter to only the requested property type IDs
    const propertyTypeIdSet = new Set(propertyTypeIds);
    return allValidations.filter((v) => propertyTypeIdSet.has(v.propertyTypeId));
  } catch (error) {
    throw error; // rethrow so the UI does not treat load failure as "no mappings"
  }
}

// Action to update TypeOfUse validation mappings for a property type
export async function updatePropertyTypeValidationsAction(
  propertyTypeId: number,
  typeOfUseIds: number[]
): Promise<{ success: boolean; message?: string }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    await updatePropertyTypeValidations(propertyTypeId, typeOfUseIds, userId);
    // Revalidate all locale variants of the property type page
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/propertytype`, "page");
    }
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to update type of use validation" };
  }
}
