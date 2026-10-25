import { apiClient } from "@/services/api.service";
import {
  WingItem,
  WingListResponse,
  WingMutationResponse,
  CreateWingPayload,
  UpdateWingPayload
} from "@/types/wing.types";
 
/**
 * Fetches paginated wing master list from /Wing endpoint.
 * Supports filtering by search term and active status.
 */
export async function getWings(
  pageNumber: number = 1,
  pageSize: number = 100,
  searchTerm?: string,
  isActive?: boolean
): Promise<WingListResponse> {
  const params = new URLSearchParams();
  params.set("PageNumber", pageNumber.toString());
  params.set("PageSize", pageSize.toString());
 
  if (searchTerm) {
    params.set("SearchTerm", searchTerm);
  }
 
  if (typeof isActive === "boolean") {
    params.set("IsActive", isActive.toString());
  }
 
  const response = await apiClient.get<WingListResponse>(`/Wing?${params.toString()}`);
 
  if (!response.success || !response.data) {
    return { items: [], totalCount: 0, pageNumber, pageSize, totalPages: 0, hasPrevious: false, hasNext: false };
  }
 
  return response.data;
}
 
/**
 * Fetches all active wings (no pagination, for dropdowns).
 */
export async function getAllActiveWings(): Promise<WingItem[]> {
  try {
    const response = await getWings(1, 1000, undefined, true);
    return response.items;
  } catch (error) {
    console.error("Failed to fetch active wings:", error);
    return [];
  }
}
 
/**
 * Fetches a single wing by its ID.
 * @param id - The numeric wing ID
 */
export async function getWingById(id: number | string): Promise<WingItem | null> {
  const response = await apiClient.get<WingItem>(`/Wing/${id}`);
 
  if (!response.success || !response.data) return null;
 
  return response.data;
}
 
/**
 * Creates a new wing.
 */
export async function createWing(data: CreateWingPayload): Promise<WingMutationResponse<WingItem>> {
  const response = await apiClient.post<WingMutationResponse<WingItem>>(`/Wing`, data);
 
  if (!response.success || !response.data) {
    return { success: false, message: response.error || "Failed to create wing", items: null, errors: null };
  }
 
  return response.data;
}
 
/**
 * Updates an existing wing.
 * @param id - The numeric wing ID
 * @param data - The update payload
 */
export async function updateWing(id: number | string, data: UpdateWingPayload): Promise<WingMutationResponse<WingItem>> {
  const response = await apiClient.put<WingMutationResponse<WingItem>>(`/Wing/${id}`, data);
 
  if (!response.success || !response.data) {
    return { success: false, message: response.error || "Failed to update wing", items: null, errors: null };
  }
 
  return response.data;
}
 
/**
 * Deletes a wing by ID.
 * @param id - The numeric wing ID
 */
export async function deleteWing(id: number | string): Promise<WingMutationResponse<null>> {
  const response = await apiClient.delete<WingMutationResponse<null>>(`/Wing/${id}`);
 
  if (!response.success || !response.data) {
    return { success: false, message: response.error || "Failed to delete wing", items: null, errors: null };
  }
 
  return response.data;
}
