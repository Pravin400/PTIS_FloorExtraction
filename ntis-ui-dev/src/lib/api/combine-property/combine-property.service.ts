import "server-only";

import { apiClient } from "@/services/api.service";
import { PagedResponse } from "@/types/common.types";
import { ApiError, handleApiResponse } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";
import {
  CombinePropertyItem,
  CombinePropertyPayload,
  CombinePropertyParams,
  PropertyCombineDetails,
  GetPropertyCombineDetailsParams,
  PropertyCombineDetailsResponse,
  GetCombinePropertiesHistoryParams,
} from "@/types/combine-property.types";
import {
  isCombinePropertyItemShape,
  normalizeCombinePropertyItem,
  isPropertyCombineDetailsShape,
  normalizePropertyCombineDetails,
} from "./combine-property-types-guard";

const logger = createLogger("CombinePropertyService");

/** 
 * Fetches paginated properties for combine property 
 * Mandatory fields: pageNumber, pageSize
 */
export async function getCombinePropertiesPaged(
  params: CombinePropertyParams
): Promise<PagedResponse<CombinePropertyItem>> {
  try {
    const queryParams = new URLSearchParams();

    // Mandatory Parameters
    queryParams.append("PageNumber", params.pageNumber.toString());
    queryParams.append("PageSize", params.pageSize.toString());

    // Optional Parameters
    if (params.taxZoneId !== undefined) queryParams.append("TaxZoneId", params.taxZoneId.toString());
    if (params.wardId !== undefined) queryParams.append("WardId", params.wardId.toString());
    if (params.propertyNo?.trim()) queryParams.append("PropertyNo", params.propertyNo.trim());
    if (params.partitionNo?.trim()) queryParams.append("PartitionNo", params.partitionNo.trim());
    if (params.categoryId !== undefined) queryParams.append("CategoryId", params.categoryId.toString());
    if (params.societyDetailId !== undefined) queryParams.append("SocietyDetailId", params.societyDetailId.toString());
    if (params.searchTerm?.trim()) queryParams.append("SearchTerm", params.searchTerm.trim());
    if (params.sortBy?.trim()) queryParams.append("SortBy", params.sortBy.trim());
    if (params.sortOrder?.trim()) queryParams.append("SortOrder", params.sortOrder.trim());
    if (params.filterLogic !== undefined) queryParams.append("FilterLogic", params.filterLogic.toString());

    const response = await apiClient.get<PagedResponse<CombinePropertyItem>>(`/Property/combine-properties?${queryParams.toString()}`);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch paged combine properties",
        "Get paged combine properties failed"
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    // Normalize wrapped paged response: API may return { items: [...] } or { items: { items: [...] } }
    let rawItems: unknown[] = [];
    const dataItems = response.data.items;
    if (Array.isArray(dataItems)) {
      rawItems = dataItems;
    } else if (dataItems && typeof dataItems === "object" && "items" in dataItems && Array.isArray((dataItems as { items: unknown[] }).items)) {
      rawItems = (dataItems as { items: unknown[] }).items;
    }

    const validItems = rawItems.filter(isCombinePropertyItemShape);
    const normalizedItems = validItems.map(normalizeCombinePropertyItem);

    return { ...response.data, items: normalizedItems };
  } catch (error) {
    logger.error("Error fetching paged combine properties", undefined, error);
    throw error;
  }
}

/**
 * Fetches specific details for properties to be combined
 * Mandatory fields: wardId, propertyNo, partitionNo
 */
export async function getPropertyCombineDetails(
  params: GetPropertyCombineDetailsParams
): Promise<PropertyCombineDetails[]> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("WardId", params.wardId.toString());
    queryParams.append("PropertyNo", params.propertyNo);
    queryParams.append("PartitionNo", params.partitionNo);

    const response = await apiClient.get<PropertyCombineDetailsResponse | PropertyCombineDetails[]>(`/Property/combine-properties-details?${queryParams.toString()}`);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch property combine details",
        "Get property combine details failed"
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    // Since the API returns a PropertyCombineDetailsResponse object with an items array
    let rawItems: unknown[] = [];
    if ("items" in response.data && !Array.isArray(response.data)) {
      rawItems = response.data.items || [];
    } else if (Array.isArray(response.data)) {
      // Fallback if the API ever returns an array directly
      rawItems = response.data;
    }

    const validItems = rawItems.filter(isPropertyCombineDetailsShape);
    return validItems.map(normalizePropertyCombineDetails);
  } catch (error) {
    logger.error("Error fetching property combine details", undefined, error);
    throw error;
  }
}

