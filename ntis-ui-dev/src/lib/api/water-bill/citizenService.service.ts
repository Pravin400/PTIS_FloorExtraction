import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type {
  CitizenServicePagedResponse,
  CitizenServiceQueryParameters,
} from "@/types/water-bill/citizenService.types";

export async function getCitizenServices(
  params?: CitizenServiceQueryParameters
): Promise<CitizenServicePagedResponse> {
  try {
    const query = new URLSearchParams();

    if (params?.departmentId) query.append("DepartmentId", params.departmentId.toString());
    if (params?.pageNumber) query.append("PageNumber", params.pageNumber.toString());
    if (params?.pageSize) query.append("PageSize", params.pageSize.toString());

    const url = query.toString() ? `/citizen/service?${query.toString()}` : "/citizen/service";

    const response = await apiClient.get<CitizenServicePagedResponse>(url);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch citizen services", "Get citizen services failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching citizen services:", error);
    throw error;
  }
}
