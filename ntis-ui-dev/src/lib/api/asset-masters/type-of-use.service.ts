import { apiClient } from "@/services/api.service";
import {
  TypeOfUseGroup,
  CreateTypeOfUseGroupPayload,
  UpdateTypeOfUseGroupPayload,
  AssetTypeOfUse,
  CreateAssetTypeOfUsePayload,
  UpdateAssetTypeOfUsePayload,
  AssetSubTypeOfUse,
  CreateAssetSubTypeOfUsePayload,
  UpdateAssetSubTypeOfUsePayload,
} from "@/types/asset-masters/type-of-use.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";

type MutationResponseData = { success?: boolean; message?: string; error?: string };

function normalizeSearchSequence<T extends { searchSequence: number | "" }>(data: T) {
  return {
    ...data,
    searchSequence: data.searchSequence === "" ? undefined : data.searchSequence,
  };
}

function requirePagedItems<T>(data: PagedResponse<T> | undefined, resourceName: string): T[] {
  if (!data || !Array.isArray(data.items)) {
    throw new ApiError(500, `No valid ${resourceName} data received from server`, "Invalid response format");
  }
  return data.items;
}
import { logger } from "@/lib/utils/logger";
import { validateAndPrepareSearchTerm, getDeleteErrorStatusCode } from "@/lib/api/typeofuse-validation";

// ==========================================
// TYPE OF USE GROUP SERVICES
// ==========================================

export async function getTypeOfUseGroupsPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<TypeOfUseGroup>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");

    const safeSearchTerm = validateAndPrepareSearchTerm(searchTerm);
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<TypeOfUseGroup>>(
      `/asset-management/type-of-use-group?${params.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch paged Type of Use Groups",
        "Get paged groups failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    requirePagedItems(response.data, "paged Type of Use Groups");

    return response.data;
  } catch (error) {
    logger.error("Error fetching paged Type of Use Groups", { error: error as Error });
    throw error;
  }
}

export async function getTypeOfUseGroupsAllActive(): Promise<TypeOfUseGroup[]> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", "1");
    params.append("PageSize", "-1");
    params.append("IsActive", "true");
    params.append("MarkedForDeletion", "false");

    const response = await apiClient.get<PagedResponse<TypeOfUseGroup>>(
      `/asset-management/type-of-use-group?${params.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch active Type of Use Groups",
        "Get active groups failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return requirePagedItems(response.data, "active Type of Use Groups");
  } catch (error) {
    logger.error("Error fetching active Type of Use Groups", { error: error as Error });
    throw error;
  }
}

export async function getTypeOfUseGroupById(groupId: number): Promise<TypeOfUseGroup | null> {
  try {
    if (typeof groupId !== "number" || groupId <= 0 || !Number.isFinite(groupId)) {
      throw new ApiError(400, "Valid Group ID is required", "Invalid ID");
    }
    const response = await apiClient.get<TypeOfUseGroup>(
      `/asset-management/type-of-use-group/${encodeURIComponent(String(groupId))}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch Type of Use Group",
        `Get Group ${groupId} failed`
      );
    }
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching Type of Use Group ${groupId}`, { error: error as Error });
    throw error;
  }
}

export async function createTypeOfUseGroup(data: CreateTypeOfUseGroupPayload): Promise<string | undefined> {
  try {
    const code = data.typeOfUseGroupCode?.trim();
    const name = data.groupName?.trim();
    const icon = data.groupIcon?.trim();

    if (!code || !name || !icon) {
      throw new ApiError(400, "Required fields are missing", "Validation failed");
    }
    const payload = {
      typeOfUseGroupCode: code,
      groupName: name,
      groupIcon: icon,
      isActive: data.isActive,
      createdBy: data.createdBy,
    };
    const response = await apiClient.post<MutationResponseData>("/asset-management/type-of-use-group", payload);
    if (!response.success || response.data?.success === false) {
      const errorMsg = response.error || response.data?.message || response.data?.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.data?.success === false ? (isDuplicate ? 409 : 500) : (response.statusCode ?? (isDuplicate ? 409 : 500)),
        errorMsg || "Create Type of Use Group failed",
        "Create Group failed"
      );
    }
    return response.data?.message;
  } catch (error) {
    logger.error("Error creating Type of Use Group", { error: error as Error });
    throw error;
  }
}

