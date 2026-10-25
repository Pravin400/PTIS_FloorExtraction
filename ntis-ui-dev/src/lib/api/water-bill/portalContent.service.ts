import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type {
  PortalContentPagedResponse,
  PortalContentQueryParameters,
} from "@/types/water-bill/portalContent.types";

export async function getPortalContent(
  params?: PortalContentQueryParameters
): Promise<PortalContentPagedResponse> {
  try {
    const query = new URLSearchParams();

    if (params?.departmentId) query.append("DepartmentId", params.departmentId.toString());
    if (params?.contentType) query.append("ContentType", params.contentType);
    if (params?.pageNumber) query.append("PageNumber", params.pageNumber.toString());
    if (params?.pageSize) query.append("PageSize", params.pageSize.toString());

    const url = query.toString() ? `/citizen/portal-content?${query.toString()}` : "/citizen/portal-content";

    const response = await apiClient.get<PortalContentPagedResponse>(url);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch portal content", "Get portal content failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching portal content:", error);
    throw error;
  }
}
