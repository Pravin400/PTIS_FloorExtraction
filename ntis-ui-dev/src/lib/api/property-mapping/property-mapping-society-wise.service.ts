'use server';

import { apiClient } from "@/services/api.service";
import {
  MappedPropertySocietyWiseParams,
  MappedPropertySocietyWiseResponse,
} from "@/types/property-mapping/property-mapping-society-wise.types";

/**
 * Service API call to fetch mapped properties society-wise.
 * GET /api/PropertyMapMaster/mapped-properties-society-wise
 */
export async function getMappedPropertiesSocietyWiseAction(
  params: MappedPropertySocietyWiseParams
): Promise<MappedPropertySocietyWiseResponse | null> {
  try {
    const queryParts: string[] = [];

    if (params.wingDetailsId != null) {
      queryParts.push(`WingDetailsId=${params.wingDetailsId}`);
    }
    if (params.societyDetailId != null) {
      queryParts.push(`SocietyDetailId=${params.societyDetailId}`);
    }
    if (params.pageNumber != null) {
      queryParts.push(`PageNumber=${params.pageNumber}`);
    }
    if (params.pageSize != null) {
      queryParts.push(`PageSize=${params.pageSize}`);
    }
    if (params.searchTerm) {
      queryParts.push(`SearchTerm=${encodeURIComponent(params.searchTerm)}`);
    }
    if (params.sortBy) {
      queryParts.push(`SortBy=${encodeURIComponent(params.sortBy)}`);
    }
    if (params.sortOrder) {
      queryParts.push(`SortOrder=${encodeURIComponent(params.sortOrder)}`);
    }
    if (params.filterLogic != null) {
      queryParts.push(`FilterLogic=${params.filterLogic}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    const endpoint = `/PropertyMapMaster/mapped-properties-society-wise${queryString}`;

    const response = await apiClient.get<MappedPropertySocietyWiseResponse>(endpoint);

    return response.data ?? null;
  } catch (error) {
    console.error("Failed to fetch mapped properties society-wise:", error);
    return null;
  }
}
