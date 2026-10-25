import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import {
  SectionItem,
  RateSectionDetailsPagedResponse,
  UpdateWardStatusPayload,
  RateSectionDetailsBatchResponse,
  RateSectionDetailsPayload,
} from "@/types/rateSectionMaster.types";

export type { RateSectionDetailsPayload };

/* =========================
   RATE SECTION DETAILS SERVICES
========================= */

/**
 * Assign a Ward to a Rate Section (Create Detail).
 */
export async function createRateSectionDetail(payload: RateSectionDetailsPayload): Promise<{ success: boolean; error?: string }> {
  const response = await apiClient.post(`/RateSectionDetails`, payload);
  return response.success
    ? { success: true }
    : { success: false, error: response.error || "Failed to create RateSectionDetail" };
}

/**
 * Delete a Rate Section Detail (ward assignment).
 */
export async function deleteRateSectionDetail(id: number): Promise<{ success: boolean; error?: string }> {
  const response = await apiClient.delete(`/RateSectionDetails/${id}`);
  return response.success
    ? { success: true }
    : { success: false, error: response.error || "Failed to delete rate section detail" };
}

/**
 * Get the total count of assigned wards (Rate Section Details).
 */
export async function getWardTotalCount(): Promise<number> {
  const response = await apiClient.get<{ totalCount?: number; TotalCount?: number; count?: number; items?: unknown[] }>(`/RateSectionDetails?PageSize=1&PageNumber=1`);
  if (!response.success || !response.data) return 0;
  const data = response.data;
  return data?.totalCount ?? data?.TotalCount ?? data?.count ?? (Array.isArray(data?.items) ? data.items.length : 0);
}

/**
 * Fetch all SectionItems (ward assignments) for a specific Rate Section ID.
 * Uses PageSize=-1 to fetch all items in a single request.
 * @param rateSectionId - The numeric rate section ID to filter by
 */
export async function getWardsByRateSectionId(
  rateSectionId: number
): Promise<SectionItem[]> {
  const params = new URLSearchParams({
    RateSectionId: rateSectionId.toString(),
    PageSize: "-1",
  });

  const response = await apiClient.get<RateSectionDetailsPagedResponse>(
    `/RateSectionDetails?${params.toString()}`
  );

  if (!response.success || !response.data) return [];

  const data = response.data;
  const dataObj = data as unknown as Record<string, unknown>;
  const items = (data.items ?? dataObj.Items ?? []) as SectionItem[];

  return items;
}

/**
 * Fetch all Rate Section Details (Assigned Wards) in a single request.
 * Uses PageSize=-1 to get all assignments at once.
 */
export async function getAllRateSectionDetails(): Promise<SectionItem[]> {
  const params = new URLSearchParams({
    PageSize: "-1",
  });

  const response = await apiClient.get<RateSectionDetailsPagedResponse>(`/RateSectionDetails?${params.toString()}`);

  if (!response.success || !response.data) return [];

  const data = response.data;
  const dataObj = data as unknown as Record<string, unknown>;
  const items = (data.items ?? dataObj.Items ?? []) as SectionItem[];

  return items;
}

/**
 * Update the status (Active/Inactive) of a Ward assignment.
 */
export async function updateWardStatus(payload: UpdateWardStatusPayload): Promise<SectionItem | null> {
  const response = await apiClient.put<SectionItem>(`/RateSectionDetails/UpdateStatus`, payload);
  return response.success && response.data ? response.data : null;
}

/**
 * Fetch paginated list of Rate Section Details (Assigned Wards).
 */
export async function getRateSectionDetailsPaged(
  pageNumber: number,
  pageSize: number,
  rateSectionNo?: string,
  searchTerm?: string,
  rateSectionId?: number
): Promise<ApiResponse<RateSectionDetailsPagedResponse>> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });
  if (rateSectionNo) params.append("rateSectionNo", rateSectionNo);
  if (rateSectionId) params.append("RateSectionId", rateSectionId.toString());
  if (searchTerm) params.append("SearchTerm", searchTerm);

  return await apiClient.get<RateSectionDetailsPagedResponse>(`/RateSectionDetails?${params.toString()}`);
}

/**
 * Fetch paginated Rate Section Details with optional filters.
 */
