'use client';

import { useTranslations } from "next-intl";
import type { AddFacilityDrawerProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

import { Drawer, Button } from "@/components/common";
import { Plus, Receipt, Image as Box } from "lucide-react";
import { AddFacilityFormFields } from "./AddFacilityFormFields";




export function AddFacilityDrawer({
  // component

  open,
  onClose,
  form,
  updateForm,
  photoInputRef,
  handlePhotoUpload,
  onSave,
  onOpenInvoice,
  categories = [],
  conditions = [],
  itemNames = [],
  itemModels = [],
  departments = [],
  editingRow = null,
  assetCategoryId,
  onPreview,
  onDownload,
}: AddFacilityDrawerProps) {
  const t = useTranslations("newAddNewAsset");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Box className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <h3 id="drawer-title" className="text-[16px] font-bold text-slate-800">
              {editingRow ? "Edit Asset / Facility" : "Add New Asset / Facility"}
            </h3>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">
              {editingRow
                ? "Update details of the registered equipment, furniture, or fixture."
                : "Enter details to register a new equipment, furniture, or fixture."}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="!text-slate-600 hover:!bg-slate-100">{t("cancel") || "Cancel"}</Button>
          <div className="flex items-center gap-3">
            <Button variant="secondary" icon={Receipt} onClick={onOpenInvoice} className="!bg-white !border-slate-200 !text-slate-700 hover:!bg-slate-50 shadow-sm">
              {editingRow?.invoice || form.photoName ? "Invoice Details" : "Add Invoice"}
            </Button>
            <Button variant="primary" icon={Plus} onClick={onSave} className="!bg-blue-600 hover:!bg-blue-700 shadow-sm">
              {editingRow ? "Update Inventory" : "Add Inventory"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-6 bg-slate-50/50 min-h-full">
        <AddFacilityFormFields
          form={form}
          updateForm={updateForm}
          photoInputRef={photoInputRef}
          handlePhotoUpload={handlePhotoUpload}
          categories={categories}
          conditions={conditions}
          itemNames={itemNames}
          itemModels={itemModels}
          departments={departments}
          editingRow={editingRow}
          assetCategoryId={assetCategoryId ?? undefined}
          onPreview={onPreview}
          onDownload={onDownload}
        />
      </div>
    </Drawer>
  );
}
