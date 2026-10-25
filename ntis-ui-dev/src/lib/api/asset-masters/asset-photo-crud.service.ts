import { apiClient } from "@/services/api.service";
import { AssetPhotoType, AssetPhotoTypeFormModel, AssetCategory, AssetType } from "@/types/asset-masters/asset-photo-type.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

/** Fetches all asset photo types from the API */
export async function getAssetPhotoTypes(): Promise<AssetPhotoType[]> {
  try {
    const response = await apiClient.get<PagedResponse<AssetPhotoType>>("/asset-management/photo-type?MarkedForDeletion=false");
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch asset photo types", "Get asset photo types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data.items ?? [];
  } catch (error) {
    logger.error("Error fetching asset photo types", { error: error as Error });
    throw error;
  }
}

/** Fetches paginated asset photo types from the API */
export async function getAssetPhotoPaged(
  pageNumber: number, pageSize: number, searchTerm?: string, sortBy?: string, sortOrder?: string
): Promise<PagedResponse<AssetPhotoType>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");

    const safeSearchTerm = searchTerm?.trim();
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<AssetPhotoType>>(`/asset-management/photo-type?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged asset photo types", "Get paged asset photo types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return response.data;
  } catch (error) {
    logger.error("Error fetching paged asset photo types", { error: error as Error });
    throw error;
  }
}

/** Fetches a single asset photo type by ID */
export async function getAssetPhotoTypeById(photoTypeId: number): Promise<AssetPhotoType | null> {
  try {
    if (typeof photoTypeId !== "number" || photoTypeId <= 0 || !Number.isFinite(photoTypeId)) {
      throw new ApiError(400, "Valid Asset Photo Type ID is required", "Invalid ID");
    }
    const response = await apiClient.get<AssetPhotoType>(`/asset-management/photo-type/${encodeURIComponent(String(photoTypeId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch asset photo type", `Get asset photo type ${photoTypeId} failed`);
    }
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching asset photo type ${photoTypeId}`, { error: error as Error });
    throw error;
  }
}

/** Creates a new asset photo type */
export async function createAssetPhotoType(data: AssetPhotoTypeFormModel): Promise<string | undefined> {
  try {
    if (!data.photoTypeCode?.trim() || !data.photoTypeName?.trim()) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      photoTypeCode: data.photoTypeCode.trim(),
      photoTypeName: data.photoTypeName.trim(),
      description: data.description?.trim() || null,
      displayOrder: Number(data.displayOrder) || 0,
      isActive: data.isActive,
      createdBy: data.createdBy ?? null,
      assetCategoryId: data.assetCategoryId,
      assetTypeId: data.assetTypeId,
      isRequired: data.isRequired,
      isSubUnit: data.isSubUnit,
    };
    const response = await apiClient.post<unknown>("/asset-management/photo-type", payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Create asset photo type failed",
        "Create asset photo type failed"
      );
    }
    return (response.data as { message?: string } | undefined)?.message;
  } catch (error) {
    logger.error("Error creating asset photo type", { error: error as Error });
    throw error;
  }
}

/** Updates an existing asset photo type */
export async function updateAssetPhotoType(data: AssetPhotoTypeFormModel): Promise<string | undefined> {
  try {
    if (!data.id || data.id <= 0 || !data.photoTypeCode?.trim() || !data.photoTypeName?.trim()) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      id: data.id,
      photoTypeCode: data.photoTypeCode.trim(),
      photoTypeName: data.photoTypeName.trim(),
      description: data.description?.trim() || null,
      displayOrder: Number(data.displayOrder) || 0,
      isActive: data.isActive,
      updatedBy: data.updatedBy ?? null,
      assetCategoryId: data.assetCategoryId,
      assetTypeId: data.assetTypeId,
      isRequired: data.isRequired,
      isSubUnit: data.isSubUnit,
    };
    const response = await apiClient.put<unknown>(`/asset-management/photo-type/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Update asset photo type failed",
        "Update asset photo type failed"
      );
    }
    return (response.data as { message?: string } | undefined)?.message;
  } catch (error) {
    logger.error("Error updating asset photo type", { error: error as Error });
    throw error;
  }
}

/** Deletes an asset photo type by ID */
export async function deleteAssetPhotoType(id: number): Promise<void> {
  try {
    if (typeof id !== "number" || id <= 0 || !Number.isFinite(id)) {
      throw new ApiError(400, "Valid Asset Photo Type ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/asset-management/photo-type/${encodeURIComponent(String(id))}`);

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
      throw new ApiError(statusCode, errorMsg || "Failed to delete asset photo type", `Delete asset photo type ${id} failed`);
    }
  } catch (error) {
    logger.error(`Error deleting asset photo type ${id}`, { error: error as Error });
    throw error;
  }
}


/** Fetches active asset categories from the API */
export async function getAssetCategories(): Promise<AssetCategory[]> {
  try {
    const qs = new URLSearchParams();
    qs.set("PageNumber", "1");
    qs.set("PageSize", "-1");
    qs.set("IsActive", "true");
    const response = await apiClient.get<PagedResponse<AssetCategory>>(`/AssetCategory?${qs.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch asset categories", "Get asset categories failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data.items ?? [];
  } catch (error) {
    logger.error("Error fetching asset categories", { error: error as Error });
    throw error;
  }
}

/** Fetches active asset types from the API */
export async function getAssetTypes(assetCategoryId?: number): Promise<AssetType[]> {
  try {
    const qs = new URLSearchParams();
    qs.set("PageNumber", "1");
    qs.set("PageSize", "-1");
    qs.set("IsActive", "true");
    if (Number.isFinite(assetCategoryId ?? NaN) && (assetCategoryId ?? 0) > 0) {
      qs.set("AssetCategoryId", String(assetCategoryId));
    }
    const response = await apiClient.get<PagedResponse<AssetType>>(`/AssetType?${qs.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch asset types", "Get asset types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data.items ?? [];
  } catch (error) {
    logger.error("Error fetching asset types", { error: error as Error });
    throw error;
  }
}


