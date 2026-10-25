import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import type { PagedResponse } from "@/types/common.types";
import type {
  AssetFieldDefinition,
  AssetFieldDefinitionCreateInput,
  AssetFieldDefinitionUpdateInput,
} from "@/types/asset-masters/asset-field-definition.types";

const ENDPOINT = "/AssetFieldDefinition";

export async function getAssetFieldDefinitionPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetFieldDefinition>> {
  try {
    const params = new URLSearchParams({
      PageNumber: String(pageNumber),
      PageSize: String(pageSize),
      MarkedForDeletion: "false",
    });

    if (searchTerm?.trim()) params.set("SearchTerm", searchTerm.trim());
    if (sortBy?.trim()) params.set("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.set("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<AssetFieldDefinition>>(
      `${ENDPOINT}?${params.toString()}`
    );

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch asset field definitions",
        "Get paged asset field definitions failed"
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return response.data;
  } catch (error: unknown) {
    logger.error("Error fetching paged asset field definitions", { error: error as Error });
    throw error;
  }
}

export async function getAssetFieldDefinitionById(id: number): Promise<AssetFieldDefinition> {
  try {
    const response = await apiClient.get<AssetFieldDefinition>(`${ENDPOINT}/${id}`);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch asset field definition",
        "Get asset field definition by ID failed"
      );
    }

    if (!response.data) {
      throw new ApiError(404, "Asset field definition not found", "Not found");
    }

    return response.data;
  } catch (error: unknown) {
    logger.error("Error fetching asset field definition by ID", { id, error: error as Error });
    throw error;
  }
}

export async function createAssetFieldDefinition(
  input: AssetFieldDefinitionCreateInput
): Promise<string> {
  try {
    const payload = {
      assetCategoryId: input.assetCategoryId,
      assetTypeId: input.assetTypeId,
      fieldCode: input.fieldCode.trim(),
      fieldName: input.fieldName.trim(),
      fieldLabel: input.fieldLabel.trim(),
      fieldType: input.fieldType.trim(),
      fieldGroup: input.fieldGroup?.trim() || null,
      optionsJson: input.optionsJson?.trim() || null,
      isRequired: input.isRequired,
      displayOrder: Number(input.displayOrder),
      isActive: input.isActive,
      createdBy: input.createdBy,
    };

    const response = await apiClient.post<AssetFieldDefinition>(ENDPOINT, payload);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to create asset field definition",
        "Create asset field definition failed"
      );
    }

    return response.message || "Record created successfully";
  } catch (error: unknown) {
    logger.error("Error creating asset field definition", { error: error as Error });
    throw error;
  }
}

export async function updateAssetFieldDefinition(
  input: AssetFieldDefinitionUpdateInput
): Promise<string> {
  try {
    const payload = {
      id: input.id,
      assetCategoryId: input.assetCategoryId,
      assetTypeId: input.assetTypeId,
      fieldCode: input.fieldCode.trim(),
      fieldName: input.fieldName.trim(),
      fieldLabel: input.fieldLabel.trim(),
      fieldType: input.fieldType.trim(),
      fieldGroup: input.fieldGroup?.trim() || null,
      optionsJson: input.optionsJson?.trim() || null,
      isRequired: input.isRequired,
      displayOrder: Number(input.displayOrder),
      isActive: input.isActive,
      updatedBy: input.updatedBy,
    };

    const response = await apiClient.put<AssetFieldDefinition>(`${ENDPOINT}/${input.id}`, payload);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to update asset field definition",
        "Update asset field definition failed"
      );
    }

    return response.message || "Record updated successfully";
  } catch (error: unknown) {
    logger.error("Error updating asset field definition", { id: input.id, error: error as Error });
    throw error;
  }
}

export async function deleteAssetFieldDefinition(id: number): Promise<string> {
  try {
    const response = await apiClient.delete<unknown>(`${ENDPOINT}/${id}`);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to delete asset field definition",
        "Delete asset field definition failed"
      );
    }

    return response.message || "Record marked for deletion";
  } catch (error: unknown) {
    logger.error("Error deleting asset field definition", { id, error: error as Error });
    throw error;
  }
}

export async function getAssetFieldGroups(): Promise<string[]> {
  try {
    const response = await apiClient.get<string[]>(`${ENDPOINT}/field-groups`);
    if (!response.success || !response.data) {
      return [];
    }
    return response.data;
  } catch (error: unknown) {
    logger.error("Error fetching asset field groups", { error: error as Error });
    return [];
  }
}


