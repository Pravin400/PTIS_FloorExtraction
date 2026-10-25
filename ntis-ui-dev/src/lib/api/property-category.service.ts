import { apiClient } from "@/services/api.service";
import { PropertyCategory } from "@/types/property-category.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";

/**
 * Fetches all active property categories from the API
 * Used for populating dropdowns in property forms
 * API endpoint: /api/PropertyCategory
 */
export async function getPropertyCategories(): Promise<PropertyCategory[]> {
  try {
    // Fetch all categories by requesting with pageSize -1
    const qs = new URLSearchParams();
    qs.set("PageNumber", "1");
    qs.set("PageSize", "-1");
    const response = await apiClient.get<PagedResponse<PropertyCategory>>(`/PropertyCategory?${qs.toString()}`);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch property categories",
        "Get property categories failed"
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const items = response.data.items ?? [];

    // Validate structure and filter only active categories
    return items.filter((item): item is PropertyCategory => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "number" &&
        typeof item.propertyCategoryName === "string" &&
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
 * Fetches paginated property categories from the API
 */
export async function getPropertyCategoriesPaged(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<PropertyCategory>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    const response = await apiClient.get<PagedResponse<PropertyCategory>>(`/PropertyCategory?${params.toString()}`);
    
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch paged property categories",
        "Get paged property categories failed"
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const validItems = (response.data.items ?? []).filter((item): item is PropertyCategory => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "number" &&
        typeof item.propertyCategoryName === "string" &&
        typeof item.isActive === "boolean"
      );
    });

    return { ...response.data, items: validItems };
  } catch (error) {
    throw error;
  }
}

/**
 * Fetches a single property category by ID
 */
export async function getPropertyCategoryById(id: number): Promise<PropertyCategory | null> {
  try {
    if (!Number.isFinite(id) || id <= 0) {
      throw new ApiError(400, "Valid Property Category ID is required", "Validation failed");
    }

    const response = await apiClient.get<PropertyCategory>(`/PropertyCategory/${encodeURIComponent(String(id))}`);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch property category",
        `Get property category ${id} failed`
      );
    }

    if (!response.data) return null;

    return response.data;
  } catch (error) {
    throw error;
  }
}
