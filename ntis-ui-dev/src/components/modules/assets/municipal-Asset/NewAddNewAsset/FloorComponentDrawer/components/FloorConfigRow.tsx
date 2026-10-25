'use client';

import type { FloorConfigRowProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
export type { FloorConfigRowProps };


import { Input, SearchSelect, ValidationMessage, AnimatedDigitInput } from "@/components/common";
import { CONVERSION_FACTORS } from "@/lib/utils/RoomSubmission/conversions";
import { Plus, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";

const CURRENT_YEAR = new Date().getFullYear();
const DISABLED_CLS = "opacity-40 pointer-events-none select-none";
const BASE_INPUT = "h-8 py-1 text-[13px] px-2";

export function FloorConfigRow({
  newFloor, errors, floorLevels, constructionTypes, useTypes, subUseTypes,
  onFloorChange, onConTypeChange, onConYrChange, onUseTypeChange, onSelect,
  setField, handleAddFloor,
}: FloorConfigRowProps) {
  const conYearNum = Number(newFloor.conYear);

  /* ── Step-lock gates (UI only — numeric range is validated by backend) ─── */
  const conTypeEnabled  = true;
  const conYrEnabled    = true;
  const useTypeEnabled  = true;
  const useTypeSelected = !!newFloor.useType;
  const subUseEnabled   = useTypeSelected;
  const numericEnabled  = true;

  const floorAlreadyAdded = typeof errors.floor === "string" && errors.floor.includes("already been added");
  /* Add is enabled directly; full validation is performed on submit */
  const addEnabled = !floorAlreadyAdded;

  const conYrError = useMemo(() => {
    if (!newFloor.conYear) return errors.conYear;
    if (!/^\d{1,4}$/.test(newFloor.conYear)) return "Numbers only";
    if (newFloor.conYear.length === 4) {
      if (conYearNum < 1800) return "Min 1800";
      if (conYearNum > CURRENT_YEAR) return `Max ${CURRENT_YEAR}`;
    }
    return errors.conYear;
  }, [newFloor.conYear, conYearNum, errors.conYear]);

  return (
    <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-200/60 space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-blue-500 animate-pulse" />
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{'Configure New Floor Level'}</span>
      </div>
      <div className="flex gap-2 w-full">

        {/* Floor — always enabled */}
        <div className="flex-1 min-w-0">
          <label className="block text-[11px] font-medium text-slate-700 mb-1 truncate">{'Floor '} <span className="text-red-500">*</span></label>
          <SearchSelect name="floor" options={withSelectPlaceholder(floorLevels || [])} value={newFloor.floor || ""}
            onChange={onFloorChange} placeholder="--Select--" className={BASE_INPUT} />
          <ValidationMessage message={errors.floor} />
        </div>

        {/* Con Type — enabled after Floor */}
        <div className={`flex-1 min-w-0 ${conTypeEnabled ? "" : DISABLED_CLS}`}>
          <label className="block text-[11px] font-medium text-slate-700 mb-1 truncate">{'Con Type '} <span className="text-red-500">*</span></label>
          <SearchSelect name="conType" options={withSelectPlaceholder(constructionTypes || [])} value={newFloor.conType || ""}
            onChange={onConTypeChange} placeholder="--Select--"
            disabled={!conTypeEnabled} className={BASE_INPUT} />
          <ValidationMessage message={errors.conType} />
        </div>

        {/* Con Yr — enabled after Con Type */}
        <div className={`flex-[0.5] min-w-0 flex flex-col justify-end ${conYrEnabled ? "" : DISABLED_CLS}`}>
          <AnimatedDigitInput
            label="Con Yr"
            required
            maxLength={4}
            placeholder={`e.g. ${CURRENT_YEAR}`}
            value={newFloor.conYear || ""}
            onChange={(val) => {
              // mock event
              onConYrChange({ target: { value: val } } as unknown as React.ChangeEvent<HTMLInputElement>);
            }}
            disabled={!conYrEnabled}
            className="h-8 py-1 text-[13px] border-slate-300"
            fullWidth={true}
          />
          <ValidationMessage message={conYrError} />
        </div>

        {/* Use Type — enabled after valid Con Yr */}
        <div className={`flex-1 min-w-0 ${useTypeEnabled ? "" : DISABLED_CLS}`}>
          <label className="block text-[11px] font-medium text-slate-700 mb-1 truncate">{'Use Type '} <span className="text-red-500">*</span></label>
          <SearchSelect name="useType" options={withSelectPlaceholder(useTypes || [])} value={newFloor.useType || ""}
            onChange={onUseTypeChange} placeholder="--Select--"
            disabled={!useTypeEnabled} className={BASE_INPUT} />
          <ValidationMessage message={errors.useType} />
        </div>

        {/* Sub Use — enabled after Use Type */}
        <div className={`flex-1 min-w-0 ${subUseEnabled ? "" : DISABLED_CLS}`}>
          <label className="block text-[11px] font-medium text-slate-700 mb-1 truncate">{'Sub Use '} <span className="text-red-500">*</span></label>
          <SearchSelect name="subUseType" options={withSelectPlaceholder(subUseTypes || [])} value={newFloor.subUseType || ""}
            onChange={onSelect("subUseType")} placeholder="--Select--"
            disabled={!subUseEnabled} className={BASE_INPUT} />
          <ValidationMessage message={errors.subUseType} />
        </div>

        {/* Rooms, Carpet, Built-Up, Base Value — enabled after Sub Use */}
        <div className="hidden">
          <label className="block text-[11px] font-medium text-slate-700 mb-1 truncate">{'Rooms '} <span className="text-red-500">*</span></label>
          <Input type="number" value={newFloor.rooms}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("rooms")(Number(e.target.value))}
            min={1} disabled={!numericEnabled}
            className={`${BASE_INPUT} border-slate-300`} />
          <ValidationMessage message={errors.rooms} />
        </div>
        <div className={`flex-[0.8] min-w-0 ${numericEnabled ? "" : DISABLED_CLS}`}>
          <label className="block text-[11px] font-medium text-slate-700 mb-1 truncate">{'Carpet(SqM)'}</label>
          <Input type="number" value={newFloor.carpetAreaSqM === 0 ? "" : newFloor.carpetAreaSqM}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = Number(e.target.value);
              setField("carpetAreaSqM")(val);
              setField("builtUpAreaSqM")(Number((val * CONVERSION_FACTORS.BUILTUP_MULTIPLIER).toFixed(2)));
            }}
            min={0} disabled={!numericEnabled}
            className={`${BASE_INPUT} border-slate-300`} />
          <ValidationMessage message={errors.carpetAreaSqM as string} />
        </div>
        <div className={`flex-[0.8] min-w-0 ${numericEnabled ? "" : DISABLED_CLS}`}>
          <label className="block text-[11px] font-medium text-slate-700 mb-1 truncate">{'Built(SqM)'}</label>
          <Input type="number" value={newFloor.builtUpAreaSqM === 0 ? "" : newFloor.builtUpAreaSqM}
            readOnly={true} // Use readOnly instead of disabled so text isn't grayed out
            className={`${BASE_INPUT} border-slate-200 bg-slate-100 cursor-not-allowed text-slate-900 font-bold opacity-100`} />
          <ValidationMessage message={errors.builtUpAreaSqM as string} />
        </div>
        <div className="hidden">
          <label className="block text-[11px] font-medium text-slate-700 mb-1 truncate">{'Base Val '} <span className="text-red-500">*</span></label>
          <Input type="number" value={newFloor.baseValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("baseValue")(Number(e.target.value))}
            min={0} disabled={!numericEnabled}
            className={`${BASE_INPUT} border-slate-300 font-bold`} />
          <ValidationMessage message={errors.baseValue} />
        </div>

        {/* Add button — active only when all step-gates pass */}
        <div className="flex items-end shrink-0">
          <button type="button" onClick={handleAddFloor} disabled={!addEnabled}
            className={`px-3 h-8 text-white rounded-md flex items-center justify-center gap-1 text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${
              addEnabled
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100 cursor-pointer"
                : "bg-blue-300 cursor-not-allowed opacity-60"
            }`}>
            <Plus className="size-3.5" strokeWidth={3} /> {'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
