import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { SocietyDetailsListResponse, CreateSocietyDetailPayload, SocietyDetailItem, UpdateSocietyDetailPayload } from "@/types/zone-master/properties/societyDetails.types";
import { SocietyAmenityDetailsResponse } from "@/types/zone-master/properties/society-amenity-details.types";

/**
 * Fetches society details for a specific property
 */
export async function getSocietyDetailsByProperty(
  propertyId: number,
  pageNumber: number = 1,
  pageSize: number = -1
): Promise<SocietyDetailsListResponse> {
  const params = new URLSearchParams({
    PropertyId: propertyId.toString(),
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  const response = await apiClient.get<SocietyDetailsListResponse>(
    `/SocietyDetails?${params.toString()}`
  );

  return handleApiResponse(response, "Failed to fetch society details");
}

/**
 * Fetches the latest society detail for a specific property to determine the next wingId.
 */
export async function getLatestSocietyDetailByProperty(
  propertyId: number
): Promise<SocietyDetailsListResponse> {
  const params = new URLSearchParams({
    PropertyId: propertyId.toString(),
    PageNumber: "1",
    PageSize: "1",
    SortBy: "wingid",
    SortOrder: "desc",
  });

  const response = await apiClient.get<SocietyDetailsListResponse>(
    `/SocietyDetails?${params.toString()}`
  );

  return handleApiResponse(response, "Failed to fetch latest society detail");
}

/**
 * Creates a new society detail record (wing)
 */
export async function createSocietyDetail(
  payload: CreateSocietyDetailPayload
): Promise<{ success: boolean; message: string; items: SocietyDetailItem | null }> {
  const response = await apiClient.post<{ success: boolean; message: string; items: SocietyDetailItem | null }>(
    "/SocietyDetails",
    payload
  );

  return handleApiResponse(response, "Failed to create society detail");
}

/**
 * Updates an existing society detail record
 */
export async function updateSocietyDetail(
  id: number,
  payload: UpdateSocietyDetailPayload
): Promise<{ success: boolean; message: string; items: SocietyDetailItem | null }> {
  const response = await apiClient.put<{ success: boolean; message: string; items: SocietyDetailItem | null }>(
    `/SocietyDetails/${id}`,
    payload
  );

  return handleApiResponse(response, "Failed to update society detail");
}

/**
 * Deletes a society detail record by ID
 */
export async function deleteSocietyDetail(
  id: number
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/SocietyDetails/${id}`
  );

  return handleApiResponse(response, "Failed to delete society detail");
}

/**
 * Fetches property or amenity records for a wing (society detail).
 * API: GET /Property/{societyDetailId}/{isAmenity}/society-amenity-details
 */
export async function getSocietyAmenityDetails(
  societyDetailId: number,
  isAmenity: boolean
): Promise<SocietyAmenityDetailsResponse> {
  const response = await apiClient.get<SocietyAmenityDetailsResponse>(
    `/Property/${societyDetailId}/${isAmenity}/society-amenity-details`
  );

  return handleApiResponse(response, "Failed to fetch society amenity details");
}
