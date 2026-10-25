/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import {
  inventoryService,
  type InventoryItemCategory,
  type InventoryItemName,
  type InventoryItemModel
} from '@/lib/api/asset/municipal-Asset/new-add-new-asset/inventory.service';
import { fetchDepartmentsAction } from './floor-details/actions';
import { fetchAssetConditionMasterAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/lookups/action';
import {
  getInventoryBatchesAction,
  saveSingleInventoryBatchAction,
  deleteInventoryBatchAction,
  updateInventoryBatchAction,
  updateInventoryBatchWithFilesAction,
} from './furniture-fixture/actions';
import { getAssetValuationDataAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/valuation/action';
import { assetConditionMasterService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-condition-master.service";

export async function revalidateNewAssetRoutes() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/assets/municipal-Asset/new-add-new-asset`, 'page');
  }
}

export interface InventoryLookups {
  categories: InventoryItemCategory[];
  conditions: any[];
  itemNames: InventoryItemName[];
  itemModels: InventoryItemModel[];
  departments: { label: string; value: string; id: number }[];
}

export async function fetchInventoryLookupsAction(): Promise<{
  success: boolean;
  categories: InventoryItemCategory[];
  conditions: any[];
  itemNames: InventoryItemName[];
  itemModels: InventoryItemModel[];
  departments: { label: string; value: string; id: number }[];
  error?: string;
}> {
  try {
    const [catRes, condRes, namesRes, modelsRes, deptRes] = await Promise.all([
      inventoryService.getCategories(),
      fetchAssetConditionMasterAction("Inventory"),
      inventoryService.getItemNames(),
      inventoryService.getItemModels(),
      fetchDepartmentsAction()
    ]);

    const filterActive = <T extends { isActive?: boolean; IsActive?: boolean; status?: string }>(data: T[]): T[] =>
      Array.isArray(data)
        ? data.filter(
          (item) =>
            item.isActive !== false &&
            item.IsActive !== false &&
            item.status?.toLowerCase() !== 'inactive'
        )
        : [];

    return {
      success: true,
      categories: catRes.success && catRes.data ? filterActive(catRes.data) : [],
      conditions: condRes.success && (condRes.data as any)?.items ? filterActive((condRes.data as any).items) : (condRes.success && condRes.data ? filterActive(condRes.data as any) : []),
      itemNames: namesRes.success && namesRes.data ? filterActive(namesRes.data) : [],
      itemModels: modelsRes.success && modelsRes.data ? filterActive(modelsRes.data) : [],
      departments: deptRes?.success && Array.isArray(deptRes.data)
        ? deptRes.data.map((d: any) => ({ label: d.label, value: d.label, id: Number(d.value) }))
        : []
    };
  } catch (error: unknown) {
    return {
      success: false,
      categories: [],
      conditions: [],
      itemNames: [],
      itemModels: [],
      departments: [],
      error: error instanceof Error ? error.message : 'Failed to fetch inventory lookups'
    };
  }
}

export async function getInventoryBatchesForNewAssetAction(parentAssetId: number) {
  return getInventoryBatchesAction(parentAssetId);
}

export async function saveInventoryBatchForNewAssetAction(fd: FormData) {
  const result = await saveSingleInventoryBatchAction(fd);
  if (result.success) {
    await revalidateNewAssetRoutes();
  }
  return result;
}

export async function deleteInventoryBatchForNewAssetAction(batchId: number) {
  const result = await deleteInventoryBatchAction(batchId);
  if (result.success) {
    await revalidateNewAssetRoutes();
  }
  return result;
}

export async function updateInventoryBatchForNewAssetAction(batchId: number, payload: any) {
  const result = await updateInventoryBatchAction(batchId, payload);
  if (result.success) {
    await revalidateNewAssetRoutes();
  }
  return result;
}

export async function updateInventoryBatchWithFilesForNewAssetAction(batchId: number, fd: FormData) {
  const result = await updateInventoryBatchWithFilesAction(batchId, fd);
  if (result.success) {
    await revalidateNewAssetRoutes();
  }
  return result;
}

export async function getNewAssetValuationDataAction(assetId: number, isBuildingClient?: boolean) {
  return getAssetValuationDataAction(assetId, isBuildingClient);
}

export async function fetchInventoryConditionsForCategoryAction(categoryId?: number) {
  try {
    const res = await assetConditionMasterService.getAll({
      conditionCategory: "Inventory",
      categoryId,
      isActive: true
    });
    if (res.success && res.data?.items) {
      return { success: true, data: res.data.items };
    }
    if (categoryId) {
      const fallbackRes = await assetConditionMasterService.getAll({
        conditionCategory: "Inventory",
        isActive: true
      });
      if (fallbackRes.success && fallbackRes.data?.items) {
        return { success: true, data: fallbackRes.data.items };
      }
    }
    return { success: false, data: [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}