export async function getWardPagedServer(
  pageNumber: number,
  pageSize: number,
  zoneId?: number,
  searchTerm?: string
): Promise<RateSectionDetailsPagedResponse> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });
  if (zoneId) params.append("ZoneId", zoneId.toString());
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
  const response = await apiClient.get<RateSectionDetailsPagedResponse>(`/RateSectionDetails?${params.toString()}`);
  return response.success && response.data ? response.data : {
    items: [], totalCount: 0, pageNumber: 1, pageSize: 10
  };
}

/**
 * Bulk create Rate Section Details (Multiple Ward Assignments).
 * Used when linking new wards to a rate section.
 * API: POST /api/RateSectionDetails/Bulk
 */
export async function bulkCreateRateSectionDetails(
  payload: Array<{
    isActive: boolean;
    createdBy: number;
    updatedBy: number;
    rateSectionId: number;
    wardId: number;
  }>
): Promise<RateSectionDetailsBatchResponse> {
  const response = await apiClient.post<RateSectionDetailsBatchResponse>(`/RateSectionDetails/Bulk`, payload);
  return response.success && response.data ? response.data : {
    success: false,
    message: response.error || "Failed to bulk create rate section details",
    items: { successCount: 0, failedCount: 0, results: [], errors: [], hasFailures: true, allSucceeded: false },
    errors: null,
  };
}

/**
 * Bulk update Rate Section Details (Multiple Ward Assignments).
 * Used when moving wards to selected rate section.
 * API: PUT /api/RateSectionDetails/Bulk
 */
export async function bulkUpdateRateSectionDetails(
  payload: Array<{
    id: number;
    data: {
      isActive: boolean;
      updatedBy: number;
      createdBy?: number;
      rateSectionId: number;
      wardId: number;
    }
  }>
): Promise<RateSectionDetailsBatchResponse> {
  const response = await apiClient.put<RateSectionDetailsBatchResponse>(`/RateSectionDetails/Bulk`, payload);
  return response.success && response.data ? response.data : {
    success: false,
    message: response.error || "Failed to bulk update rate section details",
    items: { successCount: 0, failedCount: 0, results: [], errors: [], hasFailures: true, allSucceeded: false },
    errors: null,
  };
}

/**
 * Bulk purge delete Rate Section Details (Multiple Ward Assignments).
 * Used when moving wards from selected rate section back to available.
 * API: DELETE /api/RateSectionDetails/Bulk/purge
 */
export async function bulkPurgeRateSectionDetails(
  ids: number[]
): Promise<RateSectionDetailsBatchResponse> {
  const response = await apiClient.delete<RateSectionDetailsBatchResponse>(`/RateSectionDetails/Bulk/purge`, { body: JSON.stringify(ids) });
  return response.success && response.data ? response.data : {
    success: false,
    message: response.error || "Failed to bulk purge rate section details",
    items: { successCount: 0, failedCount: 0, results: [], errors: [], hasFailures: true, allSucceeded: false },
    errors: null,
  };
}

/**
 * Get a single Rate Section Detail by its ID.
 */
export async function getRateSectionDetailById(id: number): Promise<SectionItem | null> {
  const response = await apiClient.get<SectionItem>(`/RateSectionDetails/${id}`);
  return response.success && response.data ? response.data : null;
}

/**
 * Update a Rate Section Detail.
 */
export async function updateRateSectionDetail(
  id: number,
  payload: Partial<SectionItem>
): Promise<{ success: boolean; error?: string }> {
  const response = await apiClient.put(`/RateSectionDetails/${id}`, payload);
  return response.success
    ? { success: true }
    : { success: false, error: response.error || "Failed to update rate section detail" };
}

/**
 * Fetch wards associated with a specific Rate Section.
 */
export async function getWardsByRateSection(
  rateSectionNo: string,
  pageSize: number = 1000
): Promise<SectionItem[]> {
  if (!rateSectionNo?.trim()) return [];
  const params = new URLSearchParams({ rateSectionNo, PageSize: pageSize.toString() });
  const response = await apiClient.get<SectionItem[] | { items?: SectionItem[]; data?: SectionItem[]; rateSectionDetails?: SectionItem[] }>(`/RateSectionDetails?${params.toString()}`);
  if (!response.success || !response.data) return [];
  const data = response.data;
  return Array.isArray(data) ? data
    : Array.isArray(data.rateSectionDetails) ? data.rateSectionDetails
      : Array.isArray(data.items) ? data.items
        : Array.isArray(data.data) ? data.data : [];
}

export const getWardsByRate = getWardsByRateSection;
