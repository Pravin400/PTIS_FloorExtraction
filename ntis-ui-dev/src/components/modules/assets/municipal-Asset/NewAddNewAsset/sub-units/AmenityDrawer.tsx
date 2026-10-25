'use client';

import { Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAmenityDrawer, computeAmenity, Amenity } from "@/hooks/asset-hooks/useAmenityDrawer";
import { DimKey } from "@/lib/utils/asset-utils/room-utils";
import { AmenityConfigSection } from "./AmenityConfigSection";
import { OffsetPopup } from "./OffsetPopup";
import { AmenityDrawerProps } from "@/types/asset/sub-units.types";

export function AmenityDrawer({ isOpen, onClose, amenities, onSaveAmenities }: AmenityDrawerProps) {
  const t = useTranslations("addAssetForm");
  const {
    spacesList,
    form,
    setForm,
    editingId,
    setEditingId,
    setIsFormOffsetOpen,
    offsetSpace,
    tempOffsetShape,
    setTempOffsetShape,
    tempOffsetLength,
    setTempOffsetLength,
    tempOffsetWidth,
    setTempOffsetWidth,
    tempOffsetHeight,
    setTempOffsetHeight,
    tempOffsetBase1,
    setTempOffsetBase1,
    tempOffsetBase2,
    setTempOffsetBase2,
    tempOffsetRadius,
    setTempOffsetRadius,
    tempOffsetOp,
    setTempOffsetOp,
    drawerOffsets,
    tempOffsetAreaSqM,
    drawerNetAdjustmentSqM,
    handleAddOffsetToHistory,
    handleRemoveOffsetFromHistory,
    handleOkSave,
    handleDrawerClose,
    toggleOffset,
    handleFormOffsetToggle,
    handleAdd,
    handleEdit,
    handleDelete,
    totalNetSqM,
    totalNetSqFt,
    totalGrossSqM,
    totalGrossSqFt,
  } = useAmenityDrawer(isOpen, amenities, onSaveAmenities);

  const setMainDim = (key: DimKey, val: string) => {
    setForm((prev: Amenity) => computeAmenity({ ...prev, [key]: parseFloat(val) || 0 }));
  };
  const setShape = (shape: string) => {
    setForm((prev: Amenity) => computeAmenity({ ...prev, shape, length: 0, width: 0, height: 0, base1: 0, base2: 0, radius: 0 }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex justify-end">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl bg-slate-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 border-b border-blue-700 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg"><Sparkles className="size-4 text-white" /></div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">{'Configure Floor Amenities'}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-blue-100 hover:bg-blue-700 hover:text-white focus:outline-none"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AmenityConfigSection
              drawerState={{
                spacesList, form, setForm, editingId, setEditingId, setIsFormOffsetOpen,
                handleFormOffsetToggle, handleAdd, handleEdit, handleDelete, toggleOffset,
                totalNetSqM, totalNetSqFt, totalGrossSqM, totalGrossSqFt,
              }}
              setMainDim={setMainDim}
              setShape={setShape}
              t={t}
            />
          </div>
          
          <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-md"
            >{'Done'}</button>
          </div>

          <OffsetPopup
            offsetRoom={offsetSpace || null}
            entityLabel="Amenity"
            drawerOffsets={drawerOffsets}
            tempOffsetShape={tempOffsetShape} setTempOffsetShape={setTempOffsetShape}
            tempOffsetLength={tempOffsetLength} setTempOffsetLength={setTempOffsetLength}
            tempOffsetWidth={tempOffsetWidth} setTempOffsetWidth={setTempOffsetWidth}
            tempOffsetHeight={tempOffsetHeight} setTempOffsetHeight={setTempOffsetHeight}
            tempOffsetBase1={tempOffsetBase1} setTempOffsetBase1={setTempOffsetBase1}
            tempOffsetBase2={tempOffsetBase2} setTempOffsetBase2={setTempOffsetBase2}
            tempOffsetRadius={tempOffsetRadius} setTempOffsetRadius={setTempOffsetRadius}
            tempOffsetOp={tempOffsetOp} setTempOffsetOp={setTempOffsetOp}
            tempOffsetAreaSqM={tempOffsetAreaSqM}
            drawerNetAdjustmentSqM={drawerNetAdjustmentSqM}
            handleAddOffsetToHistory={handleAddOffsetToHistory}
            handleRemoveOffsetFromHistory={handleRemoveOffsetFromHistory}
            handleDrawerClose={handleDrawerClose}
            handleOkSave={handleOkSave}
            t={t}
          />
        </div>
      </div>
    </>
  );
}
