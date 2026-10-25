'use client';

import type { RoomFormProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
import React from "react";
import { Plus, EyeIcon } from "lucide-react";
import { Input, SearchSelect } from "@/components/common";
import { AnimatedDigitInput } from "@/components/common/AnimatedDigitInput";
import { Room, SHAPES, getDimFields, DimKey, blankRoom, getLocalizedDimLabel } from "@/lib/utils/asset-utils/room-utils";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";



export function RoomForm({
  form,
  setForm,
  roomsLength,
  editingId,
  setEditingId,
  setShape,
  setMainDim,
  handleFormOffsetToggle,
  setIsFormOffsetOpen,
  handleAdd,
  t,
  roomTypes
}: RoomFormProps) {
  // Local state to preserve exact string typed (like "7.") before it's parsed as a float
  const [localDims, setLocalDims] = React.useState<Record<string, string>>({});

  // Reset local typing state whenever the active room form changes
  const [prevFormId, setPrevFormId] = React.useState(form.id);
  if (prevFormId !== form.id) {
    setPrevFormId(form.id);
    setLocalDims({});
  }

  const dimFields = getDimFields(form.shape);
  const inp = "h-7 text-[11px] font-semibold text-slate-700 border-slate-300 rounded-md";

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3 [&_label]:text-[11px] [&_label]:mb-1 [&_label]:!font-bold [&_label]:!uppercase [&_label]:!tracking-wide [&_label]:text-slate-700 [&_input]:!px-2 [&_input]:!py-1 [&_input]:!h-7 [&_input]:!text-[11px] [&_input]:!rounded-md [&_select]:!px-2 [&_select]:!h-7 [&_select]:!text-[11px] [&_select]:!rounded-md [&_select]:!text-slate-700 [&_select]:border-slate-300 [&_select]:bg-white">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{t("subunit.labels.roomNo")}</label>
          <Input type="text" value={form.roomNo} onChange={(e) => setForm((p) => ({ ...p, roomNo: e.target.value }))} className={inp} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{t("subunit.fields.roomType")}</label>
          <SearchSelect
            value={form.roomType || ""}
            onChange={(_name, value) => setForm((p) => ({ ...p, roomType: value }))}
            options={withSelectPlaceholder(roomTypes || [])}
            placeholder="--Select--"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{t("subunit.labels.shape")}</label>
          <SearchSelect
            value={form.shape || ""}
            onChange={(_name, value) => setShape(value)}
            options={withSelectPlaceholder(SHAPES)}
            placeholder="--Select--"
          />
        </div>

        {dimFields.map((df) => {
          const displayValue = localDims[df.key] !== undefined 
            ? localDims[df.key] 
            : String((form[df.key as keyof Room] as number) === 0 ? "" : (form[df.key as keyof Room] as number));
            
          return (
            <div key={df.key} className="min-w-0">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{getLocalizedDimLabel(form.shape, df.key, df.label, t)}</label>
              <AnimatedDigitInput
                value={displayValue}
                onChange={(val) => {
                  setLocalDims((prev) => ({ ...prev, [df.key]: val }));
                  setMainDim(df.key as DimKey, val);
                }}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()} className={`${inp} w-full`} placeholder="0" />
            </div>
          );
        })}

        <div>
          <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">{t("subunit.labels.offsetCutout")}</label>
          <div className="flex items-center gap-1">
            <div className="flex-1 min-w-0">
              <SearchSelect
                value={form.hasOffset || ""}
                onChange={(_name, value) => handleFormOffsetToggle(value as "Yes" | "No")}
                options={withSelectPlaceholder([
                  { label: t("floorDetails.no"), value: "No" },
                  { label: t("floorDetails.yes"), value: "Yes" },
                ])}
                placeholder="--Select--"
              />
            </div>
            {form.hasOffset === "Yes" && (
              <button
                type="button"
                onClick={() => setIsFormOffsetOpen(true)}
                className="h-[32px] px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 rounded-lg flex items-center gap-1 text-[9px] font-black uppercase shrink-0 transition-colors shadow-xs"
                title={t("subunit.labels.seeOffset") || "See Offset"}
              >
                <EyeIcon className="size-3.5" />
                <span className="whitespace-nowrap">{t("subunit.labels.seeOffset") || "See Offset"}</span>
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">{t("subunit.labels.outerDeduction")}</label>
          <SearchSelect
            value={form.outer || ""}
            onChange={(_name, value) => setForm((p) => ({ ...p, outer: value as "Yes" | "No" }))}
            options={withSelectPlaceholder([
              { label: t("floorDetails.no"), value: "No" },
              { label: t("floorDetails.yes"), value: "Yes" },
            ])}
            placeholder="--Select--"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{t("subunit.labels.totalAreaSqM")}</label>
          <Input type="text" readOnly
            value={(() => {
              const baseArea = form.netAreaSqM * form.count;
              if (form.minus === "Yes") {
                return (-baseArea).toFixed(2);
              }
              if (form.outer === "Yes") {
                return (baseArea * 0.8).toFixed(2);
              }
              return baseArea.toFixed(2);
            })()}
            className={`${inp} bg-blue-50 border-blue-200 text-blue-700 font-bold cursor-default`} />
        </div>
        <div className="flex items-end justify-end gap-2 col-span-3 sm:col-span-1">
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(blankRoom(roomsLength + 1)); }}
              className="h-8 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold uppercase">{t("floorDetails.cancel") || "Cancel"}</button>
          )}
          <button type="button" onClick={handleAdd}
            className="h-8 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase shadow-sm">
            <Plus className="size-3.5" />{editingId ? t("subunit.labels.updateRoom") || "Update Room" : t("subunit.labels.addRoom") || "Add Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
