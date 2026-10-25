import { apiClient } from "@/services/api.service";
import { Mouja, MoujaFormModel } from "@/types/asset-masters/mouja-subzone.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

export * from "./subzone.service";

// ==========================================
// MOUJA MASTER SERVICES
// ==========================================

export async function getMoujasPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<Mouja>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");

    const safeSearchTerm = searchTerm?.trim();
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<Mouja>>(`/asset-management/mouja?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged Moujas", "Get paged Moujas failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return response.data;
  } catch (error) {
    logger.error("Error fetching paged Moujas", { error: error as Error });
    throw error;
  }
}

export async function getMoujasAllActive(): Promise<Mouja[]> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", "1");
    params.append("PageSize", "-1");
    params.append("IsActive", "true");
    params.append("MarkedForDeletion", "false");

    const response = await apiClient.get<PagedResponse<Mouja>>(`/asset-management/mouja?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch active Moujas", "Get active Moujas failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return response.data.items ?? [];
  } catch (error) {
    logger.error("Error fetching active Moujas", { error: error as Error });
    throw error;
  }
}

export async function getMoujaById(moujaId: number): Promise<Mouja | null> {
  try {
    if (typeof moujaId !== "number" || moujaId <= 0 || !Number.isFinite(moujaId)) {
      throw new ApiError(400, "Valid Mouja ID is required", "Invalid ID");
    }
    const response = await apiClient.get<Mouja>(`/asset-management/mouja/${encodeURIComponent(String(moujaId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch Mouja", `Get Mouja ${moujaId} failed`);
    }
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching Mouja ${moujaId}`, { error: error as Error });
    throw error;
  }
}

export async function createMouja(data: MoujaFormModel): Promise<string | undefined> {
  try {
    if (!data.moujaNo?.trim() || !data.moujaName?.trim()) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      moujaNo: data.moujaNo.trim(),
      moujaName: data.moujaName.trim(),
      isActive: data.isActive,
      createdBy: data.createdBy ?? null,
    };
    const response = await apiClient.post<{ message?: string }>("/asset-management/mouja", payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Create Mouja failed",
        "Create Mouja failed"
      );
    }
    return response.data?.message;
  } catch (error) {
    logger.error("Error creating Mouja", { error: error as Error });
    throw error;
  }
}

export async function updateMouja(data: MoujaFormModel): Promise<string | undefined> {
  try {
    if (!data.id || data.id <= 0 || !data.moujaNo?.trim() || !data.moujaName?.trim()) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      id: data.id,
      moujaNo: data.moujaNo.trim(),
      moujaName: data.moujaName.trim(),
      isActive: data.isActive,
      updatedBy: data.updatedBy ?? null,
    };
    const response = await apiClient.put<{ message?: string }>(`/asset-management/mouja/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Update Mouja failed",
        "Update Mouja failed"
      );
    }
    return response.data?.message;
  } catch (error) {
    logger.error("Error updating Mouja", { error: error as Error });
    throw error;
  }
}

export async function deleteMouja(id: number): Promise<void> {
  try {
    if (typeof id !== "number" || id <= 0 || !Number.isFinite(id)) {
      throw new ApiError(400, "Valid Mouja ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/asset-management/mouja/${encodeURIComponent(String(id))}`);
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
      throw new ApiError(statusCode, errorMsg || "Failed to delete Mouja", `Delete Mouja ${id} failed`);
    }
  } catch (error) {
    logger.error(`Error deleting Mouja ${id}`, { error: error as Error });
    throw error;
  }
}
