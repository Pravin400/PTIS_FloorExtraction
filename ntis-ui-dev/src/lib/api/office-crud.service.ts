import { apiClient } from "@/services/api.service";
import { Office, OfficeFormModel } from "@/types/office.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { isOfficeShape, normalizeOffice } from "./office-types-guard";
import {
  validateOfficeId, validateAndPrepareSearchTerm, validateCreateFormData,
  validateUpdateFormData, getDeleteErrorStatusCode, createApiError,
} from "./office-validation";

/** Fetches all offices from the API */
export async function getOffices(): Promise<Office[]> {
  try {
    const response = await apiClient.get<PagedResponse<Office>>("/Office");
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch offices", "Get offices failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    const items = response.data.items ?? [];
    return items.filter(isOfficeShape).map(normalizeOffice);
  } catch (error) {
    throw error;
  }
}

/** Fetches paginated offices from the API */
export async function getOfficesPaged(
  pageNumber: number, 
  pageSize: number, 
  searchTerm?: string, 
  sortBy?: string, 
  sortOrder?: string,
  type?: string,
  status?: string
): Promise<PagedResponse<Office>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    const safeSearchTerm = validateAndPrepareSearchTerm(searchTerm);
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (typeof sortBy === "string" && sortBy.trim()) params.append("SortBy", sortBy.trim());
    if (typeof sortOrder === "string" && sortOrder.trim()) params.append("SortOrder", sortOrder.trim());
    
    if (typeof type === "string" && type.trim()) params.append("Type", type.trim());
    if (typeof status === "string" && status.trim()) params.append("IsActive", status.trim());

    const response = await apiClient.get<PagedResponse<Office>>(`/Office?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged offices", "Get paged offices failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const items = response.data.items ?? [];
    const validItems = items.filter(isOfficeShape);
    const normalizedItems = validItems.map(normalizeOffice);
    
    return { ...response.data, items: normalizedItems };
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      // Silence expected auth errors in service layer
    }
    throw error;
  }
}

/** Fetches a single office by ID */
export async function getOfficeById(officeId: number): Promise<Office | null> {
  try {
    if (!validateOfficeId(officeId)) {
      throw new ApiError(400, "Valid Office ID is required", "Invalid office ID");
    }
    const response = await apiClient.get<Office>(`/Office/${encodeURIComponent(String(officeId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch office", `Get office ${officeId} failed`);
    }
    if (!response.data) return null;

    if (isOfficeShape(response.data)) {
      return normalizeOffice(response.data as Record<string, unknown>);
    }
    throw new ApiError(500, "Unexpected data format received from server", "Data validation failed");
  } catch (error) {
    throw error;
  }
}

/** Creates a new office */
export async function createOffice(data: OfficeFormModel, userId: number): Promise<Office> {
  try {
    validateCreateFormData(data);
    const payload = {
      officeCode: data.officeCode.trim(),
      officeName: data.officeName.trim(),
      type: data.type?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      pincode: data.pincode?.trim() || null,
      phone: data.phone?.trim() || null,
      emailId: data.emailId?.trim() || null,
      establishedDate: data.establishedDate || null,
      isActive: data.isActive,
      createdBy: userId, 
    };

    const response = await apiClient.post<{ items: Office; success: boolean; message: string }>("/Office", payload);
    
    if (!response.success || !response.data?.success) {
      const errorMsg = response.error || response.data?.message || "Create office failed";
      throw createApiError(response.statusCode, errorMsg, "Create office failed");
    }

    return response.data.items;
  } catch (error) {
    throw error;
  }
}

/** Updates an existing office */
export async function updateOffice(data: OfficeFormModel, userId: number): Promise<Office> {
  try {
    validateUpdateFormData(data);
    const payload = {
      officeId: data.officeId,
      officeCode: data.officeCode.trim(),
      officeName: data.officeName.trim(),
      type: data.type?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      pincode: data.pincode?.trim() || null,
      phone: data.phone?.trim() || null,
      emailId: data.emailId?.trim() || null,
      establishedDate: data.establishedDate || null,
      isActive: data.isActive,
      updatedBy: userId,
    };

    const response = await apiClient.put<{ items: Office; success: boolean; message: string }>(`/Office/${encodeURIComponent(String(data.officeId))}`, payload);
    
    if (!response.success || !response.data?.success) {
      const errorMsg = response.error || response.data?.message || "Update office failed";
      throw createApiError(response.statusCode, errorMsg, "Update office failed");
    }

    return response.data.items;
  } catch (error) {
    throw error;
  }
}

/** Deletes an office by ID */
export async function deleteOffice(officeId: number): Promise<void> {
  try {
    if (!validateOfficeId(officeId)) {
      throw new ApiError(400, "Valid Office ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/Office/${encodeURIComponent(String(officeId))}/purge`);
    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(statusCode, response.error || "Failed to delete office", `Delete office ${officeId} failed`);
    }
  } catch (error) {
    throw error;
  }
}
