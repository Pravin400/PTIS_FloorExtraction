import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import {
  WingDetailsMastListResponse,
  WingDetailsMastItem,
  CreateWingDetailsMastPayload,
  UpdateWingDetailsMastPayload,
} from "@/types/zone-master/properties/wingDetailsMast.types";

/**
 * Fetches WingDetailsMast (wing) records for a SocietyDetailsMast record.
 * GET /WingDetailsMast?SocietyDetailsMastId=
 */
export async function getWingDetailsMastBySocietyDetailsMastId(
  societyDetailsMastId: number,
  pageNumber: number = 1,
  pageSize: number = -1
): Promise<WingDetailsMastListResponse> {
  const params = new URLSearchParams({
    SocietyDetailsMastId: societyDetailsMastId.toString(),
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  const response = await apiClient.get<WingDetailsMastListResponse>(
    `/WingDetailsMast?${params.toString()}`
  );

  return handleApiResponse(response, "Failed to fetch wing details");
}

/**
 * Creates a new wing detail (wing) record.
 */
export async function createWingDetailsMast(
  payload: CreateWingDetailsMastPayload
): Promise<{ success: boolean; message: string; items: WingDetailsMastItem | null }> {
  const response = await apiClient.post<{ success: boolean; message: string; items: WingDetailsMastItem | null }>(
    "/WingDetailsMast",
    payload
  );

  return handleApiResponse(response, "Failed to create wing detail");
}

/**
 * Updates an existing wing detail (wing) record.
 */
export async function updateWingDetailsMast(
  id: number,
  payload: UpdateWingDetailsMastPayload
): Promise<{ success: boolean; message: string; items: WingDetailsMastItem | null }> {
  const response = await apiClient.put<{ success: boolean; message: string; items: WingDetailsMastItem | null }>(
    `/WingDetailsMast/${id}`,
    payload
  );

  return handleApiResponse(response, "Failed to update wing detail");
}
