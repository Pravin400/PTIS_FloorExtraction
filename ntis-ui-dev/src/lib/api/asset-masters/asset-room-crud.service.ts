import { apiClient } from "@/services/api.service";
import { AssetRoomType, AssetRoomTypeFormModel, AssetType, AssetCategory } from "@/types/asset-masters/asset-room-type.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

/** Fetches all asset room types from the API */
export async function getAssetRoomTypes(): Promise<AssetRoomType[]> {
  try {
    const response = await apiClient.get<PagedResponse<AssetRoomType>>("/asset-management/asset-room-type?MarkedForDeletion=false");
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch asset room types", "Get asset room types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data.items ?? [];
  } catch (error) {
    logger.error("Error fetching asset room types", { error: error as Error });
    throw error;
  }
}

/** Fetches paginated asset room types from the API */
export async function getAssetRoomPaged(
  pageNumber: number, pageSize: number, searchTerm?: string, sortBy?: string, sortOrder?: string
): Promise<PagedResponse<AssetRoomType>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");

    const safeSearchTerm = searchTerm?.trim();
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<AssetRoomType>>(`/asset-management/asset-room-type?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged asset room types", "Get paged asset room types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return response.data;
  } catch (error) {
    logger.error("Error fetching paged asset room types", { error: error as Error });
    throw error;
  }
}

/** Fetches a single asset room type by ID */
export async function getAssetRoomTypeById(roomTypeId: number): Promise<AssetRoomType | null> {
  try {
    if (typeof roomTypeId !== "number" || roomTypeId <= 0 || !Number.isFinite(roomTypeId)) {
      throw new ApiError(400, "Valid Asset Room Type ID is required", "Invalid ID");
    }
    const response = await apiClient.get<AssetRoomType>(`/asset-management/asset-room-type/${encodeURIComponent(String(roomTypeId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch asset room type", `Get asset room type ${roomTypeId} failed`);
    }
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching asset room type ${roomTypeId}`, { error: error as Error });
    throw error;
  }
}

/** Creates a new asset room type */
export async function createAssetRoomType(data: AssetRoomTypeFormModel): Promise<string | undefined> {
  try {
    if (!data.roomTypeCode?.trim() || !data.roomTypeName?.trim()) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      isActive: data.isActive,
      createdBy: data.createdBy ?? null,
      assetCategoryId: data.assetCategoryId,
      assetTypeId: data.assetTypeId,
      roomTypeCode: data.roomTypeCode.trim(),
      roomTypeName: data.roomTypeName.trim(),
      description: data.description?.trim() || null,
    };
    const response = await apiClient.post<unknown>("/asset-management/asset-room-type", payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Create asset room type failed",
        "Create asset room type failed"
      );
    }
    return (response.data as { message?: string } | undefined)?.message;
  } catch (error) {
    logger.error("Error creating asset room type", { error: error as Error });
    throw error;
  }
}

/** Updates an existing asset room type */
export async function updateAssetRoomType(data: AssetRoomTypeFormModel): Promise<string | undefined> {
  try {
    if (!data.id || data.id <= 0 || !data.roomTypeCode?.trim() || !data.roomTypeName?.trim()) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      isActive: data.isActive,
      updatedBy: data.updatedBy ?? null,
      assetCategoryId: data.assetCategoryId,
      assetTypeId: data.assetTypeId,
      roomTypeCode: data.roomTypeCode.trim(),
      roomTypeName: data.roomTypeName.trim(),
      description: data.description?.trim() || null,
    };
    const response = await apiClient.put<unknown>(`/asset-management/asset-room-type/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Update asset room type failed",
        "Update asset room type failed"
      );
    }
    return (response.data as { message?: string } | undefined)?.message;
  } catch (error) {
    logger.error("Error updating asset room type", { error: error as Error });
    throw error;
  }
}

/** Deletes an asset room type by ID */
export async function deleteAssetRoomType(id: number): Promise<void> {
  try {
    if (typeof id !== "number" || id <= 0 || !Number.isFinite(id)) {
      throw new ApiError(400, "Valid Asset Room Type ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/asset-management/asset-room-type/${encodeURIComponent(String(id))}`);
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
      throw new ApiError(statusCode, errorMsg || "Failed to delete asset room type", `Delete asset room type ${id} failed`);
    }
  } catch (error) {
    logger.error(`Error deleting asset room type ${id}`, { error: error as Error });
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

