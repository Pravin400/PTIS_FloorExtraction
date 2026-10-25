/* eslint-disable @typescript-eslint/no-explicit-any */
import { InventoryForm, InventoryInvoice } from "@/types/asset/furniture-fixture.types";
import { saveSingleInventoryBatchAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/actions";
import { resolveInventoryIds, buildInventoryDocumentFiles, buildInventoryBatchApiPayload, buildInventoryBatchFormData } from '@/lib/utils/asset-utils/new-add-new-asset/inventory-batch-payload.utils';

interface AddRowDeps {
  isSaving: boolean; setIsSaving: (v: boolean) => void;
  form: InventoryForm; setFormError: (e: string) => void;
  draftInvoice: InventoryInvoice | null;
  parentAssetId?: number | null;
  categories: any[]; itemNames: any[]; itemModels: any[]; conditions: any[]; departments: any[];
  setCurrentPage: (p: number) => void;
  resetAddForm: () => void;
  reloadDataFromServer: () => Promise<void>;
  t?: any;
}

export function useFurnitureFixtureAddRow(deps: AddRowDeps) {
  const {
    isSaving, setIsSaving, form, setFormError, draftInvoice, parentAssetId,
    categories, itemNames, itemModels, conditions, departments,
    setCurrentPage, resetAddForm, reloadDataFromServer, t,
  } = deps;

  const handleAddRow = async () => {
    if (isSaving) return;
    const missing: string[] = [];
    if (!form.category) missing.push(t("inventory.validation.assetType"));
    if (!form.itemName) missing.push(t("inventory.validation.itemName"));
    if (!form.modelName) missing.push(t("inventory.validation.model"));
    if (form.purchaseDate && (isNaN(new Date(form.purchaseDate).getTime()) || new Date(form.purchaseDate) > new Date())) {
      return setFormError(t("inventory.validation.purchaseDateFuture"));
    }
    if (!form.condition) missing.push(t("inventory.validation.condition"));
    if (!form.owningDepartment) missing.push(t("inventory.validation.owningDepartment"));
    if (!form.quantity || Number(form.quantity) <= 0) missing.push(t("inventory.validation.quantity"));
    if (!form.unitValue || Number(form.unitValue) <= 0) missing.push(t("inventory.validation.unitValue"));
    if (missing.length > 0) {
      return setFormError(t("inventory.validation.missingFields", { fields: missing.join(", ") }));
    }
    if (form.specifications && form.specifications.length > 150) return setFormError("Specifications cannot exceed 150 characters.");
    if (draftInvoice?.invoiceNumber && draftInvoice.invoiceNumber.length > 50) return setFormError("Invoice Number cannot exceed 50 characters.");
    if (Number(form.quantity) > 100) return setFormError("Quantity cannot exceed 100 units per batch.");
    if (String(form.unitValue).length > 12) return setFormError("Unit Value is too large.");
    if (!parentAssetId) return setFormError("Parent asset ID is missing.");

    setIsSaving(true); setFormError("");
    try {
      const ids = resolveInventoryIds(form, categories, itemNames, itemModels, conditions, departments);
      if (!ids.isValid || ids.error) {
        setIsSaving(false);
        return setFormError(ids.error || "Selected item or model hierarchy is invalid.");
      }
      const apiPayload = buildInventoryBatchApiPayload(parentAssetId, ids, {
        specifications: form.specifications,
        purchaseDate: form.purchaseDate,
        quantity: Number(form.quantity),
        unitValue: Number(form.unitValue),
        invoiceNumber: draftInvoice?.invoiceNumber,
        invoiceDate: draftInvoice?.invoiceDate,
        invoiceFileName: draftInvoice?.invoiceFileName,
        photoName: form.photoName,
        unitDynamicAttributes: form.unitDynamicAttributes,
      });

      const { documentFiles, documentMetadata } = buildInventoryDocumentFiles(form.photoFile, draftInvoice?.invoiceFile);
      const formDataPayload = buildInventoryBatchFormData(apiPayload, documentFiles, documentMetadata);

      const result = await saveSingleInventoryBatchAction(formDataPayload);
      if (!result.success) { setFormError(result.error || "Failed to save"); setIsSaving(false); return; }

      await reloadDataFromServer();
      resetAddForm(); setCurrentPage(1); setIsSaving(false);
    } catch (err: any) { setFormError(err.message || "Failed to save batch"); setIsSaving(false); }
  };

  return { handleAddRow };
}
