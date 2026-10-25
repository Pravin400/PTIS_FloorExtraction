import { apiClient } from "@/services/api.service";
import { Designation, DesignationFormModel, OwningDepartment } from "@/types/asset-masters/designation.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

/** Fetches all active owning departments for dropdown */
export async function getOwningDepartments(): Promise<OwningDepartment[]> {
  try {
    const qs = new URLSearchParams();
    qs.set("PageNumber", "1");
    qs.set("PageSize", "-1");
    qs.set("IsActive", "true");
    const response = await apiClient.get<PagedResponse<OwningDepartment>>(`/OwningDepartment?${qs.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch owning departments", "Get departments failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data.items ?? [];
  } catch (error) {
    logger.error("Error fetching owning departments", { error: error as Error });
    throw error;
  }
}

/** Fetches paginated designations from the API */
export async function getDesignationsPaged(
  pageNumber: number, pageSize: number, searchTerm?: string, sortBy?: string, sortOrder?: string
): Promise<PagedResponse<Designation>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");

    const safeSearchTerm = searchTerm?.trim();
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<Designation>>(`/AssetDesignation?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged designations", "Get paged designations failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return response.data;
  } catch (error) {
    logger.error("Error fetching paged designations", { error: error as Error });
    throw error;
  }
}

/** Fetches a single designation by ID */
export async function getDesignationById(designationId: number): Promise<Designation | null> {
  try {
    if (typeof designationId !== "number" || designationId <= 0 || !Number.isFinite(designationId)) {
      throw new ApiError(400, "Valid Designation ID is required", "Invalid ID");
    }
    const response = await apiClient.get<Designation>(`/AssetDesignation/${encodeURIComponent(String(designationId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch designation", `Get designation ${designationId} failed`);
    }
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching designation ${designationId}`, { error: error as Error });
    throw error;
  }
}

/** Creates a new designation */
export async function createDesignation(data: DesignationFormModel): Promise<string | undefined> {
  try {
    if (!data.designationCode?.trim() || !data.designationName?.trim() || !data.designationLocal?.trim() || typeof data.owningDepartmentId !== "number" || !Number.isFinite(data.owningDepartmentId) || data.owningDepartmentId <= 0) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      designationCode: data.designationCode.trim(),
      designationName: data.designationName.trim(),
      designationLocal: data.designationLocal.trim(),
      designationDescription: data.designationDescription?.trim() || null,
      isActive: data.isActive,
      createdBy: data.createdBy ?? null,
      owningDepartmentId: data.owningDepartmentId,
    };
    const response = await apiClient.post<unknown>("/AssetDesignation", payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Create designation failed",
        "Create designation failed"
      );
    }
    return (response.data as { message?: string } | undefined)?.message;
  } catch (error) {
    logger.error("Error creating designation", { error: error as Error });
    throw error;
  }
}

/** Updates an existing designation */
export async function updateDesignation(data: DesignationFormModel): Promise<string | undefined> {
  try {
    if (!data.id || data.id <= 0 || !data.designationCode?.trim() || !data.designationName?.trim() || !data.designationLocal?.trim() || typeof data.owningDepartmentId !== "number" || !Number.isFinite(data.owningDepartmentId) || data.owningDepartmentId <= 0) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      id: data.id,
      designationCode: data.designationCode.trim(),
      designationName: data.designationName.trim(),
      designationLocal: data.designationLocal.trim(),
      designationDescription: data.designationDescription?.trim() || null,
      isActive: data.isActive,
      updatedBy: data.updatedBy ?? null,
      owningDepartmentId: data.owningDepartmentId,
    };
    const response = await apiClient.put<unknown>(`/AssetDesignation/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      const errorMsg = response.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.statusCode ?? (isDuplicate ? 409 : 500),
        errorMsg || "Update designation failed",
        "Update designation failed"
      );
    }
    return (response.data as { message?: string } | undefined)?.message;
  } catch (error) {
    logger.error("Error updating designation", { error: error as Error });
    throw error;
  }
}

/** Deletes a designation by ID */
export async function deleteDesignation(id: number): Promise<void> {
  try {
    if (typeof id !== "number" || id <= 0 || !Number.isFinite(id)) {
      throw new ApiError(400, "Valid Designation ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/AssetDesignation/${encodeURIComponent(String(id))}`);
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
      throw new ApiError(statusCode, errorMsg || "Failed to delete designation", `Delete designation ${id} failed`);
    }
  } catch (error) {
    logger.error(`Error deleting designation ${id}`, { error: error as Error });
    throw error;
  }
}

