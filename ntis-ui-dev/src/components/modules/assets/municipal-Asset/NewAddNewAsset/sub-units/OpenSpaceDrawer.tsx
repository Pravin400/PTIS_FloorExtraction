'use client';

import { Layers, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOpenSpaceDrawer, computeOpenSpace, OpenSpace } from "@/hooks/asset-hooks/useOpenSpaceDrawer";
import { DimKey } from "@/lib/utils/asset-utils/room-utils";
import { OpenSpaceConfigSection } from "./OpenSpaceConfigSection";
import { OffsetPopup } from "./OffsetPopup";
import { Button } from "@/components/common";
import { OpenSpaceDrawerProps } from "@/types/asset/sub-units.types";

export function OpenSpaceDrawer({ isOpen, onClose, spaces, onSaveSpaces }: OpenSpaceDrawerProps) {
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
    handleSaveAndClose,
  } = useOpenSpaceDrawer(isOpen, spaces, onSaveSpaces);

  const setMainDim = (key: DimKey, val: string) => {
    setForm((prev: OpenSpace) => computeOpenSpace({ ...prev, [key]: parseFloat(val) || 0 }));
  };
  const setShape = (shape: string) => {
    setForm((prev: OpenSpace) => computeOpenSpace({ ...prev, shape, length: 0, width: 0, height: 0, base1: 0, base2: 0, radius: 0 }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex justify-end">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { handleSaveAndClose(); onClose(); }} />
        
        <div className="relative w-full max-w-6xl bg-slate-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 border-b border-blue-700 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-white/20 rounded-lg"><Layers className="size-4 text-white" /></div>
              <div><h2 className="text-sm font-black text-white uppercase tracking-wider">{t("floorDetails.openSpaces") || "Configure Floor Open Spaces"}</h2></div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={() => { handleSaveAndClose(); onClose(); }}
              className="h-auto! w-auto! p-1.5! rounded-lg! text-blue-100! hover:bg-blue-700! hover:text-white! focus:ring-0! focus:ring-offset-0!"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <OpenSpaceConfigSection
              drawerState={{
                spacesList, form, setForm, editingId, setEditingId, setIsFormOffsetOpen,
                handleFormOffsetToggle, handleAdd, handleEdit, handleDelete,
                handleSaveAndClose: () => {
                  handleSaveAndClose();
                  onClose();
                },
                toggleOffset,
                totalNetSqM, totalNetSqFt, totalGrossSqM, totalGrossSqFt,
              }}
              setMainDim={setMainDim}
              setShape={setShape}
              t={t}
            />
          </div>
        </div>

        <OffsetPopup
          offsetRoom={offsetSpace || null}
          entityLabel="Open Space"
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
    </>
  );
}