export async function updateTypeOfUseGroup(data: UpdateTypeOfUseGroupPayload): Promise<string | undefined> {
  try {
    const code = data.typeOfUseGroupCode?.trim();
    const name = data.groupName?.trim();
    const icon = data.groupIcon?.trim();

    if (!data.id || data.id <= 0 || !code || !name || !icon) {
      throw new ApiError(400, "Valid Group ID and required fields are missing", "Validation failed");
    }
    const payload = {
      typeOfUseGroupCode: code,
      groupName: name,
      groupIcon: icon,
      isActive: data.isActive,
      updatedBy: data.updatedBy,
    };
    const response = await apiClient.put<MutationResponseData>(
      `/asset-management/type-of-use-group/${encodeURIComponent(String(data.id))}`,
      payload
    );
    if (!response.success || response.data?.success === false) {
      const errorMsg = response.error || response.data?.message || response.data?.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.data?.success === false ? (isDuplicate ? 409 : 500) : (response.statusCode ?? (isDuplicate ? 409 : 500)),
        errorMsg || "Update Type of Use Group failed",
        "Update Group failed"
      );
    }
    return response.data?.message;
  } catch (error) {
    logger.error("Error updating Type of Use Group", { error: error as Error });
    throw error;
  }
}

export async function deleteTypeOfUseGroup(id: number): Promise<void> {
  try {
    if (typeof id !== "number" || id <= 0 || !Number.isFinite(id)) {
      throw new ApiError(400, "Valid Group ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(
      `/asset-management/type-of-use-group/${encodeURIComponent(String(id))}`
    );
    if (!response.success) {
      const errorMsg = response.error || "";
      const statusCode = response.statusCode ?? getDeleteErrorStatusCode(errorMsg);
      throw new ApiError(statusCode, errorMsg || "Failed to delete Type of Use Group", `Delete Group ${id} failed`);
    }
  } catch (error) {
    logger.error(`Error deleting Type of Use Group ${id}`, { error: error as Error });
    throw error;
  }
}

// ==========================================
// ASSET TYPE OF USE SERVICES
// ==========================================

export async function getAssetTypeOfUses(
  typeOfUseGroupId: number,
  isActive?: boolean
): Promise<AssetTypeOfUse[]> {
  try {
    const params = new URLSearchParams();
    params.append("TypeOfUseGroupId", typeOfUseGroupId.toString());
    params.append("MarkedForDeletion", "false");
    params.append("PageSize", "-1");
    if (isActive !== undefined) {
      params.append("IsActive", isActive.toString());
    }

    const response = await apiClient.get<PagedResponse<AssetTypeOfUse>>(
      `/asset-management/asset-type-of-use?${params.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch Asset Type of Uses",
        "Get Types failed"
      );
    }
    return requirePagedItems(response.data, "Asset Type of Uses");
  } catch (error) {
    logger.error("Error fetching Asset Type of Uses", { error: error as Error });
    throw error;
  }
}

export async function getAssetTypeOfUseById(id: number): Promise<AssetTypeOfUse | null> {
  try {
    const response = await apiClient.get<AssetTypeOfUse>(
      `/asset-management/asset-type-of-use/${encodeURIComponent(String(id))}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch Asset Type of Use",
        `Get Type ${id} failed`
      );
    }
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching Asset Type of Use ${id}`, { error: error as Error });
    throw error;
  }
}

export async function createAssetTypeOfUse(data: CreateAssetTypeOfUsePayload): Promise<string | undefined> {
  try {
    const response = await apiClient.post<MutationResponseData>(
      "/asset-management/asset-type-of-use",
      normalizeSearchSequence(data)
    );
    if (!response.success || response.data?.success === false) {
      const errorMsg = response.error || response.data?.message || response.data?.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.data?.success === false ? (isDuplicate ? 409 : 500) : (response.statusCode ?? (isDuplicate ? 409 : 500)),
        errorMsg || "Create Asset Type of Use failed",
        "Create Type failed"
      );
    }
    return response.data?.message;
  } catch (error) {
    logger.error("Error creating Asset Type of Use", { error: error as Error });
    throw error;
  }
}

export async function updateAssetTypeOfUse(data: UpdateAssetTypeOfUsePayload): Promise<string | undefined> {
  try {
    if (typeof data.id !== "number" || data.id <= 0 || !Number.isFinite(data.id)) {
      throw new ApiError(400, "Valid Type of Use ID is required", "Validation failed");
    }
    const response = await apiClient.put<MutationResponseData>(
      `/asset-management/asset-type-of-use/${encodeURIComponent(String(data.id))}`,
      normalizeSearchSequence({
        assetCategoryId: data.assetCategoryId,
        assetTypeId: data.assetTypeId,
        typeOfUseGroupId: data.typeOfUseGroupId,
        typeOfUseCode: data.typeOfUseCode,
        description: data.description,
        type: data.type,
        searchSequence: data.searchSequence,
        isActive: data.isActive,
        updatedBy: data.updatedBy,
      })
    );
    if (!response.success || response.data?.success === false) {
      const errorMsg = response.error || response.data?.message || response.data?.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.data?.success === false ? (isDuplicate ? 409 : 500) : (response.statusCode ?? (isDuplicate ? 409 : 500)),
        errorMsg || "Update Asset Type of Use failed",
        "Update Type failed"
      );
    }
    return response.data?.message;
  } catch (error) {
    logger.error("Error updating Asset Type of Use", { error: error as Error });
    throw error;
  }
}

export async function deleteAssetTypeOfUse(id: number): Promise<void> {
  try {
    if (typeof id !== "number" || id <= 0 || !Number.isFinite(id)) {
      throw new ApiError(400, "Valid Type ID is required", "Invalid ID");
    }
    const response = await apiClient.delete<{ message?: string }>(
      `/asset-management/asset-type-of-use/${encodeURIComponent(String(id))}`
    );
    if (!response.success) {
      const statusCode = getDeleteErrorStatusCode(response.error ?? "");
      throw new ApiError(
        response.statusCode ?? statusCode,
        response.error || "Failed to delete Asset Type of Use",
        `Delete Type ${id} failed`
      );
    }
  } catch (error) {
    logger.error(`Error deleting Asset Type of Use ${id}`, { error: error as Error });
    throw error;
  }
}

// ==========================================
// ASSET SUB-TYPE OF USE SERVICES
// ==========================================

export async function getAssetSubTypeOfUses(
  typeOfUseId: number,
  isActive?: boolean
): Promise<AssetSubTypeOfUse[]> {
  try {
    const params = new URLSearchParams();
    params.append("TypeOfUseId", typeOfUseId.toString());
    params.append("MarkedForDeletion", "false");
    params.append("PageSize", "-1");
    if (isActive !== undefined) {
      params.append("IsActive", isActive.toString());
    }

    const response = await apiClient.get<PagedResponse<AssetSubTypeOfUse>>(
      `/asset-management/asset-sub-type-of-use?${params.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch Asset Sub-Type of Uses",
        "Get Sub-Types failed"
      );
    }
    return requirePagedItems(response.data, "Asset Sub-Type of Uses");
  } catch (error) {
    logger.error("Error fetching Asset Sub-Type of Uses", { error: error as Error });
    throw error;
  }
}

