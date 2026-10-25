'use client';

import { useState } from "react";
import { Plus, EyeIcon } from "lucide-react";
import { SearchSelect, } from "@/components/common";
import { AnimatedDigitInput } from "@/components/common/AnimatedDigitInput";
import { SHAPES, getDimFields, DimKey, getLocalizedDimLabel } from "@/lib/utils/asset-utils/room-utils";
import { blankOpenSpace, OpenSpace } from "@/hooks/asset-hooks/useOpenSpaceDrawer";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";

const OPEN_SPACE_TYPES = [
  "Balcony", "Courtyard", "Terrace", "Open Terrace",
  "Garden", "Parking", "Verandah", "Passage", "Utility Area",
];

export function OpenSpaceForm({
  form,
  setForm,
  spacesLength,
  editingId,
  setEditingId,
  setShape,
  setMainDim,
  handleFormOffsetToggle,
  setIsFormOffsetOpen,
  handleAdd,
  t,
  dropdownOptions: _dropdownOptions,
}: {
  form: OpenSpace;
  setForm: React.Dispatch<React.SetStateAction<OpenSpace>>;
  spacesLength: number;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  setShape: (shape: string) => void;
  setMainDim: (key: DimKey, val: string) => void;
  handleFormOffsetToggle: (val: "Yes" | "No") => void;
  setIsFormOffsetOpen: (open: boolean) => void;
  handleAdd: () => void;
  t: (key: string) => string;
  dropdownOptions?: Record<string, unknown>;
}) {
  // Local state to preserve exact string typed before it's parsed as a float
  const [localDims, setLocalDims] = useState<Record<string, string>>({});

  // Reset local typing state whenever the active open space form changes
    const [prevFormId, setPrevFormId] = useState(form.id);
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
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{'Open Space Type'}</label>
          <SearchSelect
            value={form.name || ""}
            onChange={(_, value) => setForm((p: OpenSpace) => ({ ...p, name: value, roomNo: value }))}
            options={withSelectPlaceholder(OPEN_SPACE_TYPES)}
            placeholder="--Select--"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{t("subunit.labels.shape") || "Shape"}</label>
          <SearchSelect
            value={form.shape || ""}
            onChange={(_, value) => setShape(value)}
            options={withSelectPlaceholder(SHAPES)}
            placeholder="--Select--"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{t("inventory.columns.quantity") || "Count"}</label>
          <AnimatedDigitInput
            value={form.count === 0 ? "" : String(form.count)}
            onChange={(val) => setForm((p: OpenSpace) => ({ ...p, count: Math.max(1, parseInt(val) || 1) }))}
            allowedPattern={/^[0-9]$/}
            className={inp}
          />
        </div>

        {dimFields.map((df) => {
          const displayValue = localDims[df.key] !== undefined 
            ? localDims[df.key] 
            : String((form[df.key] as number) === 0 ? "" : (form[df.key] as number));
            
          return (
            <div key={df.key} className="min-w-0">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{getLocalizedDimLabel(form.shape, df.key, df.label, t)}</label>
              <AnimatedDigitInput
                value={displayValue}
                onChange={(val) => {
                  setLocalDims((prev) => ({ ...prev, [df.key]: val }));
                  setMainDim(df.key as DimKey, val);
                }}
                onFocus={(e) => e.target.select()} className={`${inp} w-full`} placeholder="0" />
            </div>
          );
        })}

        <div>
          <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">{t("subunit.labels.offsetCutout") || "Offset / Cutout"}</label>
          <div className="flex items-center gap-1">
            <div className="flex-1 min-w-0">
              <SearchSelect
                value={form.hasOffset || ""}
                onChange={(_, value) => handleFormOffsetToggle(value as "Yes" | "No")}
                options={withSelectPlaceholder([
                  { label: t("floorDetails.no") || "No", value: "No" },
                  { label: t("floorDetails.yes") || "Yes", value: "Yes" },
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
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{t("subunit.labels.totalAreaSqM") || "Total Area (m²)"}</label>
          <input type="text" readOnly
            value={(form.netAreaSqM * form.count).toFixed(2)}
            className={`${inp} bg-blue-50 border-blue-200 text-blue-700 font-bold cursor-default`} />
        </div>

        <div className="flex items-end justify-end gap-2 col-span-3 sm:col-span-1">
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(blankOpenSpace(spacesLength + 1)); }}
              className="h-8 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold uppercase">{t("floorDetails.cancel")}</button>
          )}
          <button type="button" onClick={handleAdd}
            className="h-8 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase shadow-sm">
            <Plus className="size-3.5" />{editingId ? "Update Open Space" : "Add Open Space"}
          </button>
        </div>
      </div>
    </div>
  );
}
