'use client';

import { X, Layers } from "lucide-react";
import { Button } from "@/components/common";


import { ShapePreview } from "./ShapePreview";
import { RoomForm } from "./RoomForm";
import { RoomTable } from "./RoomTable";
import { OffsetPopup } from "./OffsetPopup";
import { RoomWiseSubmissionDrawerProps } from "@/types/asset/sub-units.types";

import { useNARoomWiseSubmissionDrawer } from "@/hooks/asset-hooks/useNARoomWiseSubmissionDrawer";

export function RoomWiseSubmissionDrawer({ isOpen, onClose, unit, onSaveRooms, roomTypes }: RoomWiseSubmissionDrawerProps) {
  const {
    t,
    rooms,
    form,
    setForm,
    editingId,
    setEditingId,
    offsetRoom,
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
    handleAdd,
    handleEdit,
    handleDelete,
    toggleOffset,
    handleFormOffsetToggle,
    setIsFormOffsetOpen,
    carpetSqM,
    carpetSqFt,
    builtUpSqM,
    builtUpSqFt,
    handleSaveAndClose,
    setMainDim,
    setShape,
    roomTypes: dynamicRoomTypes,
  } = useNARoomWiseSubmissionDrawer({ isOpen, onClose, unit, onSaveRooms });

  const finalRoomTypes = dynamicRoomTypes && dynamicRoomTypes.length > 0 ? dynamicRoomTypes : roomTypes;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-6xl bg-slate-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600 border-b border-blue-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-lg"><Layers className="size-4 text-white" /></div>
            <div><h2 className="text-sm font-black text-white uppercase tracking-wider">{t("floorDetails.roomWiseSubmission")}</h2></div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={X}
            onClick={onClose}
            className="h-auto! w-auto! p-1.5! rounded-lg! text-blue-100! hover:bg-blue-700! hover:text-white! focus:ring-0! focus:ring-offset-0!"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <RoomForm
                form={form} setForm={setForm} roomsLength={rooms.length} editingId={editingId} setEditingId={setEditingId}
                setShape={setShape} setMainDim={setMainDim} handleFormOffsetToggle={handleFormOffsetToggle}
                setIsFormOffsetOpen={setIsFormOffsetOpen} handleAdd={handleAdd} t={t}
                roomTypes={finalRoomTypes}
              />

              <RoomTable
                rooms={rooms} carpetSqM={carpetSqM} carpetSqFt={carpetSqFt} builtUpSqM={builtUpSqM} builtUpSqFt={builtUpSqFt}
                toggleOffset={toggleOffset} handleEdit={handleEdit} handleDelete={handleDelete} t={t}
              />
            </div>

            <div className="lg:col-span-1 flex flex-col">
              <div className="bg-white rounded-xl flex flex-col h-full border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-white/20 rounded-md"><Layers className="size-4 text-white" /></div>
                    <span className="text-[11px] font-bold bg-blue-800/40 px-2 py-0.5 rounded-full border border-white/20">
                      {t("subunit.labels.areaEquals", { area: form.areaSqM.toFixed(2) })}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {t("subunit.labels.roomNumberText", { no: form.roomNo || "1" })}
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-3 bg-slate-50/50 min-h-[260px]">
                  <div className="w-full h-full max-w-[280px] max-h-[280px] aspect-square bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center p-2 relative">
                    <ShapePreview
                      shape={form.shape}
                      areaSqM={form.areaSqM}
                      label={form.roomNo}
                      length={form.length}
                      width={form.width}
                      height={form.height}
                      base1={form.base1}
                      base2={form.base2}
                      radius={form.radius}
                    />
                  </div>
                </div>

                <div className="p-3 bg-white border-t border-slate-100 space-y-2 shrink-0">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveAndClose}
                    className="w-full! h-auto! px-4! py-2.5! bg-blue-600! hover:bg-blue-700! text-white! font-black! uppercase! text-xs! tracking-wider! rounded-xl! shadow-md!"
                  >
                    {t("buttons.saveRooms")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OffsetPopup
        offsetRoom={offsetRoom || null} drawerOffsets={drawerOffsets} tempOffsetShape={tempOffsetShape} setTempOffsetShape={setTempOffsetShape}
        tempOffsetLength={tempOffsetLength} setTempOffsetLength={setTempOffsetLength} tempOffsetWidth={tempOffsetWidth}
        setTempOffsetWidth={setTempOffsetWidth} tempOffsetHeight={tempOffsetHeight} setTempOffsetHeight={setTempOffsetHeight}
        tempOffsetBase1={tempOffsetBase1} setTempOffsetBase1={setTempOffsetBase1} tempOffsetBase2={tempOffsetBase2}
        setTempOffsetBase2={setTempOffsetBase2} tempOffsetRadius={tempOffsetRadius} setTempOffsetRadius={setTempOffsetRadius}
        tempOffsetOp={tempOffsetOp} setTempOffsetOp={setTempOffsetOp} tempOffsetAreaSqM={tempOffsetAreaSqM}
        drawerNetAdjustmentSqM={drawerNetAdjustmentSqM} handleAddOffsetToHistory={handleAddOffsetToHistory}
        handleRemoveOffsetFromHistory={handleRemoveOffsetFromHistory} handleDrawerClose={handleDrawerClose}
        handleOkSave={handleOkSave} t={t}
      />
    </div>
  );
}
