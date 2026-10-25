import { apiClient } from "@/services/api.service";
import { SubZoneDetails, SubZoneFormModel } from "@/types/asset-masters/mouja-subzone.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

// ==========================================
// SUBZONE MASTER SERVICES
// ==========================================

export async function getSubZonesPaged(
  pageNumber: number,
  pageSize: number,
  moujaId?: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<SubZoneDetails>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");

    if (moujaId !== undefined) {
      params.append("MoujaId", moujaId.toString());
    }

    const safeSearchTerm = searchTerm?.trim();
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<SubZoneDetails>>(`/asset-management/sub-zone-details-cv?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged SubZones", "Get paged SubZones failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return response.data;
  } catch (error) {
    logger.error("Error fetching paged SubZones", { error: error as Error });
    throw error;
  }
}

export async function getSubZoneById(subZoneId: number): Promise<SubZoneDetails | null> {
  try {
    if (typeof subZoneId !== "number" || subZoneId <= 0 || !Number.isFinite(subZoneId)) {
      throw new ApiError(400, "Valid SubZone ID is required", "Invalid ID");
    }
    const response = await apiClient.get<SubZoneDetails>(`/asset-management/sub-zone-details-cv/${encodeURIComponent(String(subZoneId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch SubZone Details", `Get SubZone ${subZoneId} failed`);
    }
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching SubZone ${subZoneId}`, { error: error as Error });
    throw error;
  }
}

export async function createSubZone(data: SubZoneFormModel): Promise<string | undefined> {
  try {
    if (
      typeof data.moujaId !== "number" ||
      !Number.isFinite(data.moujaId) ||
      data.moujaId <= 0 ||
      !data.subZoneNo?.trim() ||
      !data.subZoneName?.trim()
    ) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      moujaId: data.moujaId,
      subZoneNo: data.subZoneNo.trim(),
      subZoneName: data.subZoneName.trim(),
      isActive: data.isActive,
      createdBy: data.createdBy ?? null,
    };
    const response = await apiClient.post<{ message?: string }>("/asset-management/sub-zone-details-cv", payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Create SubZone failed",
        "Create SubZone failed"
      );
    }
    return response.data?.message;
  } catch (error) {
    logger.error("Error creating SubZone", { error: error as Error });
    throw error;
  }
}

export async function updateSubZone(data: SubZoneFormModel): Promise<string | undefined> {
  try {
    if (
      !data.id ||
      data.id <= 0 ||
      typeof data.moujaId !== "number" ||
      !Number.isFinite(data.moujaId) ||
      data.moujaId <= 0 ||
      !data.subZoneNo?.trim() ||
      !data.subZoneName?.trim()
    ) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      id: data.id,
      moujaId: data.moujaId,
      subZoneNo: data.subZoneNo.trim(),
      subZoneName: data.subZoneName.trim(),
      isActive: data.isActive,
      updatedBy: data.updatedBy ?? null,
    };
    const response = await apiClient.put<{ message?: string }>(`/asset-management/sub-zone-details-cv/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Update SubZone failed",
        "Update SubZone failed"
      );
    }
    return response.data?.message;
  } catch (error) {
    logger.error("Error updating SubZone", { error: error as Error });
    throw error;
  }
}

export async function deleteSubZone(id: number): Promise<void> {
  try {
    if (typeof id !== "number" || id <= 0 || !Number.isFinite(id)) {
      throw new ApiError(400, "Valid SubZone ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/asset-management/sub-zone-details-cv/${encodeURIComponent(String(id))}`);
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
      throw new ApiError(statusCode, errorMsg || "Failed to delete SubZone", `Delete SubZone ${id} failed`);
    }
  } catch (error) {
    logger.error(`Error deleting SubZone ${id}`, { error: error as Error });
    throw error;
  }
}
