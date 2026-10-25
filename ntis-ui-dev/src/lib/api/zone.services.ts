import { apiClient } from "@/services/api.service";
import { ZoneListResponse, ZoneItem, ZoneMutationResponse, CreateZonePayload, UpdateZonePayload } from "@/types/zoneMaster.types";
import { ApiError } from "@/lib/utils/api";

/**
 * Fetches paginated zone list from /Zone endpoint.
 * Throws ApiError on failure so Next.js error boundary can catch it.
 */
export async function getZones(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<ZoneListResponse> {
  const params = new URLSearchParams();
  params.set("PageNumber", pageNumber.toString());
  params.set("PageSize", pageSize.toString());

  if (searchTerm) {
    params.set("SearchTerm", searchTerm);
  }

  const response = await apiClient.get<ZoneListResponse>(`/Zone?${params.toString()}`);
  
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to fetch zones",
      "Get zones failed"
    );
  }

  const data = response.data;

  // Robust parsing: handle both paginated and array responses
  if (Array.isArray(data)) {
    return {
      items: data as unknown as ZoneItem[],
      totalCount: (data as unknown as ZoneItem[]).length,
      pageNumber,
      pageSize,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    };
  }
  // If data has items property, treat as paginated
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      totalCount: data.totalCount ?? data.items.length,
      pageNumber: data.pageNumber ?? pageNumber,
      pageSize: data.pageSize ?? pageSize,
      totalPages: data.totalPages ?? 1,
      hasPrevious: data.hasPrevious ?? false,
      hasNext: data.hasNext ?? false,
    };
  }
  // Fallback: empty result
  return {
    items: [],
    totalCount: 0,
    pageNumber,
    pageSize,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };
}

/**
 * Fetches a single zone by its ID.
 * @param id - The numeric zone ID
 */
export async function getZoneById(id: number | string): Promise<ZoneItem | null> {
  const response = await apiClient.get<ZoneItem>(`/Zone/${id}`);
  
  if (!response.success || !response.data) return null;
  
  return response.data;
}

/**
 * Creates a new zone.
 */
export async function createZone(data: CreateZonePayload): Promise<ZoneMutationResponse<ZoneItem>> {
  const response = await apiClient.post<ZoneMutationResponse<ZoneItem>>(`/Zone`, data);
  
  if (!response.success || !response.data) {
    return { success: false, message: response.error || "Failed to create zone", items: null, errors: null };
  }
  
  return response.data;
}

/**
 * Updates an existing zone.
 * @param id - The numeric zone ID
 * @param data - The update payload
 */
export async function updateZone(id: number | string, data: UpdateZonePayload): Promise<ZoneMutationResponse<ZoneItem>> {
  const response = await apiClient.put<ZoneMutationResponse<ZoneItem>>(`/Zone/${id}`, data);
  
  if (!response.success || !response.data) {
    return { success: false, message: response.error || "Failed to update zone", items: null, errors: null };
  }
  
  return response.data;
}

/**
 * Deletes a zone by its ID.
 * Uses /purge endpoint for permanent deletion as per API specification.
 * @param id - The numeric zone ID
 */
export async function deleteZone(id: number | string): Promise<ZoneMutationResponse<null>> {
  // Use /purge endpoint for permanent deletion as per API specification
  const response = await apiClient.delete<ZoneMutationResponse<null>>(`/Zone/${id}/purge`);
  
  // DELETE can return 204 No Content with empty body - only check success flag
  if (!response.success) {
    return { success: false, message: response.error || "Failed to delete zone", items: null, errors: null };
  }
  
  // Return response data if present, otherwise return success with null items (for 204 responses)
  return response.data ?? { success: true, message: "Zone deleted successfully", items: null, errors: null };
}