/** 
 * Combines properties 
 * All fields are required as per the specifications
 */
export async function createCombineProperty(payload: CombinePropertyPayload): Promise<unknown> {
  try {
    const response = await apiClient.post<unknown>("/Property/combine-properties", payload);

    return handleApiResponse(response, "Combine properties failed");
  } catch (error) {
    logger.error("Error creating combine property", undefined, error);
    throw error;
  }
}

/**
 * Fetches history of combined properties
 */
export async function getCombinePropertiesHistory(
  params?: GetCombinePropertiesHistoryParams
): Promise<PagedResponse<PropertyCombineDetails>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.sourcePropertyId !== undefined) {
      queryParams.append("SourcePropertyId", params.sourcePropertyId.toString());
    }
    if (params?.wardId !== undefined) {
      queryParams.append("WardId", params.wardId.toString());
    }
    if (params?.propertyNo) {
      queryParams.append("PropertyNo", params.propertyNo);
    }
    if (params?.partitionNo) {
      queryParams.append("PartitionNo", params.partitionNo);
    }
    if (params?.pageNumber !== undefined) {
      queryParams.append("PageNumber", params.pageNumber.toString());
    }
    if (params?.pageSize !== undefined) {
      queryParams.append("PageSize", params.pageSize.toString());
    }
    if (params?.searchTerm) {
      queryParams.append("SearchTerm", params.searchTerm);
    }
    if (params?.sortBy) {
      queryParams.append("SortBy", params.sortBy);
    }
    if (params?.sortOrder) {
      queryParams.append("SortOrder", params.sortOrder);
    }
    if (params?.filterLogic !== undefined) {
      queryParams.append("FilterLogic", params.filterLogic.toString());
    }

    // Avoid trailing '?' if no query params
    const queryString = queryParams.toString();
    const url = queryString ? `/Property/combine-properties-history?${queryString}` : `/Property/combine-properties-history`;

    const response = await apiClient.get<PropertyCombineDetailsResponse | PropertyCombineDetails[] | PagedResponse<unknown>>(url);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch property combine history",
        "Get property combine history failed"
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    // Handle PagedResponse specifically
    if ("items" in response.data && typeof response.data.items === "object" && response.data.items !== null && "items" in response.data.items) {
      // It's a nested items object which means it's a PagedResponse wrapped in ApiResponse
      const pagedData = response.data.items as unknown as PagedResponse<unknown>;
      const rawItems = Array.isArray(pagedData.items) ? pagedData.items : [];
      const normalizedItems = rawItems
        .filter((item): item is Record<string, unknown> => isPropertyCombineDetailsShape(item))
        .map((item) => normalizePropertyCombineDetails(item));
        
      return {
        ...pagedData,
        items: normalizedItems
      };
    }

    // Since the API might return PropertyCombineDetailsResponse object with an items array
    let rawItems: unknown[] = [];
    if ("items" in response.data && Array.isArray(response.data.items)) {
      rawItems = response.data.items;
    } else if (Array.isArray(response.data)) {
      // Fallback if the API ever returns an array directly
      rawItems = response.data;
    }

    const normalizedItems = rawItems
      .filter((item): item is Record<string, unknown> => isPropertyCombineDetailsShape(item))
      .map((item) => normalizePropertyCombineDetails(item));

    return {
      items: normalizedItems,
      totalCount: normalizedItems.length,
      pageNumber: 1,
      pageSize: normalizedItems.length,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false
    };
  } catch (error: unknown) {
    logger.error("getCombinePropertiesHistory Error:", undefined, error);
    throw error;
  }
}
