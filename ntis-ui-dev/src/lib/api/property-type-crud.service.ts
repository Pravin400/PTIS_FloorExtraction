import { apiClient } from "@/services/api.service";
import { PropertyType, PropertyTypeFormModel } from "@/types/property-type.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { isPropertyTypeShape, normalizePropertyType } from "./property-type-types-guard";
import {
  validatePropertyTypeId, validateAndPrepareSearchTerm, validateCreateFormData,
  validateUpdateFormData, getDeleteErrorStatusCode, createApiError,
} from "./property-type-validation";
import { PROPERTY_TYPE_ERROR_CODES } from "@/lib/constants/property-type-error-codes";

/**
 * Fetches all property types from the API without pagination.
 *
 * @deprecated This function fetches all records in a single request, which could
 * cause performance issues as the dataset grows. Prefer using `getPropertyTypesPaged()`
 * for production use cases that display data in tables with pagination.
 *
 * This function is retained for:
 * - Dropdown/select lists that need all options loaded upfront
 * - Export functionality that requires the complete dataset
 * - Migration scripts or one-time data operations
 *
 * @returns Array of all property types
 */
export async function getPropertyTypes(): Promise<PropertyType[]> {
  try {
    const response = await apiClient.get<PagedResponse<PropertyType>>("/PropertyTypeMaster?PageSize=-1");
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch property types", "Get property types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    const items = response.data.items ?? [];
    return items.filter(isPropertyTypeShape).map(normalizePropertyType);
  } catch (error) {
    throw error;
  }
}

/** Fetches paginated property types from the API */
export async function getPropertyTypesPaged(
  pageNumber: number, pageSize: number, searchTerm?: string, sortBy?: string, sortOrder?: string
): Promise<PagedResponse<PropertyType>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    const safeSearchTerm = validateAndPrepareSearchTerm(searchTerm);
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (typeof sortBy === "string" && sortBy.trim()) {
      const apiSortBy = sortBy.trim() === "descriptionEnglish" ? "PropertyDescriptionEnglish" : sortBy.trim();
      params.append("SortBy", apiSortBy);
    }
    if (typeof sortOrder === "string" && sortOrder.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<PropertyType>>(`/PropertyTypeMaster?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged property types", "Get paged property types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const validItems = (response.data.items ?? []).filter(isPropertyTypeShape);
    const normalizedItems = validItems.map(normalizePropertyType);
    return { ...response.data, items: normalizedItems };
  } catch (error) {
    throw error;
  }
}

/** Fetches a single property type by ID */
export async function getPropertyTypeById(propertyTypeId: number): Promise<PropertyType | null> {
  try {
    if (!validatePropertyTypeId(propertyTypeId)) {
      throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.INVALID_PROPERTY_TYPE_ID, "Invalid property type ID");
    }
    const response = await apiClient.get<PropertyType>(`/PropertyTypeMaster/${encodeURIComponent(String(propertyTypeId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch property type", `Get property type ${propertyTypeId} failed`);
    }
    if (!response.data) return null;

    if (isPropertyTypeShape(response.data)) {
      return normalizePropertyType(response.data as Record<string, unknown>);
    }
    
    // Fallback for unexpected shape
    throw new ApiError(500, "Unexpected data format received from server", "Data validation failed");
  } catch (error) {
    throw error;
  }
}

/** 
 * Creates a new property type.
 * Returns the created PropertyType with ID if the API provides it, otherwise null.
 * The property type IS created successfully even if null is returned.
 */
export async function createPropertyType(data: PropertyTypeFormModel, userId: number): Promise<PropertyType | null> {
  try {
    validateCreateFormData(data);
    const englishDesc = (data.descriptionEnglish || data.propertyDescriptionEnglish)?.trim() || null;
    const payload = {
      propertyDescription: data.propertyDescription.trim(),
      propertyDescriptionEnglish: englishDesc,
      descriptionEnglish: englishDesc,
      type: data.type.trim(),
      //propertyTypeGroup: data.propertyTypeGroup.trim(),
      propertyTypeGroup: null, // Always send null as per requirement
      searchSequence: Number(data.searchSequence) || 0,
      propertyTypeCategoryId: data.propertyTypeCategoryId ?? null,
      isActive: data.isActive,
      createdBy: userId,
    };
    const response = await apiClient.post<PropertyType>("/PropertyTypeMaster", payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Create property type failed");
    }
    // Try to extract the created property type with ID from response
    if (response.data && isPropertyTypeShape(response.data)) {
      return normalizePropertyType(response.data as Record<string, unknown>);
    }
    // API succeeded but didn't return the created record - this is OK
    // The property type was created, we just don't have the ID from response
    return null;
  } catch (error) {
    throw error;
  }
}

/** Updates an existing property type */
export async function updatePropertyType(data: PropertyTypeFormModel, userId: number): Promise<void> {
  try {
    validateUpdateFormData(data);
    const englishDesc = (data.descriptionEnglish || data.propertyDescriptionEnglish)?.trim() || null;
    const payload = {
      id: data.id,
      propertyDescription: data.propertyDescription.trim(),
      propertyDescriptionEnglish: englishDesc,
      descriptionEnglish: englishDesc,
      type: data.type.trim(),
      propertyTypeGroup: null, // Always send null as per requirement
      searchSequence: Number(data.searchSequence) || 0,
      propertyTypeCategoryId: data.propertyTypeCategoryId ?? null,
      isActive: data.isActive,
      updatedBy: userId,
    };
    const response = await apiClient.put<unknown>(`/PropertyTypeMaster/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Update property type failed");
    }
  } catch (error) {
    throw error;
  }
}

/** Deletes a property type by ID */
export async function deletePropertyType(id: number): Promise<void> {
  try {
    if (!validatePropertyTypeId(id)) {
      throw new ApiError(400, "Valid Property Type ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/PropertyTypeMaster/${encodeURIComponent(String(id))}`);
    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(statusCode, response.error || "Failed to delete property type", `Delete property type ${id} failed`);
    }
  } catch (error) {
    throw error;
  }
}

/** 
 * Purge deletes a property type by ID.
 * This will permanently delete the record and all its dependencies.
 */
export async function purgeDeletePropertyType(id: number): Promise<void> {
  try {
    if (!validatePropertyTypeId(id)) {
      throw new ApiError(400, "Valid Property Type ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/PropertyTypeMaster/${encodeURIComponent(String(id))}/purge`);
    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(statusCode, response.error || "Failed to purge delete property type", `Purge delete property type ${id} failed`);
    }
  } catch (error) {
    throw error;
  }
}

/** Searches property types by description or type (client-side) */
export async function searchPropertyTypes(query: string): Promise<PropertyType[]> {
  try {
    if (!query?.trim()) return [];

    const allPropertyTypes = await getPropertyTypes();
    const lowerQuery = query.toLowerCase();

    return allPropertyTypes.filter((pt) =>
      pt.propertyDescription.toLowerCase().includes(lowerQuery) ||
      pt.type.toLowerCase().includes(lowerQuery) ||
      (pt.propertyTypeGroup?.toLowerCase().includes(lowerQuery) ?? false)
    );
  } catch (error) {
    throw error;
  }
}
