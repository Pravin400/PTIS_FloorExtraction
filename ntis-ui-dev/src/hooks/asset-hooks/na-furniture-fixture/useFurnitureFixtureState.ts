/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { type InventoryType, type InventoryRow } from "@/types/asset/furniture-fixture.types";
import { emptyInvoiceForm } from "@/lib/utils/asset-utils/new-add-new-asset/furniture-fixture/FurnitureFixtureConstants";
import type { InventoryItemCategory, InventoryItemCondition, InventoryItemName, InventoryItemModel } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/inventory.service";
import {
  getInventoryBatchesAction,
  type InventoryBatchListResponse
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/actions";

import { convertBatchesToRows, handlePreviewDocument } from "@/lib/utils/asset-utils/furnitureFixtureUtils";

import { useFurnitureFixtureActions } from "./useFurnitureFixtureActions";
import { useFurnitureFixtureSummary } from "./useFurnitureFixtureSummary";
import { useFurnitureFixtureFormHandlers } from "./useFurnitureFixtureFormHandlers";
import { useFurnitureFixtureModuleId } from "./useFurnitureFixtureModuleId";
import { useFurnitureFixtureBaseState } from "./useFurnitureFixtureBaseState";

export function useFurnitureFixtureState(
  categories: InventoryItemCategory[] = [],
  conditions: InventoryItemCondition[] = [],
  itemNames: InventoryItemName[] = [],
  itemModels: InventoryItemModel[] = [],
  initialBatches: InventoryBatchListResponse | null = null,
  parentAssetId?: number | null,
  initialDepartments?: any[],
  t?: any
) {
  const { assetModuleId, pathname } = useFurnitureFixtureModuleId();
  // Initialize rows from SSR data (initialBatches) or use empty array
  const initialRowsFromServer = useMemo(() => {
    if (initialBatches?.batches && initialBatches.batches.length > 0) {
      return convertBatchesToRows(initialBatches.batches);
    }
    return [];
  }, [initialBatches]);

  const {
    rows, setRows, departments,
    filterCategory, setFilterCategory, form, setForm,
    editForm, setEditForm, invoiceForm, setInvoiceForm,
    draftInvoice, setDraftInvoice, editDraftInvoice, setEditDraftInvoice,
    editingId, setEditingId, formError, setFormError,
    invoiceError, setInvoiceError, invoiceDrawerOpen, setInvoiceDrawerOpen,
    editDrawerOpen, setEditDrawerOpen, currentPage, setCurrentPage,
    isSaving, setIsSaving, saveError, setSaveError,
    saveSuccess, setSaveSuccess,
    options, enrichedRows, addPhotoInputRef, editPhotoInputRef, invoiceInputRef,
    filteredRows, paginatedRows, existingInvoiceOptions,
    resetAddForm, resetEditForm
  } = useFurnitureFixtureBaseState(initialRowsFromServer, categories, conditions, itemNames, itemModels, initialDepartments);

  const {
    dynamicRates,
    dynamicConditions,
    dynamicCategoryOptions,
    dynamicConditionOptions,
    dynamicItemNameOptions,
    dynamicModelOptions,
    dynamicEditItemNameOptions,
    dynamicEditModelOptions,
    dynamicEditConditionOptions,
  } = options;

  const { categoryGroups, grandAssetValue, grandCV, summaryCards } = useFurnitureFixtureSummary(rows, enrichedRows, categories);

  const { handleAddPhotoUpload, handleEditPhotoUpload, handleInvoiceUpload, saveInvoiceDetails } = useFurnitureFixtureFormHandlers(
    setForm, setEditForm, setInvoiceForm, invoiceForm, editDrawerOpen, setDraftInvoice, setEditDraftInvoice, setInvoiceError, setInvoiceDrawerOpen
  );

  // Helper function to reload data from server
  const reloadDataFromServer = async () => {
    if (!parentAssetId) return;

    const result = await getInventoryBatchesAction(parentAssetId);

    if (result.success && result.data?.batches) {
      const freshRows = convertBatchesToRows(result.data.batches);
      setRows(freshRows);
    }
  };

  const {
    handleAddRow,
    handleUpdateRow,
    handleDeleteRow,
    handleSaveToBackend
  } = useFurnitureFixtureActions({
    isSaving, setIsSaving, form, setFormError, editForm, editingId, draftInvoice, editDraftInvoice,
    rows, setRows, setCurrentPage, setSaveError, setSaveSuccess, assetModuleId, parentAssetId,
    categories, itemNames, itemModels, conditions, departments, dynamicRates, dynamicConditions,
    pathname, resetAddForm, resetEditForm, reloadDataFromServer, t
  });

  const handleStartEdit = (row: InventoryRow) => {
    setEditingId(row.id);
    setFormError("");
    setInvoiceError("");

    const matchingCategory = categories.find(c => {
      const normalized = c.typeName.toLowerCase().replace(/\s+/g, "-");
      return normalized === row.category;
    });

    const properTypeName = matchingCategory?.typeName || row.category;

    setEditForm({
      category: properTypeName as InventoryType,
      itemName: row.itemName,
      modelName: row.modelName,
      specifications: row.specifications === "NA" ? "" : row.specifications,
      purchaseDate: row.purchaseDate,
      condition: row.condition,
      quantity: String(row.quantity),
      unitValue: String(row.unitValue),
      photoName: row.photoName ?? "",
      photoUrl: row.photoUrl ?? "",
      owningDepartment: row.owningDepartment ?? ""
    });
    setEditDraftInvoice(row.invoice ?? null);
    setEditDrawerOpen(true);
  };

  const openInvoiceDrawer = (editMode: boolean) => {
    setInvoiceError("");
    const src = editMode ? editDraftInvoice : draftInvoice;
    setInvoiceForm(src ? {
      invoiceMode: src.invoiceMode,
      existingInvoiceKey: "",
      invoiceNumber: src.invoiceNumber,
      invoiceDate: src.invoiceDate,
      invoiceFileName: src.invoiceFileName
    } : emptyInvoiceForm());
    setInvoiceDrawerOpen(true);
  };

  return {
    rows, setRows,
    filterCategory, setFilterCategory,
    form, setForm,
    editForm, setEditForm,
    invoiceForm, setInvoiceForm,
    draftInvoice, setDraftInvoice,
    editDraftInvoice, setEditDraftInvoice,
    editingId, setEditingId,
    formError, setFormError,
    invoiceError, setInvoiceError,
    invoiceDrawerOpen, setInvoiceDrawerOpen,
    editDrawerOpen, setEditDrawerOpen,
    currentPage, setCurrentPage,
    isSaving, saveError, saveSuccess,
    dynamicRates,
    dynamicConditions,
    dynamicCategoryOptions,
    dynamicConditionOptions,
    dynamicItemNameOptions,
    dynamicModelOptions,
    dynamicEditItemNameOptions,
    dynamicEditModelOptions,
    dynamicEditConditionOptions,
    addPhotoInputRef, editPhotoInputRef, invoiceInputRef,
    filteredRows, paginatedRows, enrichedRows, grandAssetValue, grandCV, categoryGroups,
    summaryCards, existingInvoiceOptions,
    resetAddForm, resetEditForm,
    handleAddPhotoUpload, handleEditPhotoUpload, handleInvoiceUpload,
    saveInvoiceDetails, handleAddRow, handleUpdateRow,
    handleDeleteRow, handleStartEdit, openInvoiceDrawer, handleSaveToBackend,
    handlePreviewDocument,
    departments
  };
}
