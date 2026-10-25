/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { inventoryBatchService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/inventory-batch.service";

/**
 * Server action to save a single inventory batch immediately.
 * Use this when user clicks "Add Row" to save right away.
 */
export async function saveSingleInventoryBatchAction(fd: FormData): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  return inventoryBatchService.saveSingleBatchFormData(fd);
}

function aggregateInventoryBatchResults(results: any[]) {
  const categoryGroups: Record<string, any> = {};
  for (const batch of results) {
    const type = batch.names?.inventoryType || batch.inventoryType || 'unknown';
    if (!categoryGroups[type]) {
      categoryGroups[type] = {
        inventoryType: type,
        label: batch.names?.label || batch.label || type,
        totalBatches: 0,
        totalUnits: 0,
        totalPurchaseValue: 0,
        totalCapitalValue: 0,
        totalDepreciation: 0,
        batches: []
      };
    }
    categoryGroups[type].totalBatches++;
    categoryGroups[type].totalUnits += batch.quantity || 0;
    categoryGroups[type].totalPurchaseValue += batch.totalBatchValue || 0;
    categoryGroups[type].totalCapitalValue += batch.totalCapitalValue || 0;
    categoryGroups[type].totalDepreciation += batch.totalDepreciation || 0;
    categoryGroups[type].batches.push(batch);
  }

  return {
    totalBatches: results.length,
    totalUnitsRegistered: results.reduce((s, b) => s + (b.quantity || 0), 0),
    grandPurchaseValue: results.reduce((s, b) => s + (b.totalBatchValue || 0), 0),
    grandCapitalValue: results.reduce((s, b) => s + (b.totalCapitalValue || 0), 0),
    categoryGroups: Object.values(categoryGroups)
  };
}

/**
 * Server action to register inventory batches.
 * Calls POST /api/asset-management/AssetInventory/batch for each item.
 */
export async function saveInventoryBatchAction(payload: { items: any[] }) {
  try {
    const results: any[] = [];
    const errors: string[] = [];

    // Process each batch item sequentially
    for (const item of payload.items) {
      try {
        const res = await inventoryBatchService.postInventoryBatchItem(item);
        if (res.ok) {
          results.push(res.data);
        } else {
          errors.push(res.error!);
        }
      } catch (err: any) {
        errors.push(`${item.itemName}: ${err.message || 'Request failed'}`);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return { success: false, error: errors.join("; ") };
    }

    return {
      success: true,
      data: aggregateInventoryBatchResults(results),
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error during batch registration"
    };
  }
}
