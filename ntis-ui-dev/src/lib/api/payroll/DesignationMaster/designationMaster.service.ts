import { apiClient } from "@/services/api.service";
import type { DesignationMasterItem } from "@/types/payroll/MasterModule";
import type { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { isRecordMarkedForDeletion } from "@/lib/utils/payroll.utils";

const ENDPOINT = "/payroll/designation-master";

/**
 * Normalizes backend DTO to frontend DesignationMasterItem
 */
export function normalizeDesignationMaster(raw: unknown): DesignationMasterItem {
  const item = (raw || {}) as Record<string, unknown>;
  const rawId = item.id ?? item.designationId;
  const numId = typeof rawId === "number" ? rawId : parseInt(String(rawId), 10);

  return {
    id: !isNaN(numId) ? numId : undefined,
    designationId: String(rawId ?? item.designationCode ?? ""),
    designationCode: String(item.designationCode ?? "").trim().toUpperCase(),
    designationName: String(item.designationName ?? "").trim(),
    designationNameMarathi: String(item.designationNameMarathi ?? "").trim(),
    departmentId: item.departmentId != null ? Number(item.departmentId) : null,
    description: item.description ? String(item.description).trim() : undefined,
    bandId: item.bandId != null ? Number(item.bandId) : null,
    gradePrefix: item.gradePrefix ? String(item.gradePrefix).trim() : null,
    level: item.level != null ? Number(item.level) : null,
    markedForDeletion: isRecordMarkedForDeletion(item),
    markedForDeletionDate: item.markedForDeletionDate ? String(item.markedForDeletionDate) : null,
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    createdDate: item.createdDate ? String(item.createdDate) : undefined,
    updatedDate: item.updatedDate ? String(item.updatedDate) : null,
  };
}

/** Fetches all designation masters from the API */
export async function getDesignationMaster(): Promise<DesignationMasterItem[]> {
  try {
    const response = await apiClient.get<PagedResponse<DesignationMasterItem>>(`${ENDPOINT}?MarkedForDeletion=false`);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch designation masters",
        "Get designation master failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    const items = response.data.items ?? [];
    return items.map(normalizeDesignationMaster).filter((item) => !isRecordMarkedForDeletion(item));
  } catch (error) {
    logger.error("Error fetching designation masters", { error: error as Error });
    throw error;
  }
}

/** Fetches paginated designation masters from the API */
export async function getDesignationMasterPaged(
  pageNumber: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<DesignationMasterItem>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");

    if (searchTerm && searchTerm.trim()) params.append("SearchTerm", searchTerm.trim());
    if (typeof sortBy === "string" && sortBy.trim()) params.append("SortBy", sortBy.trim());
    if (typeof sortOrder === "string" && sortOrder.trim()) params.append("SortOrder", sortOrder.trim());
    if (typeof isActive === "boolean") params.append("IsActive", isActive.toString());

    const response = await apiClient.get<PagedResponse<DesignationMasterItem>>(`${ENDPOINT}?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch paged designation masters",
        "Get paged designation master failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const items = response.data.items ?? [];
    const normalizedItems = items.map(normalizeDesignationMaster).filter((item) => !isRecordMarkedForDeletion(item));
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
    logger.error("Error fetching paged designation masters", { error: error as Error });
    throw error;
  }
}

/**
 * Creates a new designation master record
 */
export async function createDesignationMaster(
  data: Omit<DesignationMasterItem, "designationId" | "id">,
  userId?: number
): Promise<DesignationMasterItem> {
  try {
    const payload: Record<string, unknown> = {
      designationCode: data.designationCode,
      designationName: data.designationName,
      designationNameMarathi: data.designationNameMarathi || '',
      isActive: Boolean(data.isActive),
    };
    if (data.departmentId !== undefined && data.departmentId !== null) payload.departmentId = Number(data.departmentId);
    if (data.description !== undefined) payload.description = data.description;
    if (data.bandId !== undefined && data.bandId !== null) payload.bandId = Number(data.bandId);
    if (data.gradePrefix !== undefined && data.gradePrefix !== null) payload.gradePrefix = data.gradePrefix;
    if (data.level !== undefined && data.level !== null) payload.level = Number(data.level);
    if (userId != null) payload.createdBy = userId;

    const response = await apiClient.post<DesignationMasterItem>(ENDPOINT, payload);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to create designation master",
        "Create designation master failed"
      );
    }
    return normalizeDesignationMaster(response.data);
  } catch (error) {
    logger.error("Error creating designation master", { error: error as Error });
    throw error;
  }
}

/**
 * Updates an existing designation master record
 */
export async function updateDesignationMaster(
  idOrCode: string | number,
  data: Partial<DesignationMasterItem>,
  userId?: number
): Promise<DesignationMasterItem> {
  try {
    const payload: Record<string, unknown> = {};
    if (data.designationCode !== undefined) payload.designationCode = data.designationCode;
    if (data.designationName !== undefined) payload.designationName = data.designationName;
    if (data.designationNameMarathi !== undefined) payload.designationNameMarathi = data.designationNameMarathi;
    if (data.departmentId !== undefined) payload.departmentId = data.departmentId != null ? Number(data.departmentId) : null;
    if (data.description !== undefined) payload.description = data.description;
    if (data.bandId !== undefined) payload.bandId = data.bandId != null ? Number(data.bandId) : null;
    if (data.gradePrefix !== undefined) payload.gradePrefix = data.gradePrefix;
    if (data.level !== undefined) payload.level = data.level != null ? Number(data.level) : null;
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);
    if (userId != null) payload.updatedBy = userId;

    const response = await apiClient.put<DesignationMasterItem>(
      `${ENDPOINT}/${encodeURIComponent(String(idOrCode))}`,
      payload
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to update designation master",
        "Update designation master failed"
      );
    }
    return normalizeDesignationMaster(response.data);
  } catch (error) {
    logger.error(`Error updating designation master ${idOrCode}`, { error: error as Error });
    throw error;
  }
}

/**
 * Deletes a designation master record
 */
export async function deleteDesignationMaster(idOrCode: string | number): Promise<void> {
  try {
    const response = await apiClient.delete<void>(
      `${ENDPOINT}/${encodeURIComponent(String(idOrCode))}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to delete designation master",
        "Delete designation master failed"
      );
    }
  } catch (error) {
    logger.error(`Error deleting designation master ${idOrCode}`, { error: error as Error });
    throw error;
  }
}
