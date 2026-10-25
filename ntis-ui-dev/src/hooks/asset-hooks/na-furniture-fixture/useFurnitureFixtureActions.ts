/* eslint-disable @typescript-eslint/no-explicit-any */
import { InventoryRow, InventoryForm, InventoryInvoice } from "@/types/asset/furniture-fixture.types";
import { useFurnitureFixtureAddRow } from "./useFurnitureFixtureAddRow";
import { useFurnitureFixtureUpdateRow } from "./useFurnitureFixtureUpdateRow";
import { useFurnitureFixtureDeleteRow } from "./useFurnitureFixtureDeleteRow";
import { useFurnitureFixtureSaveAll } from "./useFurnitureFixtureSaveAll";

export interface ActionDeps {
  isSaving: boolean; setIsSaving: (v: boolean) => void;
  form: InventoryForm; setFormError: (e: string) => void;
  editForm: InventoryForm; editingId: number | null;
  draftInvoice: InventoryInvoice | null; editDraftInvoice: InventoryInvoice | null;
  rows: InventoryRow[]; setRows: React.Dispatch<React.SetStateAction<InventoryRow[]>>;
  setCurrentPage: (p: number) => void;
  setSaveError: (e: string) => void; setSaveSuccess: (v: boolean) => void;
  assetModuleId: number; parentAssetId?: number | null;
  categories: any[]; itemNames: any[]; itemModels: any[];
  conditions: any[]; departments: any[];
  dynamicRates: Record<string, number>; dynamicConditions: Record<string, number>;
  pathname: string; resetAddForm: () => void; resetEditForm: () => void;
  reloadDataFromServer: () => Promise<void>;
  t?: any;
}

export function useFurnitureFixtureActions(deps: ActionDeps) {
  const {
    isSaving, setIsSaving, form, setFormError, editForm, editingId, draftInvoice, editDraftInvoice,
    rows, setRows, setCurrentPage, setSaveError, setSaveSuccess, assetModuleId, parentAssetId,
    categories, itemNames, itemModels, conditions, departments, dynamicRates, dynamicConditions,
    pathname, resetAddForm, resetEditForm, reloadDataFromServer, t
  } = deps;

  const { handleAddRow } = useFurnitureFixtureAddRow({
    isSaving, setIsSaving, form, setFormError, draftInvoice, parentAssetId,
    categories, itemNames, itemModels, conditions, departments,
    setCurrentPage, resetAddForm, reloadDataFromServer, t
  });

  const { handleUpdateRow } = useFurnitureFixtureUpdateRow({
    isSaving, setIsSaving, editForm, editingId, setFormError, editDraftInvoice, rows,
    assetModuleId, parentAssetId, categories, itemNames, itemModels, conditions, departments,
    dynamicRates, dynamicConditions, pathname, setCurrentPage, resetEditForm, reloadDataFromServer,
  });

  const { handleDeleteRow } = useFurnitureFixtureDeleteRow({
    rows, setRows, setIsSaving, setSaveError, editingId, resetEditForm, reloadDataFromServer,
  });

  const { handleSaveToBackend } = useFurnitureFixtureSaveAll({
    rows, setIsSaving, setSaveError, setSaveSuccess, assetModuleId, parentAssetId,
    categories, itemNames, itemModels, conditions, departments, pathname, reloadDataFromServer,
  });

  return { handleAddRow, handleUpdateRow, handleDeleteRow, handleSaveToBackend };
}
