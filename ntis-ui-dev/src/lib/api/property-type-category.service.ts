import { apiClient } from "@/services/api.service";
import { PropertyTypeCategory } from "@/types/property-type-category.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { categoryCacheOptions } from "./property-search/cache-options";

/**
 * Fetches all active property type categories from the API
 * Used for populating dropdowns in property type forms
 */
export async function getPropertyTypeCategories(): Promise<PropertyTypeCategory[]> {
  try {
    // Always fetch all categories by requesting with pageSize -1
    const qs = new URLSearchParams();
    qs.set("PageNumber", "1");
    qs.set("PageSize", "-1");
    const response = await apiClient.get<PagedResponse<PropertyTypeCategory>>(
      `/PropertyTypeCategory?${qs.toString()}`,
      categoryCacheOptions
    );

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch property type categories",
        "Get property type categories failed"
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const items = response.data.items ?? [];

    // Validate structure (including date fields) but don't filter by isActive
    // This allows edit forms to show deactivated categories for existing records
    return items.filter((item): item is PropertyTypeCategory => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "number" &&
        typeof item.propertyTypeCategory === "string" &&
        typeof item.isActive === "boolean" &&
        typeof item.createdDate === "string" &&
        (typeof item.updatedDate === "string" || item.updatedDate === null)
      );
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Fetches a single property type category by ID
 */
export async function getPropertyTypeCategoryById(id: number): Promise<PropertyTypeCategory | null> {
  try {
    if (!id || id <= 0) {
      throw new ApiError(400, "Valid Property Type Category ID is required", "Invalid category ID");
    }
    
    const response = await apiClient.get<PropertyTypeCategory>(
      `/PropertyTypeCategory/${encodeURIComponent(String(id))}`
    );
    
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch property type category",
        `Get property type category ${id} failed`
      );
    }
    
    return response.data || null;
  } catch (error) {
    throw error;
  }
}
