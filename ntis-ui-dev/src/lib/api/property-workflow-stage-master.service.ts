import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { PropertyWorkflowStageMaster } from "@/types/property-workflow-stage-master.types";
import type { PagedResponse } from "@/types/common.types";
import { workflowStageCacheOptions } from "./property-search/cache-options";

/**
 * Fetches all active property workflow stages for Search Property dropdowns.
 * Endpoint: GET /api/PropertyWorkflowStageMaster
 */
export async function getPropertyWorkflowStages(): Promise<
  PropertyWorkflowStageMaster[]
> {
  const qs = new URLSearchParams();
  qs.set("PageNumber", "1");
  qs.set("PageSize", "-1");
  qs.set("IsActive", "true");

  const response = await apiClient.get<PagedResponse<PropertyWorkflowStageMaster>>(
    `/PropertyWorkflowStageMaster?${qs.toString()}`,
    workflowStageCacheOptions
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to fetch property workflow stages",
      "Get property workflow stages failed"
    );
  }

  if (!response.data) {
    throw new ApiError(500, "No data received from server", "Invalid response format");
  }

  const items = response.data.items ?? [];

  return items.filter((item): item is PropertyWorkflowStageMaster => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "number" &&
      typeof item.stageName === "string" &&
      typeof item.isActive === "boolean" &&
      typeof item.createdDate === "string" &&
      (typeof item.updatedDate === "string" || item.updatedDate === null)
    );
  });
}
