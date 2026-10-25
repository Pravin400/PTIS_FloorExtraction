/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFallbackModuleIdAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/module-id.actions";
import { InventoryRow } from "@/types/asset/furniture-fixture.types";
import { saveSingleInventoryBatchAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/actions";

import { resolveInventoryIds, buildInventoryDocumentFiles, buildInventoryBatchApiPayload, buildInventoryBatchFormData } from '@/lib/utils/asset-utils/new-add-new-asset/inventory-batch-payload.utils';

interface SaveAllDeps {
  rows: InventoryRow[];
  setIsSaving: (v: boolean) => void;
  setSaveError: (e: string) => void;
  setSaveSuccess: (v: boolean) => void;
  assetModuleId: number; parentAssetId?: number | null;
  categories: any[]; itemNames: any[]; itemModels: any[]; conditions: any[]; departments: any[];
  pathname: string;
  reloadDataFromServer: () => Promise<void>;
}

export function useFurnitureFixtureSaveAll(deps: SaveAllDeps) {
  const {
    rows, setIsSaving, setSaveError, setSaveSuccess, assetModuleId, parentAssetId,
    categories, itemNames, itemModels, conditions, departments, pathname, reloadDataFromServer,
  } = deps;

  const handleSaveToBackend = async (_authorityId = 1, _orgId = 1, _createdBy = 1) => {
    const unsavedRows = rows.filter(r => !r.isRegistered && !r.batchId);
    if (!unsavedRows.length) return { success: true };
    if (!parentAssetId) return { success: false, error: "Parent asset ID missing" };
    setIsSaving(true); setSaveError(""); setSaveSuccess(false);

    try {
      let finalModuleId = assetModuleId;
      if (finalModuleId === 0) {
        try { const id = await getFallbackModuleIdAction(pathname); if (id > 0) finalModuleId = id; } catch (_e) { }
      }

      for (const row of unsavedRows) {
        const ids = resolveInventoryIds(row, categories, itemNames, itemModels, conditions, departments);
        if (!ids.isValid || ids.error) {
          setSaveError(ids.error || "Selected item or model hierarchy is invalid.");
          setIsSaving(false);
          return { success: false, error: ids.error };
        }
        const apiPayload = buildInventoryBatchApiPayload(parentAssetId, ids, {
          specifications: row.specifications && row.specifications !== "NA" ? row.specifications : "",
          purchaseDate: row.purchaseDate,
          quantity: Number(row.quantity),
          unitValue: Number(row.unitValue),
          invoiceNumber: row.invoice?.invoiceNumber,
          invoiceDate: row.invoice?.invoiceDate,
          invoiceFileName: row.invoice?.invoiceFileName,
          photoName: row.photoName,
          unitDynamicAttributes: row.unitDynamicAttributes,
        });

        const { documentFiles, documentMetadata } = buildInventoryDocumentFiles(row.photoFile, row.invoice?.invoiceFile);
        const formDataPayload = buildInventoryBatchFormData(apiPayload, documentFiles, documentMetadata);

        const result = await saveSingleInventoryBatchAction(formDataPayload);
        if (!result.success) {
          setSaveError(result.error || "Save failed for a row");
          setIsSaving(false);
          return { success: false };
        }
      }

      await reloadDataFromServer();
      setSaveSuccess(true); setIsSaving(false); return { success: true };
    } catch (err: any) {
      setSaveError(err.message ?? "Registration failed"); setIsSaving(false); return { success: false };
    }
  };

  return { handleSaveToBackend };
}
