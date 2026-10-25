import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { PagedResponse, PolicyConfiguration, PolicyConfigurationFormModel } from "@/types/policy-configuration.types";

// Re-export ApiError to maintain compatibility with files importing it from here
export { ApiError };

/** GET paged (server) */
export async function getPolicyConfigurationsPagedServer(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<PolicyConfiguration>> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  if (searchTerm?.trim()) {
    params.append("SearchTerm", searchTerm.trim());
  }

  const response = await apiClient.get<PagedResponse<PolicyConfiguration>>(
    `/PolicyConfiguration?${params.toString()}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      "",
      response.error || "Fetch policy configurations (server-paged) failed"
    );
  }

  return response.data;
}

/** GET by id */
export async function getPolicyConfigurationById(id: string | number): Promise<PolicyConfiguration> {
  const response = await apiClient.get<PolicyConfiguration>(`/PolicyConfiguration/${id}`);

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      "",
      response.error || `Fetch policy configuration ${id} failed`
    );
  }

  return response.data;
}

/** UPDATE */
export async function updatePolicyConfiguration(data: PolicyConfigurationFormModel): Promise<void> {
  const payload = {
    id: data.id,
    policyCode: data.policyCode?.trim() || "",
    category: data.category?.trim() || "",
    displayName: data.displayName?.trim() || "",
    description: data.description?.trim() || "",
    dataType: data.dataType?.trim() || "",
    policyValue: data.policyValue?.trim() || "",
    defaultValue: data.defaultValue?.trim() || "",
    unit: data.unit?.trim() || "",
    effectiveFrom: data.effectiveFrom,
    effectiveTo: data.effectiveTo,
    allowedValues: data.allowedValues ?? null,
    isActive: data.isActive,
    createdBy: data.createdBy ?? 0,
    updatedBy: data.updatedBy ?? 0
  };

  const response = await apiClient.put<void>(`/PolicyConfiguration/${data.id}`, payload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      "",
      response.error || "Update policy configuration failed"
    );
  }
}
