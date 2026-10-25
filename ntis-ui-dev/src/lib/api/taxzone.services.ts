import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { PagedResponse, TaxZone, TaxZoneFormModel } from "@/types/taxzone.types";
 
// Re-export ApiError to maintain compatibility with files importing it from here
export { ApiError };
 
/** GET paged (server) */
export async function getTaxZonePagedServer(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<TaxZone>> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });
 
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
 
  const response = await apiClient.get<PagedResponse<TaxZone>>(
    `/TaxZone?${params.toString()}`
  );
 
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      "",
      response.error || "Fetch tax zones (server-paged) failed"
    );
  }
 
  return response.data;
}
 
/** GET by id */
export async function getTaxZoneById(id: string | number): Promise<TaxZone> {
  const response = await apiClient.get<TaxZone>(`/TaxZone/${id}`);
 
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      "",
      response.error || `Fetch tax zone ${id} failed`
    );
  }
 
  return response.data;
}
 
/** CREATE */
export async function createTaxZone(data: TaxZoneFormModel): Promise<void> {
  const payload = {
    taxZoneNo: data.taxZoneNo?.trim() || "",
    taxZoneType: data.taxZoneType?.trim() || "",
    remark: data.remark?.trim() || "",
    isActive: data.isActive,
    ...(data.createdBy != null ? { createdBy: data.createdBy } : {}),
  };

  const response = await apiClient.post<void>("/TaxZone", payload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      "",
      response.error || "Create tax zone failed"
    );
  }
}
 
/** UPDATE */
export async function updateTaxZone(data: TaxZoneFormModel): Promise<void> {
  const payload = {
    id: data.id,
    taxZoneNo: data.taxZoneNo?.trim() || "",
    taxZoneType: data.taxZoneType?.trim() || "",
    remark: data.remark?.trim() || "",
    isActive: data.isActive,
    ...(data.updatedBy != null ? { updatedBy: data.updatedBy } : {}),
  };
 
  const response = await apiClient.put<void>(`/TaxZone/${data.id}`, payload);
 
  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      "",
      response.error || "Update tax zone failed"
    );
  }
}
 
/** DELETE */
export async function deleteTaxZone(id: string | number): Promise<void> {
  const response = await apiClient.delete<void>(`/TaxZone/${id}/purge`);
 
  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      "",
      response.error || `Delete tax zone ${id} failed`
    );
  }
}
 
 