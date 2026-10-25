'use client';

import React from "react";
import { Plus } from "lucide-react";
import { SearchSelect, } from "@/components/common";
import { AnimatedDigitInput } from "@/components/common/AnimatedDigitInput";
import { SHAPES, getDimFields, getLocalizedDimLabel } from "@/lib/utils/asset-utils/room-utils";
import { OffsetEntryFormProps } from "@/types/asset/sub-units.types";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";

export function OffsetEntryForm({
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
  handleAddOffsetToHistory,
  t,
}: OffsetEntryFormProps) {
  const [localDims, setLocalDims] = React.useState<Record<string, string>>({});

  const tempDimFields = getDimFields(tempOffsetShape);
  const inp = "h-7 text-[11px] font-semibold text-slate-700 border-slate-300 rounded-md";

  const renderTempInput = (key: string, val: number, setter: (v: number) => void, label: string) => {
    const displayValue = localDims[key] !== undefined ? localDims[key] : String(val === 0 ? "" : val);
    return (
      <div key={key}>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{label}</label>
        <AnimatedDigitInput
          value={displayValue}
          onChange={(v) => {
            setLocalDims((prev) => ({ ...prev, [key]: v }));
            setter(parseFloat(v) || 0);
          }}
          onFocus={(e) => e.target.select()}
          className={inp} placeholder="0"
        />
      </div>
    );
  };

  return (
    <div className="bg-white border border-amber-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-amber-50/50 px-2.5 py-1.5 border-b border-amber-100">
        <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">{'Add New Offset / Cutout'}</span>
      </div>
      <div className="p-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{t("subunit.labels.shape")}</label>
            <SearchSelect
              value={tempOffsetShape || ""}
              onChange={(_name, value) => {
                setTempOffsetShape(value);
                setLocalDims({});
                setTempOffsetLength(0); setTempOffsetWidth(0); setTempOffsetHeight(0);
                setTempOffsetBase1(0); setTempOffsetBase2(0); setTempOffsetRadius(0);
              }}
              options={withSelectPlaceholder(SHAPES)}
              placeholder="--Select--"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{t("subunit.labels.operation")}</label>
            <SearchSelect
              value={tempOffsetOp || ""}
              onChange={(_name, value) => setTempOffsetOp(value as "Add" | "Subtract")}
              options={withSelectPlaceholder([
                { label: "Subtract (Cutout)", value: "Subtract" },
                { label: "Add (Extension)", value: "Add" },
              ])}
              placeholder="--Select--"
            />
          </div>

          {tempDimFields.map((df) => {
            const localizedLabel = getLocalizedDimLabel(tempOffsetShape, df.key, df.label, t);
            if (df.key === "length") return renderTempInput("length", tempOffsetLength, setTempOffsetLength, localizedLabel);
            if (df.key === "width") return renderTempInput("width", tempOffsetWidth, setTempOffsetWidth, localizedLabel);
            if (df.key === "height") return renderTempInput("height", tempOffsetHeight, setTempOffsetHeight, localizedLabel);
            if (df.key === "base1") return renderTempInput("base1", tempOffsetBase1, setTempOffsetBase1, localizedLabel);
            if (df.key === "base2") return renderTempInput("base2", tempOffsetBase2, setTempOffsetBase2, localizedLabel);
            if (df.key === "radius") return renderTempInput("radius", tempOffsetRadius, setTempOffsetRadius, localizedLabel);
            return null;
          })}
        </div>

        {tempOffsetAreaSqM > 0 && (
          <div className={`p-2 rounded flex items-center justify-between mt-2 ${tempOffsetOp === "Subtract" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800"}`}>
            <div className="text-[10px] font-bold uppercase">{tempOffsetOp === "Subtract" ? "Deduction" : "Addition"}:</div>
            <div className="font-mono text-xs font-black">{tempOffsetOp === "Subtract" ? "−" : "+"}{tempOffsetAreaSqM.toFixed(2)}{' m²'}</div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={tempOffsetAreaSqM <= 0}
            onClick={handleAddOffsetToHistory}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white h-7 rounded text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-colors"
          ><Plus className="size-3" /> {'Add Entry'}</button>
        </div>
      </div>
    </div>
  );
}

export default OffsetEntryForm;
