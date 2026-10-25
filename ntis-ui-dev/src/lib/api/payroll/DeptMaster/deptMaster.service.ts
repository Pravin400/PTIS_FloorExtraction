import { apiClient } from "@/services/api.service";
import type { DeptMasterItem } from "@/types/payroll/MasterModule";
import type { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { isRecordMarkedForDeletion } from "@/lib/utils/payroll.utils";

const ENDPOINT = "/payroll/department-master";

/**
 * Normalizes backend DTO to frontend DeptMasterItem
 */
export function normalizeDeptMaster(raw: unknown): DeptMasterItem {
  const item = (raw || {}) as Record<string, unknown>;
  const rawId = item.id ?? item.departmentId;
  const numId = typeof rawId === "number" ? rawId : parseInt(String(rawId), 10);

  return {
    id: !isNaN(numId) ? numId : undefined,
    departmentId: String(rawId ?? item.departmentCode ?? ""),
    departmentCode: String(item.departmentCode ?? "").trim(),
    departmentName: String(item.departmentName ?? "").trim(),
    departmentNameMarathi: String(item.departmentNameMarathi ?? "").trim(),
    description: item.description ? String(item.description).trim() : undefined,
    deptLevel: item.deptLevel != null ? Number(item.deptLevel) : null,
    markedForDeletion: isRecordMarkedForDeletion(item),
    markedForDeletionDate: item.markedForDeletionDate ? String(item.markedForDeletionDate) : null,
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    createdDate: item.createdDate ? String(item.createdDate) : undefined,
    updatedDate: item.updatedDate ? String(item.updatedDate) : null,
  };
}

/** Fetches all department masters from the API */
export async function getDeptMaster(): Promise<DeptMasterItem[]> {
  try {
    const response = await apiClient.get<PagedResponse<DeptMasterItem>>(`${ENDPOINT}?MarkedForDeletion=false`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch department masters", "Get department master failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    const items = response.data.items ?? [];
    return items.map(normalizeDeptMaster).filter((item) => !isRecordMarkedForDeletion(item));
  } catch (error) {
    logger.error("Error fetching department masters", { error: error as Error });
    throw error;
  }
}

/** Fetches paginated department masters from the API */
export async function getDeptMasterPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<DeptMasterItem>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");

    if (searchTerm && searchTerm.trim()) params.append("SearchTerm", searchTerm.trim());
    if (typeof sortBy === "string" && sortBy.trim()) params.append("SortBy", sortBy.trim());
    if (typeof sortOrder === "string" && sortOrder.trim()) params.append("SortOrder", sortOrder.trim());
    if (typeof isActive === "boolean") params.append("IsActive", isActive.toString());

    const response = await apiClient.get<PagedResponse<DeptMasterItem>>(`${ENDPOINT}?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch paged department masters",
        "Get paged department master failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const items = response.data.items ?? [];
    const normalizedItems = items.map(normalizeDeptMaster).filter((item) => !isRecordMarkedForDeletion(item));
    const totalCount = Number(response.data.totalCount ?? normalizedItems.length);
    const totalPages = Number(response.data.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)));

    return {
      ...response.data,
      items: normalizedItems,
      totalCount,
      pageNumber: Number(response.data.pageNumber ?? pageNumber),
      pageSize: Number(response.data.pageSize ?? pageSize),
      totalPages,
      hasPrevious: Boolean(response.data.hasPrevious ?? pageNumber > 1),
      hasNext: Boolean(response.data.hasNext ?? pageNumber < totalPages),
    };
  } catch (error) {
    logger.error("Error fetching paged department masters", { error: error as Error });
    throw error;
  }
}

/**
 * Creates a new department master record
 */
export async function createDeptMaster(
  data: Omit<DeptMasterItem, "departmentId" | "id">,
  userId?: number
): Promise<DeptMasterItem> {
  try {
    const payload: Record<string, unknown> = {
      departmentCode: data.departmentCode,
      departmentName: data.departmentName,
      departmentNameMarathi: data.departmentNameMarathi,
      isActive: Boolean(data.isActive),
    };
    if (data.description !== undefined) payload.description = data.description;
    if (data.deptLevel !== undefined && data.deptLevel !== null) payload.deptLevel = Number(data.deptLevel);
    if (userId != null) payload.createdBy = userId;

    const response = await apiClient.post<DeptMasterItem>(ENDPOINT, payload);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to create department master",
        "Create department master failed"
      );
    }
    return normalizeDeptMaster(response.data);
  } catch (error) {
    logger.error("Error creating department master", { error: error as Error });
    throw error;
  }
}

/**
 * Updates an existing department master record
 */
export async function updateDeptMaster(
  idOrCode: string | number,
  data: Partial<DeptMasterItem>,
  userId?: number
): Promise<DeptMasterItem> {
  try {
    const payload: Record<string, unknown> = {};
    if (data.departmentCode !== undefined) payload.departmentCode = data.departmentCode;
    if (data.departmentName !== undefined) payload.departmentName = data.departmentName;
    if (data.departmentNameMarathi !== undefined) payload.departmentNameMarathi = data.departmentNameMarathi;
    if (data.description !== undefined) payload.description = data.description;
    if (data.deptLevel !== undefined) payload.deptLevel = data.deptLevel !== null ? Number(data.deptLevel) : null;
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);
    if (userId != null) payload.updatedBy = userId;

    const response = await apiClient.put<DeptMasterItem>(
      `${ENDPOINT}/${encodeURIComponent(String(idOrCode))}`,
      payload
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to update department master",
        "Update department master failed"
      );
    }
    return normalizeDeptMaster(response.data);
  } catch (error) {
    logger.error(`Error updating department master ${idOrCode}`, { error: error as Error });
    throw error;
  }
}

/**
 * Deletes a department master record
 */
export async function deleteDeptMaster(idOrCode: string | number): Promise<void> {
  try {
    const response = await apiClient.delete<void>(
      `${ENDPOINT}/${encodeURIComponent(String(idOrCode))}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to delete department master",
        "Delete department master failed"
      );
    }
  } catch (error) {
    logger.error(`Error deleting department master ${idOrCode}`, { error: error as Error });
    throw error;
  }
}
