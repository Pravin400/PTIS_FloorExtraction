import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { PagedResponse } from "@/types/common.types";
import type {
  GrievanceWorkflowStageMaster,
  GrievanceWorkflowStageMasterFormModel,
  RawGrievanceWorkflowStageMaster,
} from "@/types/asset-masters/grievance-workflow-stage-master.types";

interface ApiResponseEnvelope {
  success?: boolean;
  message?: string;
  items?: unknown;
  errors?: unknown;
}

const normalize = (item: RawGrievanceWorkflowStageMaster): GrievanceWorkflowStageMaster => ({
  id: item.id ?? 0,
  ulbTypeId: item.ulbTypeId ?? 0,
  ulbTypeName: item.ulbTypeName ?? null,
  stageCode: item.stageCode ?? "",
  stageName: item.stageName ?? "",
  stageNameLocal: item.stageNameLocal ?? null,
  stageOrder: item.stageOrder ?? 0,
  status: item.status ?? "",
  description: item.description ?? null,
  isActive: Boolean(item.isActive),
  createdDate: item.createdDate ?? null,
  updatedDate: item.updatedDate ?? null,
  createdBy: item.createdBy ?? null,
  updatedBy: item.updatedBy ?? null,
});

export async function getGrievanceWorkflowStageMastersPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<GrievanceWorkflowStageMaster>> {
  const params = new URLSearchParams();
  params.set("PageNumber", String(pageNumber));
  params.set("PageSize", String(pageSize));
  params.set("MarkedForDeletion", "false");
  if (searchTerm?.trim()) params.set("SearchTerm", searchTerm.trim());
  if (sortBy?.trim()) params.set("SortBy", sortBy.trim());
  if (sortOrder?.trim()) params.set("SortOrder", sortOrder.trim());

  const response = await apiClient.get<PagedResponse<RawGrievanceWorkflowStageMaster>>(
    `/asset-management/grievance-workflow-stage?${params.toString()}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to fetch grievance workflow stages",
      "Get grievance workflow stages failed"
    );
  }

  return {
    ...response.data,
    items: (response.data.items ?? []).map(normalize),
  };
}

export async function getGrievanceWorkflowStageMasterById(
  id: number
): Promise<GrievanceWorkflowStageMaster | null> {
  const response = await apiClient.get<RawGrievanceWorkflowStageMaster>(
    `/asset-management/grievance-workflow-stage/${encodeURIComponent(String(id))}`
  );
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || `Failed to fetch grievance workflow stage ${id}`,
      `Get grievance workflow stage ${id} failed`
    );
  }
  if (!response.data) return null;
  return normalize(response.data);
}

export async function createGrievanceWorkflowStageMaster(
  data: GrievanceWorkflowStageMasterFormModel
): Promise<void> {
  const payload = {
    ulbTypeId: 1,
    stageCode: data.stageCode.trim(),
    stageName: data.stageName.trim(),
    stageNameLocal: data.stageNameLocal?.trim() || null,
    stageOrder: Number(data.stageOrder) || 0,
    status: data.status.trim(),
    description: data.description?.trim() || null,
    isActive: data.isActive,
    createdBy:
      data.createdBy != null
        ? Number.isNaN(Number(data.createdBy))
          ? data.createdBy
          : Number(data.createdBy)
        : null,
  };
  const response = await apiClient.post<ApiResponseEnvelope>(
    "/asset-management/grievance-workflow-stage",
    payload
  );
  if (!response.success || (response.data && response.data.success === false)) {
    const errMsg = response.data?.message || response.error || "Create grievance workflow stage failed";
    throw new ApiError(response.statusCode ?? 500, errMsg, errMsg);
  }
}

export async function updateGrievanceWorkflowStageMaster(
  data: GrievanceWorkflowStageMasterFormModel
): Promise<void> {
  if (!data.id) {
    throw new ApiError(400, "Valid grievance workflow stage ID is required", "Validation failed");
  }
  const payload = {
    id: data.id,
    ulbTypeId: 1,
    stageCode: data.stageCode.trim(),
    stageName: data.stageName.trim(),
    stageNameLocal: data.stageNameLocal?.trim() || null,
    stageOrder: Number(data.stageOrder) || 0,
    status: data.status.trim(),
    description: data.description?.trim() || null,
    isActive: data.isActive,
    updatedBy:
      data.updatedBy != null
        ? Number.isNaN(Number(data.updatedBy))
          ? data.updatedBy
          : Number(data.updatedBy)
        : null,
  };
  const response = await apiClient.put<ApiResponseEnvelope>(
    `/asset-management/grievance-workflow-stage/${encodeURIComponent(String(data.id))}`,
    payload
  );
  if (!response.success || (response.data && response.data.success === false)) {
    const errMsg = response.data?.message || response.error || "Update grievance workflow stage failed";
    throw new ApiError(response.statusCode ?? 500, errMsg, errMsg);
  }
}

export async function deleteGrievanceWorkflowStageMaster(id: number): Promise<void> {
  const response = await apiClient.delete<ApiResponseEnvelope>(
    `/asset-management/grievance-workflow-stage/${encodeURIComponent(String(id))}`
  );
  if (!response.success || (response.data && response.data.success === false)) {
    const errMsg =
      response.data?.message || response.error || `Delete grievance workflow stage ${id} failed`;
    throw new ApiError(response.statusCode ?? 500, errMsg, errMsg);
  }
}