export async function getAssetSubTypeOfUseById(id: number): Promise<AssetSubTypeOfUse | null> {
  try {
    const response = await apiClient.get<AssetSubTypeOfUse>(
      `/asset-management/asset-sub-type-of-use/${encodeURIComponent(String(id))}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch Asset Sub-Type of Use",
        `Get Sub-Type ${id} failed`
      );
    }
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching Asset Sub-Type of Use ${id}`, { error: error as Error });
    throw error;
  }
}

export async function createAssetSubTypeOfUse(data: CreateAssetSubTypeOfUsePayload): Promise<string | undefined> {
  try {
    const response = await apiClient.post<MutationResponseData>(
      "/asset-management/asset-sub-type-of-use",
      normalizeSearchSequence(data)
    );
    if (!response.success || response.data?.success === false) {
      const errorMsg = response.error || response.data?.message || response.data?.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.data?.success === false ? (isDuplicate ? 409 : 500) : (response.statusCode ?? (isDuplicate ? 409 : 500)),
        errorMsg || "Create Asset Sub-Type of Use failed",
        "Create Sub-Type failed"
      );
    }
    return response.data?.message;
  } catch (error) {
    logger.error("Error creating Asset Sub-Type of Use", { error: error as Error });
    throw error;
  }
}

