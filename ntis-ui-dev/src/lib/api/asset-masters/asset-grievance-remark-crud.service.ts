import { apiClient } from "@/services/api.service";
import { AssetGrievanceRemark, AssetGrievanceRemarkFormModel } from "@/types/asset-masters/asset-grievance-remark.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

const ENDPOINT = "/asset-management/asset-grievance-remark";

/** Fetches paginated asset grievance remarks from the API */
export async function getAssetGrievanceRemarkPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetGrievanceRemark>> {
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

    const response = await apiClient.get<PagedResponse<AssetGrievanceRemark>>(`${ENDPOINT}?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged asset grievance remarks", "Get paged grievance remarks failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    logger.error("Error fetching paged asset grievance remarks", { error: error as Error });
    throw error;
  }
}

/** Fetches a single asset grievance remark by ID */
export async function getAssetGrievanceRemarkById(remarkId: number): Promise<AssetGrievanceRemark | null> {
  try {
    if (typeof remarkId !== "number" || remarkId <= 0 || !Number.isFinite(remarkId)) {
      throw new ApiError(400, "Valid Asset Grievance Remark ID is required", "Invalid ID");
    }
    const response = await apiClient.get<AssetGrievanceRemark>(`${ENDPOINT}/${encodeURIComponent(String(remarkId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch asset grievance remark", `Get grievance remark ${remarkId} failed`);
    }
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching asset grievance remark ${remarkId}`, { error: error as Error });
    throw error;
  }
}

/** Creates a new asset grievance remark */
export async function createAssetGrievanceRemark(
  data: AssetGrievanceRemarkFormModel & { createdBy: number }
): Promise<string | undefined> {
  try {
    if (!data.remark?.trim() || !data.grievanceCategoryId) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      grievanceCategoryId: data.grievanceCategoryId,
      remark: data.remark.trim(),
      description: data.description?.trim() || null,
      isActive: data.isActive,
      createdBy: data.createdBy,
    };
    const response = await apiClient.post<unknown>(ENDPOINT, payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Create asset grievance remark failed",
        "Create asset grievance remark failed"
      );
    }
    return (response.data as { message?: string } | undefined)?.message;
  } catch (error) {
    logger.error("Error creating asset grievance remark", { error: error as Error });
    throw error;
  }
}

/** Updates an existing asset grievance remark */
export async function updateAssetGrievanceRemark(
  data: AssetGrievanceRemarkFormModel & { updatedBy: number }
): Promise<string | undefined> {
  try {
    if (!data.id || data.id <= 0 || !data.remark?.trim() || !data.grievanceCategoryId) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      id: data.id,
      grievanceCategoryId: data.grievanceCategoryId,
      remark: data.remark.trim(),
      description: data.description?.trim() || null,
      isActive: data.isActive,
      updatedBy: data.updatedBy,
    };
    const response = await apiClient.put<unknown>(`${ENDPOINT}/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Update asset grievance remark failed",
        "Update asset grievance remark failed"
      );
    }
    return (response.data as { message?: string } | undefined)?.message;
  } catch (error) {
    logger.error("Error updating asset grievance remark", { error: error as Error });
    throw error;
  }
}

/** Deletes an asset grievance remark by ID */
export async function deleteAssetGrievanceRemark(id: number): Promise<void> {
  try {
    if (typeof id !== "number" || id <= 0 || !Number.isFinite(id)) {
      throw new ApiError(400, "Valid Asset Grievance Remark ID is required", "Validation failed");
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
      throw new ApiError(statusCode, errorMsg || "Failed to delete asset grievance remark", `Delete grievance remark ${id} failed`);
    }
  } catch (error) {
    logger.error(`Error deleting asset grievance remark ${id}`, { error: error as Error });
    throw error;
  }
}
