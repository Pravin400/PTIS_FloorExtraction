/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFallbackModuleIdAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/module-id.actions";
import { InventoryRow, InventoryForm, InventoryInvoice } from "@/types/asset/furniture-fixture.types";
import {
  saveSingleInventoryBatchAction,
  updateInventoryBatchAction,
  deleteInventoryBatchAction,
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/actions";

import { uploadBatchDocuments } from "@/lib/utils/asset-utils/furnitureFixtureUtils";
import { calcRowCV } from "@/lib/utils/asset-utils/new-add-new-asset/furniture-fixture/FurnitureFixtureCV";
import { resolveInventoryIds, buildInventoryDocumentFiles, buildInventoryBatchApiPayload, buildInventoryBatchFormData } from '@/lib/utils/asset-utils/new-add-new-asset/inventory-batch-payload.utils';

interface UpdateRowDeps {
  isSaving: boolean; setIsSaving: (v: boolean) => void;
  editForm: InventoryForm; editingId: number | null; setFormError: (e: string) => void;
  editDraftInvoice: InventoryInvoice | null;
  rows: InventoryRow[];
  assetModuleId: number; parentAssetId?: number | null;
  categories: any[]; itemNames: any[]; itemModels: any[]; conditions: any[]; departments: any[];
  dynamicRates: Record<string, number>; dynamicConditions: Record<string, number>;
  pathname: string; setCurrentPage: (p: number) => void;
  resetEditForm: () => void;
  reloadDataFromServer: () => Promise<void>;
}

export function useFurnitureFixtureUpdateRow(deps: UpdateRowDeps) {
  const {
    isSaving, setIsSaving, editForm, editingId, setFormError, editDraftInvoice, rows,
    assetModuleId, parentAssetId, categories, itemNames, itemModels, conditions, departments,
    dynamicRates, dynamicConditions, pathname, setCurrentPage, resetEditForm, reloadDataFromServer,
  } = deps;

  const handleUpdateRow = async () => {
    if (editingId === null || isSaving) return;
    if (!editForm.category || !editForm.itemName || !editForm.modelName || !editForm.condition || Number(editForm.quantity) <= 0 || Number(editForm.unitValue) <= 0)
      return setFormError("Please fill in all required fields and positive values.");
    if (editForm.purchaseDate && (isNaN(new Date(editForm.purchaseDate).getTime()) || new Date(editForm.purchaseDate) > new Date()))
      return setFormError("Purchase Date cannot be in the future or invalid.");

    const existingRow = rows.find(r => r.id === editingId);
    const payload: InventoryRow = {
      id: editingId, type: editForm.category, photoUrl: editForm.photoUrl, photoName: editForm.photoName,
      itemName: editForm.itemName, modelName: editForm.modelName,
      specifications: editForm.specifications?.trim() || "NA", purchaseDate: editForm.purchaseDate,
      condition: editForm.condition, quantity: Number(editForm.quantity), unitValue: Number(editForm.unitValue),
      total: Number(editForm.quantity) * Number(editForm.unitValue),
      owningDepartment: editForm.owningDepartment, invoice: editDraftInvoice, unitDynamicAttributes: editForm.unitDynamicAttributes,
      batchId: existingRow?.batchId, isRegistered: existingRow?.isRegistered, registeredUnits: existingRow?.registeredUnits
    } as any;
    calcRowCV(payload, dynamicRates, dynamicConditions);

    if (!(existingRow?.batchId && existingRow?.isRegistered)) {
      resetEditForm(); setCurrentPage(1);
      return;
    }

    setIsSaving(true);
    try {
      if (payload.quantity !== existingRow.quantity) {
        const ids = resolveInventoryIds(editForm, categories, itemNames, itemModels, conditions, departments);
        if (!ids.isValid || ids.error) {
          setIsSaving(false);
          return setFormError(ids.error || "Selected item or model hierarchy is invalid.");
        }
        await deleteInventoryBatchAction(existingRow.batchId);
        const createPayload = buildInventoryBatchApiPayload(parentAssetId!, ids, {
          specifications: payload.specifications !== "NA" ? payload.specifications : "",
          purchaseDate: payload.purchaseDate,
          quantity: payload.quantity,
          unitValue: payload.unitValue,
          invoiceNumber: payload.invoice?.invoiceNumber,
          invoiceDate: payload.invoice?.invoiceDate,
          invoiceFileName: payload.invoice?.invoiceFileName,
          photoName: payload.photoName,
        });

        const { documentFiles, documentMetadata } = buildInventoryDocumentFiles(editForm.photoFile, editDraftInvoice?.invoiceFile);
        const formDataPayload = buildInventoryBatchFormData(createPayload, documentFiles, documentMetadata);

        const res = await saveSingleInventoryBatchAction(formDataPayload);
        if (!res.success) { setFormError(res.error || "Failed"); setIsSaving(false); return; }
      } else {
        const res = await updateInventoryBatchAction(existingRow.batchId, {
          itemName: payload.itemName, modelBrand: payload.modelName,
          specifications: payload.specifications !== "NA" ? payload.specifications : undefined,
          purchaseDate: payload.purchaseDate, condition: payload.condition, unitValue: payload.unitValue,
          invoiceNumber: payload.invoice?.invoiceNumber, invoiceDate: payload.invoice?.invoiceDate,
          invoiceFileName: payload.invoice?.invoiceFileName, owningDepartment: payload.owningDepartment, photoFileName: payload.photoName
        });
        if (!res.success) { setFormError(res.error || "Failed"); setIsSaving(false); return; }
      }

      if (existingRow.registeredUnits?.length && payload.quantity === existingRow.quantity && (editForm.photoFile || editDraftInvoice?.invoiceFile)) {
        let mId = assetModuleId;
        if (mId === 0) try { mId = await getFallbackModuleIdAction(pathname) || mId; } catch (_e) { }
        await uploadBatchDocuments(existingRow.batchId, mId, editForm.photoFile, editDraftInvoice?.invoiceFile, editDraftInvoice, true);
      }
      await reloadDataFromServer();
      resetEditForm(); setCurrentPage(1); setIsSaving(false);
    } catch (err: any) { setFormError(err.message || "Failed to update"); setIsSaving(false); }
  };

  return { handleUpdateRow };
}
