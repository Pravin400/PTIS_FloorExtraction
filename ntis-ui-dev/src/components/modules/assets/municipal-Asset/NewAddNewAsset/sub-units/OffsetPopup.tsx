'use client';

import type { OffsetPopupProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
import { X, Scissors, Trash2 } from "lucide-react";
import { OffsetEntryForm } from "./OffsetEntryForm";

export function OffsetPopup({
  offsetRoom,
  entityLabel = "Room",
  drawerOffsets,
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
  tempOffsetAreaSqM,
  drawerNetAdjustmentSqM,
  handleAddOffsetToHistory,
  handleRemoveOffsetFromHistory,
  handleDrawerClose,
  handleOkSave,
  t,
}: OffsetPopupProps) {
  if (!offsetRoom) return null;

  const isOuter = (offsetRoom as { outer?: string })?.outer === "Yes";
  const isMinus = (offsetRoom as { minus?: string })?.minus === "Yes";
  const outerFactor = isOuter ? 0.8 : 1;

  const tempOffsetNetValue = tempOffsetOp === "Subtract" ? -tempOffsetAreaSqM : tempOffsetAreaSqM;
  const unadjustedNetSqM = Math.max(0, Number((offsetRoom as { areaSqM?: number })?.areaSqM || 0) + drawerNetAdjustmentSqM);
  const currentNetSqM = isMinus ? -unadjustedNetSqM : unadjustedNetSqM * outerFactor;
  const projectedNetSqM = Math.max(0, currentNetSqM + (tempOffsetNetValue * outerFactor));

  return (
    <div className="absolute inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" onClick={handleDrawerClose} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-amber-100 text-amber-700 rounded-md"><Scissors className="size-3.5" /></div>
            <div>
              <h3 className="text-xs font-black text-amber-800 uppercase tracking-wide">{t("subunit.labels.manageOffsets")}</h3>
              <p className="text-[9px] font-bold text-amber-600 uppercase">{entityLabel} {String((offsetRoom as Record<string, unknown>)?.roomNo ?? '')}</p>
            </div>
          </div>
          <button onClick={handleDrawerClose} className="p-1 hover:bg-amber-100 rounded text-amber-600">
            <X className="size-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center flex flex-col justify-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t("subunit.labels.baseRoomArea")}</span>
            <span className="text-sm font-black text-slate-800">{Number((offsetRoom as { areaSqM?: number })?.areaSqM || 0).toFixed(2)}{' m²'}</span>
            {drawerNetAdjustmentSqM !== 0 && (
              <span className={`text-[10px] font-bold ${drawerNetAdjustmentSqM > 0 ? "text-blue-600" : "text-amber-600"}`}>
                {drawerNetAdjustmentSqM > 0 ? "+" : ""}{drawerNetAdjustmentSqM.toFixed(2)}{' m² from entries'}
              </span>
            )}
            {isOuter && (
              <span className="text-[10px] font-bold text-indigo-600 mt-0.5">{'× 80% Outer Deduction Applied'}</span>
            )}
            {isMinus && (
              <span className="text-[10px] font-bold text-rose-600 mt-0.5">{'Minus / Deducted from Floor Carpet'}</span>
            )}
            <div className="mt-1 pt-1 border-t border-slate-200">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{'Current Net Area'}</span>
              <div className="text-sm font-black text-blue-600">{currentNetSqM.toFixed(2)}{' m²'}</div>
            </div>
          </div>

          <OffsetEntryForm
            tempOffsetShape={tempOffsetShape} setTempOffsetShape={setTempOffsetShape}
            tempOffsetLength={tempOffsetLength} setTempOffsetLength={setTempOffsetLength}
            tempOffsetWidth={tempOffsetWidth} setTempOffsetWidth={setTempOffsetWidth}
            tempOffsetHeight={tempOffsetHeight} setTempOffsetHeight={setTempOffsetHeight}
            tempOffsetBase1={tempOffsetBase1} setTempOffsetBase1={setTempOffsetBase1}
            tempOffsetBase2={tempOffsetBase2} setTempOffsetBase2={setTempOffsetBase2}
            tempOffsetRadius={tempOffsetRadius} setTempOffsetRadius={setTempOffsetRadius}
            tempOffsetOp={tempOffsetOp} setTempOffsetOp={setTempOffsetOp}
            tempOffsetAreaSqM={tempOffsetAreaSqM}
            handleAddOffsetToHistory={handleAddOffsetToHistory}
            t={t}
          />

          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider px-1">{'Added Entries'}</span>
            {drawerOffsets.length === 0 ? (
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-[10px] font-bold uppercase">{'No entries added yet'}</div>
            ) : (
              <div className="space-y-1.5">
                {drawerOffsets.map((entry) => (
                  <div key={entry.id} className={`flex items-center justify-between p-2 rounded-lg border ${entry.op === "Add" ? "bg-blue-50/50 border-blue-200" : "bg-amber-50/50 border-amber-200"}`}>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase text-white ${entry.op === "Add" ? "bg-blue-500" : "bg-amber-500"}`}>
                          {entry.op === "Add" ? "+" : "−"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700">{entry.shape}</span>
                      </div>
                      <span className={`text-[11px] font-black font-mono ${entry.op === "Add" ? "text-blue-700" : "text-amber-700"}`}>
                        {entry.areaSqM.toFixed(2)}{' m²'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOffsetFromHistory(entry.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                      title="Remove entry"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase">{'Projected Net Area'}</span>
            <span className="text-sm font-black text-blue-600">{projectedNetSqM.toFixed(2)}{' m²'}</span>
          </div>
          <button
            type="button"
            onClick={handleOkSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm transition-colors cursor-pointer"
          >{'OK'}</button>
        </div>
      </div>
    </div>
  );
}