export async function updateAssetSubTypeOfUse(data: UpdateAssetSubTypeOfUsePayload): Promise<string | undefined> {
  try {
    if (typeof data.id !== "number" || data.id <= 0 || !Number.isFinite(data.id)) {
      throw new ApiError(400, "Valid Sub-Type of Use ID is required", "Validation failed");
    }
    const response = await apiClient.put<MutationResponseData>(
      `/asset-management/asset-sub-type-of-use/${encodeURIComponent(String(data.id))}`,
      normalizeSearchSequence({
        typeOfUseId: data.typeOfUseId,
        description: data.description,
        searchSequence: data.searchSequence,
        isActive: data.isActive,
        updatedBy: data.updatedBy,
      })
    );
    if (!response.success || response.data?.success === false) {
      const errorMsg = response.error || response.data?.message || response.data?.error || "";
      const isDuplicate = errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("duplicate");
      throw new ApiError(
        response.data?.success === false ? (isDuplicate ? 409 : 500) : (response.statusCode ?? (isDuplicate ? 409 : 500)),
        errorMsg || "Update Asset Sub-Type of Use failed",
        "Update Sub-Type failed"
      );
    }
    return response.data?.message;
  } catch (error) {
    logger.error("Error updating Asset Sub-Type of Use", { error: error as Error });
    throw error;
  }
}

export async function deleteAssetSubTypeOfUse(id: number): Promise<void> {
  try {
    if (typeof id !== "number" || id <= 0 || !Number.isFinite(id)) {
      throw new ApiError(400, "Valid Sub-Type ID is required", "Invalid ID");
    }
    const response = await apiClient.delete<{ message?: string }>(
      `/asset-management/asset-sub-type-of-use/${encodeURIComponent(String(id))}`
    );
    if (!response.success) {
      const statusCode = getDeleteErrorStatusCode(response.error ?? "");
      throw new ApiError(
        response.statusCode ?? statusCode,
        response.error || "Failed to delete Asset Sub-Type of Use",
        `Delete Sub-Type ${id} failed`
      );
    }
  } catch (error) {
    logger.error(`Error deleting Asset Sub-Type of Use ${id}`, { error: error as Error });
    throw error;
  }
}

// ==========================================
// COMMON DROPDOWN SERVICES
// ==========================================

export async function getAssetTypeOfUsesAllActive(): Promise<AssetTypeOfUse[]> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", "1");
    params.append("PageSize", "-1");
    params.append("IsActive", "true");
    params.append("MarkedForDeletion", "false");

    const response = await apiClient.get<PagedResponse<AssetTypeOfUse>>(
      `/asset-management/asset-type-of-use?${params.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch active Asset Type of Uses",
        "Get active types failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return requirePagedItems(response.data, "active Asset Type of Uses");
  } catch (error) {
    logger.error("Error fetching active Asset Type of Uses", { error: error as Error });
    throw error;
  }
}

export async function getAssetTypeOfUsesPaged(
  pageNumber: number,
  pageSize: number,
  typeOfUseGroupId?: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetTypeOfUse>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    if (typeOfUseGroupId) {
      params.append("TypeOfUseGroupId", typeOfUseGroupId.toString());
    }
    params.append("MarkedForDeletion", "false");
    const safeSearch = validateAndPrepareSearchTerm(searchTerm);
    if (safeSearch) {
      params.append("SearchTerm", safeSearch);
    }
    if (sortBy) {
      params.append("SortBy", sortBy);
      params.append("SortOrder", sortOrder || "asc");
    }

    const response = await apiClient.get<PagedResponse<AssetTypeOfUse>>(
      `/asset-management/asset-type-of-use?${params.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch paged Asset Type of Uses",
        "Get paged types failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    requirePagedItems(response.data, "paged Asset Type of Uses");
    return response.data;
  } catch (error) {
    logger.error("Error fetching paged Asset Type of Uses", { error: error as Error });
    throw error;
  }
}

export async function getAssetSubTypeOfUsesPaged(
  pageNumber: number,
  pageSize: number,
  typeOfUseId: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetSubTypeOfUse>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("TypeOfUseId", typeOfUseId.toString());
    params.append("MarkedForDeletion", "false");
    const safeSubSearch = validateAndPrepareSearchTerm(searchTerm);
    if (safeSubSearch) {
      params.append("SearchTerm", safeSubSearch);
    }
    if (sortBy) {
      params.append("SortBy", sortBy);
      params.append("SortOrder", sortOrder || "asc");
    }

    const response = await apiClient.get<PagedResponse<AssetSubTypeOfUse>>(
      `/asset-management/asset-sub-type-of-use?${params.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch paged Asset Sub-Type of Uses",
        "Get paged sub-types failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    requirePagedItems(response.data, "paged Asset Sub-Type of Uses");
    return response.data;
  } catch (error) {
    logger.error("Error fetching paged Asset Sub-Type of Uses", { error: error as Error });
    throw error;
  }
}
