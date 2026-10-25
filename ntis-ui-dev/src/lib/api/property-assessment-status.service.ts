import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { PropertyAssessmentStatus } from "@/types/property-assessment-status.types";
import type { PagedResponse } from "@/types/common.types";
import { assessmentStatusCacheOptions } from "./property-search/cache-options";

/**
 * Fetches all active property assessment statuses for Search Property dropdowns.
 * Endpoint: GET /api/PropertyAssessmentStatus
 */
export async function getPropertyAssessmentStatuses(): Promise<
  PropertyAssessmentStatus[]
> {
  const qs = new URLSearchParams();
  qs.set("PageNumber", "1");
  qs.set("PageSize", "-1");
  qs.set("IsActive", "true");

  const response = await apiClient.get<PagedResponse<PropertyAssessmentStatus>>(
    `/PropertyAssessmentStatus?${qs.toString()}`,
    assessmentStatusCacheOptions
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to fetch property assessment statuses",
      "Get property assessment statuses failed"
    );
  }

  if (!response.data) {
    throw new ApiError(500, "No data received from server", "Invalid response format");
  }

  const items = response.data.items ?? [];

  return items.filter((item): item is PropertyAssessmentStatus => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "number" &&
      typeof item.statusName === "string" &&
      typeof item.isActive === "boolean" &&
      typeof item.createdDate === "string" &&
      (typeof item.updatedDate === "string" || item.updatedDate === null)
    );
  });
}
