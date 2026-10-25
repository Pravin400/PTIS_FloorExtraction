 
'use server';

import { inventoryBatchService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/inventory-batch.service";
import type { InventoryBatchDetail, InventoryBatchListResponse } from '@/types/asset/municipal-Asset/new-add-new-asset/inventory-batch.types';

/**
 * Server action to get all inventory batches for a parent asset.
 */
export async function getInventoryBatchesAction(parentAssetId: number): Promise<{
  success: boolean;
  data?: InventoryBatchListResponse;
  error?: string;
}> {
  try {
    const response = await inventoryBatchService.getBatches(parentAssetId);

    if (response.success && response.data) {
      return { success: true, data: response.data };
    }

    return { success: false, error: response.error || "Failed to load batches" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load inventory batches"
    };
  }
}

/**
 * Server action to get a single inventory batch by ID.
 */
export async function getInventoryBatchByIdAction(batchId: number): Promise<{
  success: boolean;
  data?: InventoryBatchDetail;
  error?: string;
}> {
  try {
    const response = await inventoryBatchService.getBatchById(batchId);

    if (response.success && response.data) {
      return { success: true, data: response.data };
    }

    return { success: false, error: response.error || "Batch not found" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load batch"
    };
  }
}

/**
 * Server action to update an inventory batch (metadata only, no file upload).
 */
export async function updateInventoryBatchAction(batchId: number, updates: {
  itemName?: string;
  modelBrand?: string;
  specifications?: string;
  purchaseDate?: string;
  condition?: string;
  unitValue?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceFileName?: string;
  owningDepartment?: string;
  photoFileName?: string;
  InventoryItemNameId?: number;
  InventoryItemModelId?: number;
  InventoryItemConditionId?: number;
  OwningDepartmentId?: number;
  DocumentFiles?: File[];
  documentMetadataJson?: string;
}): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const response = await inventoryBatchService.updateBatch(batchId, updates);

    if (response.success) {
      return { success: true, message: response.data?.message || "Batch updated successfully" };
    }

    return { success: false, error: response.error || "Failed to update batch" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update batch"
    };
  }
}

/**
 * Server action to update an inventory batch with files.
 */
export async function updateInventoryBatchWithFilesAction(
  batchId: number,
  formData: FormData
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await inventoryBatchService.updateBatchWithFiles(batchId, formData);

    if (response.success) {
      return { success: true, message: "Batch updated successfully with files" };
    }

    return { success: false, error: response.error || "Failed to update batch with files" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update batch with files"
    };
  }
}

/**
 * Server action to delete an inventory batch (deactivates all rows in batch).
 */
export async function deleteInventoryBatchAction(batchId: number): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const response = await inventoryBatchService.deleteBatch(batchId);

    if (response.success) {
      return { success: true, message: response.data?.message || "Batch deleted successfully" };
    }

    return { success: false, error: response.error || "Failed to delete batch" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete batch"
    };
  }
}
