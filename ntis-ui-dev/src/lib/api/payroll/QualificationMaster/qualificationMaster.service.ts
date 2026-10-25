import { apiClient } from "@/services/api.service";
import type { QualificationMasterItem } from "@/types/payroll/MasterModule";
import type { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { isRecordMarkedForDeletion } from "@/lib/utils/payroll.utils";

const ENDPOINT = "/payroll/qualification-master";

/**
 * Normalizes backend DTO to frontend QualificationMasterItem
 */
export function normalizeQualificationMaster(raw: unknown): QualificationMasterItem {
  const item = (raw || {}) as Record<string, unknown>;
  const rawId = item.id ?? item.qualificationId;
  const numId = typeof rawId === "number" ? rawId : parseInt(String(rawId), 10);

  return {
    id: !isNaN(numId) ? numId : undefined,
    qualificationId: String(rawId ?? item.qualificationCode ?? ""),
    qualificationCode: String(item.qualificationCode ?? "").trim().toUpperCase(),
    qualificationName: String(item.qualificationName ?? "").trim(),
    qualificationNameRegional: String(item.qualificationNameRegional ?? item.qualificationNameMarathi ?? "").trim(),
    description: item.description ? String(item.description).trim() : undefined,
    sequenceNo: item.sequenceNo !== undefined && item.sequenceNo !== null ? Number(item.sequenceNo) : undefined,
    markedForDeletion: isRecordMarkedForDeletion(item),
    markedForDeletionDate: item.markedForDeletionDate ? String(item.markedForDeletionDate) : null,
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    createdDate: item.createdDate ? String(item.createdDate) : undefined,
    updatedDate: item.updatedDate ? String(item.updatedDate) : null,
  };
}

/** Fetches all active qualification masters from the API */
export async function getQualificationMaster(): Promise<QualificationMasterItem[]> {
  try {
    const response = await apiClient.get<PagedResponse<QualificationMasterItem>>(ENDPOINT);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch qualification masters", "Get qualification master failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    const items = response.data.items ?? [];
    return items.map(normalizeQualificationMaster).filter((item) => !isRecordMarkedForDeletion(item));
  } catch (error) {
    logger.error("Error fetching qualification masters", { error: error as Error });
    throw error;
  }
}

/** Fetches paginated qualification masters from the API */
export async function getQualificationMasterPaged(
  pageNumber: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<QualificationMasterItem>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    if (searchTerm && searchTerm.trim()) params.append("SearchTerm", searchTerm.trim());
    if (typeof sortBy === "string" && sortBy.trim()) params.append("SortBy", sortBy.trim());
    if (typeof sortOrder === "string" && sortOrder.trim()) params.append("SortOrder", sortOrder.trim());
    if (typeof isActive === "boolean") params.append("IsActive", isActive.toString());

    const response = await apiClient.get<PagedResponse<QualificationMasterItem>>(`${ENDPOINT}?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch paged qualification masters",
        "Get paged qualification master failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const items = response.data.items ?? [];
    const normalizedItems = items.map(normalizeQualificationMaster).filter((item) => !isRecordMarkedForDeletion(item));
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
    logger.error("Error fetching paged qualification masters", { error: error as Error });
    throw error;
  }
}

/**
 * Creates a new qualification master record
 */
export async function createQualificationMaster(
  data: Omit<QualificationMasterItem, "qualificationId" | "id">
): Promise<QualificationMasterItem> {
  try {
    const payload: Record<string, unknown> = {
      qualificationCode: String(data.qualificationCode ?? '').trim().toUpperCase(),
      qualificationName: String(data.qualificationName ?? '').trim(),
      qualificationNameRegional: String(data.qualificationNameRegional ?? '').trim(),
      isActive: Boolean(data.isActive),
    };

    const response = await apiClient.post<QualificationMasterItem>(ENDPOINT, payload);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to create qualification master",
        "Create qualification master failed"
      );
    }
    return normalizeQualificationMaster(response.data);
  } catch (error) {
    logger.error("Error creating qualification master", { error: error as Error });
    throw error;
  }
}

/**
 * Updates an existing qualification master record
 */
export async function updateQualificationMaster(
  id: string | number,
  data: Partial<QualificationMasterItem>
): Promise<QualificationMasterItem> {
  try {
    const payload: Record<string, unknown> = {};
    if (data.qualificationCode !== undefined) payload.qualificationCode = String(data.qualificationCode).trim().toUpperCase();
    if (data.qualificationName !== undefined) payload.qualificationName = String(data.qualificationName).trim();
    if (data.qualificationNameRegional !== undefined) {
      payload.qualificationNameRegional = String(data.qualificationNameRegional).trim();
    }
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);

    const response = await apiClient.put<QualificationMasterItem>(`${ENDPOINT}/${encodeURIComponent(String(id))}`, payload);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to update qualification master",
        "Update qualification master failed"
      );
    }
    return normalizeQualificationMaster(response.data);
  } catch (error) {
    logger.error(`Error updating qualification master ${id}`, { error: error as Error });
    throw error;
  }
}

/**
 * Deletes a qualification master record
 */
export async function deleteQualificationMaster(id: string | number): Promise<void> {
  try {
    const response = await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(String(id))}`);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to delete qualification master",
        "Delete qualification master failed"
      );
    }
  } catch (error) {
    logger.error(`Error deleting qualification master ${id}`, { error: error as Error });
    throw error;
  }
}
