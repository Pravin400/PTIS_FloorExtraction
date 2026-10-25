import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import type { PagedResponse } from "@/types/common.types";
import type {
  AssetDocumentDefinition,
  AssetDocumentDefinitionCreateInput,
  AssetDocumentDefinitionUpdateInput,
} from "@/types/asset-masters/asset-document-definition.types";

const ENDPOINT = "/asset-management/document-definition";

export async function getAssetDocumentDefinitionPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetDocumentDefinition>> {
  try {
    const params = new URLSearchParams({
      PageNumber: String(pageNumber),
      PageSize: String(pageSize),
      MarkedForDeletion: "false",
    });

    if (searchTerm?.trim()) params.set("SearchTerm", searchTerm.trim());
    if (sortBy?.trim()) params.set("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.set("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<AssetDocumentDefinition>>(
      `${ENDPOINT}?${params.toString()}`
    );

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch asset document definitions",
        "Get paged asset document definitions failed"
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return response.data;
  } catch (error: unknown) {
    logger.error("Error fetching paged asset document definitions", { error: error as Error });
    throw error;
  }
}

export async function getAssetDocumentDefinitionById(id: number): Promise<AssetDocumentDefinition> {
  try {
    const response = await apiClient.get<AssetDocumentDefinition>(`${ENDPOINT}/${id}`);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch asset document definition",
        "Get asset document definition by ID failed"
      );
    }

    if (!response.data) {
      throw new ApiError(404, "Asset document definition not found", "Not found");
    }

    return response.data;
  } catch (error: unknown) {
    logger.error("Error fetching asset document definition by ID", { id, error: error as Error });
    throw error;
  }
}

export async function createAssetDocumentDefinition(
  input: AssetDocumentDefinitionCreateInput
): Promise<string> {
  try {
    const payload = {
      assetCategoryId: input.assetCategoryId ?? null,
      assetTypeId: input.assetTypeId ?? null,
      documentCode: input.documentCode.trim(),
      documentName: input.documentName.trim(),
      description: input.description?.trim() || null,
      isRequired: input.isRequired,
      displayOrder: input.displayOrder != null ? Number(input.displayOrder) : null,
      isActive: input.isActive,
      createdBy: input.createdBy,
    };

    const response = await apiClient.post<AssetDocumentDefinition>(ENDPOINT, payload);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to create asset document definition",
        "Create asset document definition failed"
      );
    }

    return response.message || "Record created successfully";
  } catch (error: unknown) {
    logger.error("Error creating asset document definition", { error: error as Error });
    throw error;
  }
}

export async function updateAssetDocumentDefinition(
  input: AssetDocumentDefinitionUpdateInput
): Promise<string> {
  try {
    const payload = {
      id: input.id,
      assetCategoryId: input.assetCategoryId ?? null,
      assetTypeId: input.assetTypeId ?? null,
      documentCode: input.documentCode.trim(),
      documentName: input.documentName.trim(),
      description: input.description?.trim() || null,
      isRequired: input.isRequired,
      displayOrder: input.displayOrder != null ? Number(input.displayOrder) : null,
      isActive: input.isActive,
      updatedBy: input.updatedBy,
    };

    const response = await apiClient.put<AssetDocumentDefinition>(`${ENDPOINT}/${input.id}`, payload);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to update asset document definition",
        "Update asset document definition failed"
      );
    }

    return response.message || "Record updated successfully";
  } catch (error: unknown) {
    logger.error("Error updating asset document definition", { id: input.id, error: error as Error });
    throw error;
  }
}

export async function deleteAssetDocumentDefinition(id: number): Promise<string> {
  try {
    const response = await apiClient.delete<unknown>(`${ENDPOINT}/${id}`);

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to delete asset document definition",
        "Delete asset document definition failed"
      );
    }

    return response.message || "Record marked for deletion";
  } catch (error: unknown) {
    logger.error("Error deleting asset document definition", { id, error: error as Error });
    throw error;
  }
}
