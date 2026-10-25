import { apiClient } from "@/services/api.service";
import {
  RateItem,
  SectionItem,
  RateSectionCatalogResponse,
  RateSectionFormState,
  RateSectionQueryParams,
} from "@/types/rateSectionMaster.types";
import { ApiError } from "@/lib/utils/api";

// Helper to build query string from parameters
const buildQueryString = (params: RateSectionQueryParams): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/* =========================
   RATE SECTION SERVICES
========================= */

/**
 * Fetch all rate sections (simple list).
 * Use this for simple dropdowns or listings where advanced filtering is not required.
 */
export async function getAllRateSections(): Promise<RateItem[]> {
  const response = await apiClient.get<RateItem[] | { items?: RateItem[]; data?: RateItem[]; rateSectionMaster?: RateItem[] }>(`/RateSection`);

  if (!response.success || !response.data) return [];

  const data = response.data;

  // Robust parsing logic with proper type handling
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.rateSectionMaster)) return data.rateSectionMaster;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;

  return [];
}

/**
 * Advanced query for Rate Sections with support for filtering, sorting, and pagination.
 * Use this for the main Rate Section Master table or any complex listing.
 */
export async function queryRateSections(
  queryParams: RateSectionQueryParams = {}
): Promise<RateSectionCatalogResponse> {
  const queryString = buildQueryString(queryParams);

  const response = await apiClient.get<RateSectionCatalogResponse>(`/RateSection${queryString}`);

  if (!response.success || !response.data) {
    return {
      rateSectionMaster: [],
      rateSectionDetails: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
  }

  const data = response.data;

  // Unified parsing logic for items (Rate Section Master records)
  let items: RateItem[] = [];
  const dataAny = data as unknown as Record<string, unknown>;
  if (Array.isArray(data)) items = data as unknown as RateItem[];
  else if (Array.isArray(dataAny.items)) items = dataAny.items as RateItem[];
  else if (Array.isArray(dataAny.data)) items = dataAny.data as RateItem[];
  else if (Array.isArray(data.rateSectionMaster)) items = data.rateSectionMaster;

  // Unified parsing logic for details (Rate Section Details records)
  let details: SectionItem[] = [];
  if (Array.isArray(data.rateSectionDetails)) details = data.rateSectionDetails;

  // Unified pagination fields
  return {
    rateSectionMaster: items,
    rateSectionDetails: details,
    totalCount: data.totalCount ?? items.length,
    pageNumber: data.pageNumber ?? 1,
    pageSize: data.pageSize ?? items.length,
    totalPages: data.totalPages ?? 1,
    hasNext: data.hasNext ?? false,
    hasPrevious: data.hasPrevious ?? false,
  };
}

/**
 * Get the total count of all Rate Sections.
 * Use this for pagination calculations or dashboard statistics.
 */
export async function getRateSectionTotalCount(): Promise<number> {
  const response = await apiClient.get<{ totalCount?: number }>(`/RateSection`);

  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch total count", "Get rate section total count failed");
  }

  return response.data?.totalCount ?? 0;
}

/**
 * Fetch a paginated list of Rate Sections.
 * Use this when you specifically need a page of Rate Sections (e.g., for a grid view).
 */
export async function getRateSectionsPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<RateSectionCatalogResponse> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });
  if (searchTerm) params.append("SearchTerm", searchTerm);

  const response = await apiClient.get<RateSectionCatalogResponse>(`/RateSection?${params.toString()}`);

  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged rate sections", "Get paged rate sections failed");
  }

  return response.data;
}

/**
 * Fetch a single Rate Section by its ID (RateSectionNo).
 * Use this for the Edit Rate Section form or viewing details.
 */
export async function getRateSectionById(id: string): Promise<RateItem | null> {
  if (!id || id.trim() === "") return null;

  const response = await apiClient.get<RateItem>(`/RateSection/${id}`);

  if (!response.success || !response.data) return null;

  return response.data;
}

/**
 * Create a new Rate Section.
 * Use this function in the Add Rate Section form submission.
 */
export async function createRateSection(payload: RateSectionFormState): Promise<{ success: boolean; error?: string; data?: { id: number } }> {
  const apiPayload = {
    Description: payload.zoneRegional || payload.description || "",
    IsActive: payload.isActive ?? true,
    CreatedBy: payload.createdBy,
    UpdatedBy: payload.updatedBy
  };

  const response = await apiClient.post<{ items?: { id: number } }>(`/RateSection`, apiPayload);

  if (!response.success) {
    return { success: false, error: response.error || "Failed to create rate section" };
  }

  return { success: true, data: response.data?.items };
}

/**
 * Update an existing Rate Section.
 * Use this function in the Edit Rate Section form submission.
 */
export async function updateRateSection(id: string, payload: RateSectionFormState): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  const apiPayload = {
    Description: payload.zoneRegional || payload.description || "",
    IsActive: payload.isActive ?? true,
    UpdatedBy: payload.updatedBy
  };

  const response = await apiClient.put(`/RateSection/${id}`, apiPayload);

  if (!response.success) {
    return { success: false, error: response.error || "Failed to update rate section", statusCode: response.statusCode };
  }

  return { success: true };
}

/**
 * Delete a Rate Section.
 * Use this function to remove a Rate Section from the system.
 */
export async function deleteRateSection(id: string): Promise<{ success: boolean; error?: string }> {
  const response = await apiClient.delete(`/RateSection/${encodeURIComponent(id)}`);

  if (!response.success) {
    return { success: false, error: response.error || "Failed to delete rate section" };
  }

  return { success: true };
}
