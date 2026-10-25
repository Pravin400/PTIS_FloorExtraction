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
} from "@/types/combine-property.types";
import {
  isCombinePropertyItemShape,
  normalizeCombinePropertyItem,
  isPropertyCombineDetailsShape,
  normalizePropertyCombineDetails,
} from "./combine-property/combine-property-types-guard";

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

    const items = (response.data.items ?? []) as unknown[];
    const validItems = items.filter(isCombinePropertyItemShape);
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
