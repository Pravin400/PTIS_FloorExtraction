import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type {
  DepartmentPortalConfigurationPagedResponse,
  DepartmentPortalConfigurationQueryParameters,
} from "@/types/water-bill/portalConfig.types";

export async function getDepartmentPortalConfiguration(
  params?: DepartmentPortalConfigurationQueryParameters
): Promise<DepartmentPortalConfigurationPagedResponse> {
  try {
    const query = new URLSearchParams();

    if (params?.departmentId) query.append("DepartmentId", params.departmentId.toString());
    if (params?.pageNumber) query.append("PageNumber", params.pageNumber.toString());
    if (params?.pageSize) query.append("PageSize", params.pageSize.toString());

    const url = query.toString()
      ? `/citizen/department-portal-configuration?${query.toString()}`
      : "/citizen/department-portal-configuration";

    const response = await apiClient.get<DepartmentPortalConfigurationPagedResponse>(url);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch department portal configuration",
        "Get department portal configuration failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching department portal configuration:", error);
    throw error;
  }
}
