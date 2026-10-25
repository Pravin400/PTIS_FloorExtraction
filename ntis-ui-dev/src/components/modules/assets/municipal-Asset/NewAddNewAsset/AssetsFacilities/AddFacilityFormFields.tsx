'use client';
import type { ApiCondition } from "@/types/asset/municipal-Asset/new-add-new-asset";


import { useTranslations } from "next-intl";
import type { AddFacilityFormFieldsProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

import React, { useRef } from "react";
import { UploadCloud, ChevronDown, Calendar, Hash, IndianRupee, Image as ImageIcon, Eye, Trash2 } from "lucide-react";

const toDisplayDate = (val: string) => {
  if (!val) return '';
  const ymdMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  const parts = val.split('/');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return val;
};

const toValueDate = (val: string) => {
  if (!val) return '';
  const parts = val.split('/');
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return val;
};

const formatManualDate = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  let res = '';
  if (digits.length > 0) res += digits.slice(0, 2);
  if (digits.length > 2) res += '/' + digits.slice(2, 4);
  if (digits.length > 4) res += '/' + digits.slice(4, 8);
  return res;
};

import { DESCRIPTION_SANITIZE } from "@/lib/utils/asset-validation-rules";
import { fetchInventoryConditionsForCategoryAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/action";


import { useSearchParams } from "next/navigation";



export function AddFacilityFormFields({
  form,
  updateForm,
  photoInputRef,
  handlePhotoUpload,
  categories = [],
  conditions = [],
  itemNames = [],
  itemModels = [],
  departments = [],
  editingRow = null,
  assetCategoryId,
  onPreview,
}: AddFacilityFormFieldsProps) {
  const searchParams = useSearchParams();
  const resolvedAssetCategoryId = assetCategoryId || (searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined);

  const filteredCategories = React.useMemo(() => {
    if (!resolvedAssetCategoryId || resolvedAssetCategoryId <= 0) return categories;
    const matched = categories.filter(c => {
      const cAssetCatId = c.assetCategoryId ?? c.AssetCategoryId;
      return cAssetCatId !== undefined && cAssetCatId !== null
        ? Number(cAssetCatId) === Number(resolvedAssetCategoryId)
        : true;
    });
    return matched.length > 0 ? matched : categories;
  }, [categories, resolvedAssetCategoryId]);

  const photoFile = (form as { photoFile?: File | null }).photoFile;
  const photoDoc = editingRow?.documents?.find(
    (d: { documentGuid?: string; fileName?: string; documentTypeId?: number | string; documentTypeCode?: string }) => d.documentTypeId === 1 || String(d.documentTypeCode || '').toLowerCase().includes("image")
  );

  const purchaseDateRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("newAddNewAsset");
  const [apiConditions, setApiConditions] = React.useState<ApiCondition[]>(conditions);

  // Synchronized conditions
  React.useEffect(() => {
    if (conditions && conditions.length > 0) {
      // sync
    }
  }, [conditions]);

  React.useEffect(() => {
    let active = true;
    const selectedCat = categories.find(cat => cat.typeName === form.category);
    const selectedCatId = selectedCat?.id;

    async function loadApiConditions() {
      try {
        const res = await fetchInventoryConditionsForCategoryAction(selectedCatId);
        if (active && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setApiConditions(res.data as unknown as ApiCondition[]);
        }
      } catch (e) {
        console.error("Failed to load conditions from API:", e);
      }
    }

    loadApiConditions();

    return () => {
      active = false;
    };
  }, [form.category, categories]);

  const triggerPurchaseDatePicker = () => {
    if (purchaseDateRef.current) {
      try {
        if (typeof purchaseDateRef.current.showPicker === 'function') purchaseDateRef.current.showPicker();
        else purchaseDateRef.current.click();
      } catch (_e) {
        purchaseDateRef.current.click();
      }
    }
  };

  const handlePurchaseDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatManualDate(e.target.value).slice(0, 10);
    const valDate = toValueDate(formatted);
    updateForm("purchaseDate", valDate);
  };

  const filteredConditions = React.useMemo(() => {
    if (!form.category || !form.itemName) return [];

    const selectedCat = categories.find(cat => cat.typeName === form.category);
    const selectedCatId = selectedCat?.id;

    const selectedName = itemNames.find(n => n.subTypeName === form.itemName);
    const selectedNameId = selectedName?.id;

    const selectedModel = itemModels.find(m => m.modelName === form.modelName);
    const selectedModelId = selectedModel?.id;

    const sourceConditions = apiConditions && apiConditions.length > 0 ? apiConditions : conditions;

    const list = sourceConditions.filter((c: ApiCondition & Record<string, unknown>) => {
      const catId = c.inventoryItemCategoryId ?? c.categoryId ?? c.CategoryId ?? c.InventoryItemCategoryId;
      const nameId = c.inventoryItemNameId ?? c.itemNameId ?? c.ItemNameId ?? c.InventoryItemNameId;
      const modelId = c.inventoryItemModelId ?? c.modelId ?? c.ModelId ?? c.InventoryItemModelId;

      if (selectedModelId && modelId) {
        return Number(modelId) === Number(selectedModelId);
      }
      if (selectedNameId && nameId) {
        return Number(nameId) === Number(selectedNameId);
      }
      if (selectedCatId && catId) {
        return Number(catId) === Number(selectedCatId);
      }
      return !selectedCatId;
    });

    const candidateList = list.length > 0 ? list : sourceConditions;

    // Deduplicate so duplicate condition names don't repeat in the dropdown
    const seen = new Set<string>();
    const uniqueList: ApiCondition[] = [];
    for (const c of candidateList) {
      const name = (c.conditionName || "").trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        uniqueList.push(c);
      }
    }

    return uniqueList;
  }, [apiConditions, conditions, categories, itemNames, itemModels, form.category, form.itemName, form.modelName]);

  return (
    <div className="space-y-3">

      {/* 1. Classification */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-[13px] font-bold text-[#101b87] mb-3 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div> {t("classification") || "Classification"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#2d42db] mb-1.5">{t("category") || "Category"} <span style={{ color: "#ef4444" }} className="ml-1">*</span></label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => {
                  updateForm("category", e.target.value);
                  updateForm("itemName", "");
                  updateForm("modelName", "");
                  updateForm("condition", "");
                }}
                className="w-full h-10 pl-3 pr-8 text-[13px] font-bold text-[#1c2aab] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 appearance-none transition-colors"
              >
                <option value="" className="text-[#1c2aab]">{t("selectPlaceholder") || "-- Select --"}</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.typeName} className="text-[#1c2aab]">{c.typeName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#2d42db] mb-1.5">{t("itemName") || "Item Name"} <span style={{ color: "#ef4444" }} className="ml-1">*</span></label>
            <div className="relative">
              <select
                value={form.itemName}
                disabled={!form.category}
                onChange={(e) => {
                  updateForm("itemName", e.target.value);
                  updateForm("modelName", "");
                  updateForm("condition", "");
                }}
                className="w-full h-10 pl-3 pr-8 text-[13px] font-bold text-[#1c2aab] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 appearance-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100/80"
              >
                <option value="" className="text-[#1c2aab]">
                  {form.category ? "--Select--" : "Select Category First"}
                </option>
                {form.category && itemNames
                  .filter(n => {
                    const nRecord = n as unknown as Record<string, unknown>; const nCatId = (n.inventoryItemCategoryId ?? nRecord.InventoryItemCategoryId ?? nRecord.categoryId ?? nRecord.CategoryId) as number | undefined;
                    const cat = categories.find(c => c.typeName === form.category);
                    return cat && nCatId ? Number(nCatId) === Number(cat.id) : false;
                  })
                  .map(c => (
                    <option key={c.id} value={c.subTypeName} className="text-[#1c2aab]">{c.subTypeName}</option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#2d42db] mb-1.5">{t("typeModel") || "Type / Model"}</label>
            <div className="relative">
              <select
                value={form.modelName}
                disabled={!form.itemName}
                onChange={(e) => {
                  updateForm("modelName", e.target.value);
                  updateForm("condition", "");
                }}
                className="w-full h-10 pl-3 pr-8 text-[13px] font-bold text-[#1c2aab] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 appearance-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100/80"
              >
                <option value="" className="text-[#1c2aab]">
                  {form.itemName ? "--Select--" : "Select Item Name First"}
                </option>
                {form.itemName && itemModels
                  .filter(m => {
                    const mRecord = m as unknown as Record<string, unknown>; const mNameId = (m.inventoryItemNameId ?? mRecord.InventoryItemNameId ?? mRecord.itemNameId ?? mRecord.ItemNameId) as number | undefined;
                    const name = itemNames.find(n => n.subTypeName === form.itemName);
                    return name && mNameId ? Number(mNameId) === Number(name.id) : false;
                  })
                  .map(c => (
                    <option key={c.id} value={c.modelName} className="text-[#1c2aab]">{c.modelName}</option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Details & Condition */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-[13px] font-bold text-[#101b87] mb-3 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div> {t("detailsCondition") || "Details & Condition"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#2d42db] mb-1.5">{t("condition") || "Condition"} <span style={{ color: "#ef4444" }} className="ml-1">*</span></label>
            <div className="relative">
              <select
                value={form.condition}
                disabled={!form.category || !form.itemName}
                onChange={(e) => updateForm("condition", e.target.value)}
                className="w-full h-10 pl-3 pr-8 text-[13px] font-bold text-[#1c2aab] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 appearance-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100/80"
              >
                <option value="" className="text-[#1c2aab]">
                  {!form.category ? "Select Category First" : !form.itemName ? "Select Item Name First" : "--Select--"}
                </option>
                {form.category && form.itemName && filteredConditions.map(c => (
                  <option key={c.id} value={c.conditionName} className="text-[#1c2aab]">{c.conditionName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#2d42db] mb-1.5">{t("owningDepartment") || "Owning Department"} <span style={{ color: "#ef4444" }} className="ml-1">*</span></label>
            <div className="relative">
              <select
                value={form.owningDepartment}
                onChange={(e) => updateForm("owningDepartment", e.target.value)}
                className="w-full h-10 pl-3 pr-8 text-[13px] font-bold text-[#1c2aab] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 appearance-none transition-colors"
              >
                <option value="" className="text-[#1c2aab]">{t("selectPlaceholder")}</option>
                {departments.map(d => (
                  <option key={d.id} value={d.value} className="text-[#1c2aab]">{d.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-[#2d42db] mb-1.5">{t("specificationsRemarks") || "Specifications / Remarks"}</label>
            <textarea
              value={form.specifications}
              onChange={(e) => {
                const sanitized = e.target.value.replace(DESCRIPTION_SANITIZE, "").replace(/ {2,}/g, " ");
                updateForm("specifications", sanitized);
              }}
              placeholder="Enter any additional specs..."
              className="w-full h-10 p-3 text-[13px] font-bold text-[#1c2aab] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors resize-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* 3. Valuation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-[13px] font-bold text-[#101b87] mb-3 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div> {t("facilityValuation") || "Valuation"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#2d42db] mb-1.5">{t("purchaseDate") || "Purchase Date"}</label>
            <div className="relative">
              <input
                type="date"
                ref={purchaseDateRef}
                tabIndex={-1}
                value={form.purchaseDate && form.purchaseDate.length === 10 && form.purchaseDate.includes('-') && form.purchaseDate.split('-')[0].length === 4 ? form.purchaseDate : ''}
                onChange={(e) => updateForm("purchaseDate", e.target.value)}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              />
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                maxLength={10}
                value={toDisplayDate(form.purchaseDate || '')}
                onChange={handlePurchaseDateTextChange}
                className="w-full h-10 pl-3 pr-10 text-[13px] font-bold text-[#1c2aab] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors placeholder:text-slate-400"
              />
              <div
                onClick={triggerPurchaseDatePicker}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600"
              >
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#2d42db] mb-1.5">{t("quantity") || "Quantity"} <span style={{ color: "#ef4444" }} className="ml-1">*</span></label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1"
                value={form.quantity}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^0-9]/g, "");
                  updateForm("quantity", sanitized);
                }}
                className="w-full h-10 pl-9 pr-3 text-[13px] font-bold text-[#1c2aab] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#2d42db] mb-1.5">{t("unitValue") || "Unit Value (₹)"} <span style={{ color: "#ef4444" }} className="ml-1">*</span></label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={form.unitValue}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = val.split(".");
                  if (parts.length > 2) {
                    val = parts[0] + "." + parts.slice(1).join("");
                  }
                  updateForm("unitValue", val);
                }}
                className="w-full h-10 pl-9 pr-3 text-[13px] font-bold text-[#1c2aab] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Media */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-[13px] font-bold text-[#101b87] mb-3 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div> {t("supportingDocuments") || "Supporting Documents"}
        </h4>

        <input
          type="file"
          ref={photoInputRef}
          onChange={handlePhotoUpload}
          className="hidden"
          accept="image/*"
        />

        {(form.photoName || photoFile) ? (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 text-[12px] shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-800 truncate max-w-[240px]" title={form.photoName || "Uploaded Photo"}>
                  {form.photoName || "Uploaded Photo"}
                </span>
                <span className="text-[11px] text-blue-600 font-semibold">
                  {photoFile ? `${(photoFile.size / 1024).toFixed(1)} KB` : (photoDoc?.fileSize ? `${(photoDoc.fileSize / 1024).toFixed(1)} KB` : "Image Uploaded")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (photoFile) {
                    if (photoFile) window.open(URL.createObjectURL(photoFile), "_blank");
                  } else if (photoDoc) {
                    onPreview(photoDoc);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                title="View Photo"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t("view") || "View"}</span>
              </button>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Replace Photo"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{t("replace") || "Replace"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  updateForm("photoName", "");
                  updateForm("photoFile", null);
                  if (photoInputRef.current) photoInputRef.current.value = "";
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100/70 rounded-lg transition-colors cursor-pointer"
                title="Delete Photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("delete") || "Delete"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => photoInputRef.current?.click()}
            className="w-full h-20 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-[13px] font-bold text-[#2d42db] group-hover:text-[#2d42db]">
              {t("clickToUploadPhoto") || "Click to upload photo"}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">{t("photoSizeHint") || "Supports JPG, PNG up to 5MB"}</p>
          </div>
        )}
      </div>

    </div>
  );
}
