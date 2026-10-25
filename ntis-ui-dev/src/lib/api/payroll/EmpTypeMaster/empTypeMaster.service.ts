import { apiClient } from "@/services/api.service";
import type { EmpTypeMasterItem } from "@/types/payroll/MasterModule";
import type { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { isRecordMarkedForDeletion, parseIsActive } from "@/lib/utils/payroll.utils";

export { isRecordMarkedForDeletion, parseIsActive };

const ENDPOINT = "/payroll/employee-type-master";

export function normalizeEmpTypeMaster(raw: unknown): EmpTypeMasterItem {
  const item = (raw || {}) as Record<string, unknown>;
  const rawId = item.employeeTypeId ?? item.id ?? item.EmployeeTypeId ?? item.Id;
  const isDeleted = isRecordMarkedForDeletion(item);
  const active = parseIsActive(item);

  return {
    employeeTypeId: String(rawId ?? item.employeeTypeCode ?? ""),
    employeeTypeCode: String(item.employeeTypeCode ?? item.EmployeeTypeCode ?? "").trim().toUpperCase(),
    employeeTypeName: String(item.employeeTypeName ?? item.EmployeeTypeName ?? "").trim(),
    employeeTypeNameMarathi: String(item.employeeTypeNameMarathi ?? item.EmployeeTypeNameMarathi ?? "").trim(),
    sequenceNo: Number(item.sequenceNo ?? item.SequenceNo ?? 1),
    isActive: active,
    markedForDeletion: isDeleted,
    markedForDeletionDate: (item.markedForDeletionDate ?? item.MarkedForDeletionDate) ? String(item.markedForDeletionDate ?? item.MarkedForDeletionDate) : null,
  };
}

export async function getEmpTypeMasterPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<EmpTypeMasterItem>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");
    if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());
    if (isActive !== undefined) params.append("IsActive", isActive.toString());

    const response = await apiClient.get<PagedResponse<EmpTypeMasterItem>>(`${ENDPOINT}?${params.toString()}`);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch employee type masters", "Get employee types failed");
    }

    const items = response.data.items ?? [];
    const normalizedItems = items
      .map(normalizeEmpTypeMaster)
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
    logger.error("Error fetching paged employee type masters", { error: error as Error });
    throw error;
  }
}

export async function createEmpTypeMaster(
  data: Omit<EmpTypeMasterItem, "employeeTypeId">,
  userId?: number
): Promise<EmpTypeMasterItem> {
  try {
    const payload: Record<string, unknown> = {
      employeeTypeCode: data.employeeTypeCode,
      employeeTypeName: data.employeeTypeName,
      employeeTypeNameMarathi: data.employeeTypeNameMarathi,
      isActive: Boolean(data.isActive),
    };
    if (data.sequenceNo !== undefined) payload.sequenceNo = Number(data.sequenceNo);
    if (userId != null) payload.createdBy = userId;

    const response = await apiClient.post<EmpTypeMasterItem>(ENDPOINT, payload);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to create employee type master", "Create employee type failed");
    }
    return normalizeEmpTypeMaster(response.data);
  } catch (error) {
    logger.error("Error creating employee type master", { error: error as Error });
    throw error;
  }
}

export async function updateEmpTypeMaster(
  id: string,
  data: Partial<EmpTypeMasterItem>,
  userId?: number
): Promise<EmpTypeMasterItem> {
  try {
    const payload: Record<string, unknown> = {};
    if (data.employeeTypeCode !== undefined) payload.employeeTypeCode = data.employeeTypeCode;
    if (data.employeeTypeName !== undefined) payload.employeeTypeName = data.employeeTypeName;
    if (data.employeeTypeNameMarathi !== undefined) payload.employeeTypeNameMarathi = data.employeeTypeNameMarathi;
    if (data.sequenceNo !== undefined) payload.sequenceNo = Number(data.sequenceNo);
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);
    if (userId != null) payload.updatedBy = userId;

    const response = await apiClient.put<EmpTypeMasterItem>(`${ENDPOINT}/${encodeURIComponent(id)}`, payload);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to update employee type master", "Update employee type failed");
    }
    return normalizeEmpTypeMaster(response.data);
  } catch (error) {
    logger.error(`Error updating employee type master ${id}`, { error: error as Error });
    throw error;
  }
}

export async function deleteEmpTypeMaster(id: string): Promise<void> {
  try {
    const response = await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(id)}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to delete employee type master", "Delete employee type failed");
    }
  } catch (error) {
    logger.error(`Error deleting employee type master ${id}`, { error: error as Error });
    throw error;
  }
}
