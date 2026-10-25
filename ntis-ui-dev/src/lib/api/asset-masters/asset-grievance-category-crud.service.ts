import { apiClient } from "@/services/api.service";
import { AssetGrievanceCategory, AssetGrievanceCategoryFormModel } from "@/types/asset-masters/asset-grievance-category.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { parseBoolean } from "@/lib/utils/type-guards";

const ENDPOINT = "/asset-management/asset-grievance-category";

/** Fetches all active grievance categories for dropdown lists */
export async function getAssetGrievanceCategories(): Promise<AssetGrievanceCategory[]> {
  try {
    const response = await apiClient.get<PagedResponse<AssetGrievanceCategory>>(
      `${ENDPOINT}?IsActive=true&MarkedForDeletion=false&PageSize=-1`
    );
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch asset grievance categories", "Get grievance categories failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data.items ?? [];
  } catch (error) {
    logger.error("Error fetching asset grievance categories", { error: error as Error });
    throw error;
  }
}

/** Fetches paginated asset grievance categories from the API */
export async function getAssetGrievanceCategoryPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetGrievanceCategory>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");
    
    // NOTE: The backend API defaults to returning only active records (IsActive=true) 
    // when this parameter is omitted. We explicitly pass an empty string ("") here 
    // to override the default filter, allowing us to fetch both active and inactive 
    // records for the master listing screen.
    params.append("IsActive", "");

    const safeSearchTerm = searchTerm?.trim();
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<AssetGrievanceCategory>>(`${ENDPOINT}?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged asset grievance categories", "Get paged grievance categories failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error fetching paged asset grievance categories", { error: error as Error });
    throw error;
  }
}

/** Fetches a single asset grievance category by ID */
export async function getAssetGrievanceCategoryById(categoryId: number): Promise<AssetGrievanceCategory | null> {
  try {
    if (typeof categoryId !== "number" || categoryId <= 0 || !Number.isFinite(categoryId)) {
      throw new ApiError(400, "Valid Asset Grievance Category ID is required", "Invalid ID");
    }
    const response = await apiClient.get<AssetGrievanceCategory>(`${ENDPOINT}/${encodeURIComponent(String(categoryId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch asset grievance category", `Get grievance category ${categoryId} failed`);
    }
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching asset grievance category ${categoryId}`, { error: error as Error });
    throw error;
  }
}

/** Creates a new asset grievance category */
export async function createAssetGrievanceCategory(
  data: AssetGrievanceCategoryFormModel & { createdBy: number }
): Promise<string | undefined> {
  try {
    if (!data.grievanceTypeCode?.trim() || !data.grievanceTypeName?.trim() || !data.codeFormat?.trim()) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      grievanceTypeCode: data.grievanceTypeCode.trim(),
      grievanceTypeName: data.grievanceTypeName.trim(),
      grievanceTypeNameLocal: data.grievanceTypeNameLocal?.trim() || null,
      description: data.description?.trim() || null,
      targetTableName: data.targetTableName?.trim() || null,

      slaDays: data.slaDays != null && !isNaN(Number(data.slaDays)) ? Number(data.slaDays) : null,
      codeFormat: data.codeFormat.trim(),
      displaySequence: Number(data.displaySequence) || 0,
      isActive: parseBoolean(data.isActive),
      createdBy: data.createdBy,
    };
    const response = await apiClient.post<unknown>(ENDPOINT, payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Create asset grievance category failed",
        "Create asset grievance category failed"
      );
    }
    return (response.data as { message?: string } | undefined)?.message;
  } catch (error) {
    logger.error("Error creating asset grievance category", { error: error as Error });
    throw error;
  }
}

/** Updates an existing asset grievance category */
export async function updateAssetGrievanceCategory(
  data: AssetGrievanceCategoryFormModel & { updatedBy: number }
): Promise<string | undefined> {
  try {
    if (!data.id || data.id <= 0 || !data.grievanceTypeCode?.trim() || !data.grievanceTypeName?.trim() || !data.codeFormat?.trim()) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      id: data.id,
      grievanceTypeCode: data.grievanceTypeCode.trim(),
      grievanceTypeName: data.grievanceTypeName.trim(),
      grievanceTypeNameLocal: data.grievanceTypeNameLocal?.trim() || null,
      description: data.description?.trim() || null,
      targetTableName: data.targetTableName?.trim() || null,

      slaDays: data.slaDays != null && !isNaN(Number(data.slaDays)) ? Number(data.slaDays) : null,
      codeFormat: data.codeFormat.trim(),
      displaySequence: Number(data.displaySequence) || 0,
      isActive: parseBoolean(data.isActive),
      updatedBy: data.updatedBy,
    };
    const response = await apiClient.put<unknown>(`${ENDPOINT}/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Update asset grievance category failed",
        "Update asset grievance category failed"
      );
    }
    return (response.data as { message?: string } | undefined)?.message;
  } catch (error) {
    logger.error("Error updating asset grievance category", { error: error as Error });
    throw error;
  }
}

/** Deletes an asset grievance category by ID */
export async function deleteAssetGrievanceCategory(id: number): Promise<void> {
  try {
    if (typeof id !== "number" || id <= 0 || !Number.isFinite(id)) {
      throw new ApiError(400, "Valid Asset Grievance Category ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(String(id))}`);
    if (!response.success) {
      const errorMsg = response.error || "";
      const lowerMsg = errorMsg.toLowerCase();
      let statusCode = response.statusCode;
      if (!statusCode) {
        if (lowerMsg.includes("not found") || lowerMsg.includes("does not exist")) {
          statusCode = 404;
        } else if (
          lowerMsg.includes("in use") ||
          lowerMsg.includes("linked") ||
          lowerMsg.includes("referenced") ||
          lowerMsg.includes("associated") ||
          lowerMsg.includes("cannot delete")
        ) {
          statusCode = 409;
        } else {
          statusCode = 500;
        }
      }
      throw new ApiError(statusCode, errorMsg || "Failed to delete asset grievance category", `Delete grievance category ${id} failed`);
    }
  } catch (error) {
    logger.error(`Error deleting asset grievance category ${id}`, { error: error as Error });
    throw error;
  }
}
