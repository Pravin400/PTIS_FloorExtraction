import { apiClient } from "@/services/api.service";
import type { EmpStatusMasterItem, EmpStatusMasterPayload } from "@/types/payroll/MasterModule";
import type { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { isRecordMarkedForDeletion, parseIsActive } from "@/lib/utils/payroll.utils";

export { isRecordMarkedForDeletion, parseIsActive };

const ENDPOINT = "/payroll/employee-status-master";

export function normalizeEmpStatusMaster(raw: unknown): EmpStatusMasterItem {
  const item = (raw || {}) as Record<string, unknown>;
  const rawId = item.id ?? item.employeeStatusId ?? item.Id ?? item.EmployeeStatusId;
  const numId = typeof item.id === "number" ? item.id : typeof item.Id === "number" ? item.Id : !isNaN(Number(rawId)) ? Number(rawId) : undefined;
  const isDeleted = isRecordMarkedForDeletion(item);
  const active = parseIsActive(item);

  return {
    id: numId,
    employeeStatusId: String(rawId ?? (item.employeeStatusCode || item.EmployeeStatusCode || `STAT-${Date.now()}`)),
    employeeStatusCode: String(item.employeeStatusCode ?? item.EmployeeStatusCode ?? "").trim().toUpperCase(),
    employeeStatus: String(item.employeeStatus ?? item.EmployeeStatus ?? "").trim(),
    employeeStatusMarathi: (item.employeeStatusMarathi ?? item.EmployeeStatusMarathi) ? String(item.employeeStatusMarathi ?? item.EmployeeStatusMarathi).trim() : undefined,
    description: (item.description ?? item.Description) ? String(item.description ?? item.Description).trim() : undefined,
    isActive: active,
    markedForDeletion: isDeleted,
    markedForDeletionDate: (item.markedForDeletionDate ?? item.MarkedForDeletionDate) ? String(item.markedForDeletionDate ?? item.MarkedForDeletionDate) : null,
    createdDate: (item.createdDate ?? item.CreatedDate) ? String(item.createdDate ?? item.CreatedDate) : undefined,
    updatedDate: (item.updatedDate ?? item.UpdatedDate) ? String(item.updatedDate ?? item.UpdatedDate) : null,
  };
}

export async function getEmpStatusMasterPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<EmpStatusMasterItem>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");
    if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());
    if (isActive !== undefined) params.append("IsActive", isActive.toString());

    const response = await apiClient.get<PagedResponse<EmpStatusMasterItem>>(`${ENDPOINT}?${params.toString()}`);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch employee status masters", "Get employee statuses failed");
    }

    const items = response.data.items ?? [];
    const normalizedItems = items
      .map(normalizeEmpStatusMaster)
      .filter((i) => !i.markedForDeletion);
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
    logger.error("Error fetching paged employee status masters", { error: error as Error });
    throw error;
  }
}

export async function createEmpStatusMaster(
  data: Omit<EmpStatusMasterItem, "employeeStatusId">,
  userId?: number
): Promise<EmpStatusMasterItem> {
  try {
    const payload: Record<string, unknown> = {
      employeeStatusCode: data.employeeStatusCode,
      employeeStatus: data.employeeStatus,
      isActive: Boolean(data.isActive),
    };
    if (data.employeeStatusMarathi !== undefined) payload.employeeStatusMarathi = data.employeeStatusMarathi;
    if (data.description !== undefined) payload.description = data.description;
    if (userId != null) payload.createdBy = userId;

    const response = await apiClient.post<EmpStatusMasterItem>(ENDPOINT, payload);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to create employee status master", "Create employee status failed");
    }
    return normalizeEmpStatusMaster(response.data);
  } catch (error) {
    logger.error("Error creating employee status master", { error: error as Error });
    throw error;
  }
}

export async function updateEmpStatusMaster(
  id: string,
  data: Partial<EmpStatusMasterItem | EmpStatusMasterPayload>,
  userId?: number
): Promise<EmpStatusMasterItem> {
  try {
    const payload: Record<string, unknown> = {};
    if (data.employeeStatusCode !== undefined) payload.employeeStatusCode = data.employeeStatusCode;
    if (data.employeeStatus !== undefined) payload.employeeStatus = data.employeeStatus;
    if (data.employeeStatusMarathi !== undefined) payload.employeeStatusMarathi = data.employeeStatusMarathi;
    if (data.description !== undefined) payload.description = data.description;
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);
    if (userId != null) payload.updatedBy = userId;

    const response = await apiClient.put<EmpStatusMasterItem>(`${ENDPOINT}/${encodeURIComponent(id)}`, payload);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to update employee status master", "Update employee status failed");
    }
    return normalizeEmpStatusMaster(response.data);
  } catch (error) {
    logger.error(`Error updating employee status master ${id}`, { error: error as Error });
    throw error;
  }
}

export async function deleteEmpStatusMaster(id: string): Promise<void> {
  try {
    const response = await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(id)}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to delete employee status master", "Delete employee status failed");
    }
  } catch (error) {
    logger.error(`Error deleting employee status master ${id}`, { error: error as Error });
    throw error;
  }
}
