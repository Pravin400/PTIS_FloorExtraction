'use client';

import { Plus, EyeIcon } from "lucide-react";
import { SearchSelect, AnimatedDigitInput, Button } from "@/components/common";
import { getDimFields, SHAPES, DimKey, getLocalizedDimLabel } from "@/lib/utils/asset-utils/room-utils";
import { blankAmenity, Amenity } from "@/hooks/asset-hooks/useAmenityDrawer";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";

const AMENITY_TYPES = [
  "Clubhouse", "Gym", "Swimming Pool", "Community Hall",
  "Play Area", "Security Room", "Lift Room", "Generator Room",
  "Solar System", "Fire Fighting System", "Rainwater Harvesting",
  "Others"
];

export function AmenityForm({
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
}: {
  form: Amenity;
  setForm: React.Dispatch<React.SetStateAction<Amenity>>;
  spacesLength: number;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  setShape: (shape: string) => void;
  setMainDim: (key: DimKey, val: string) => void;
  handleFormOffsetToggle: (val: "Yes" | "No") => void;
  setIsFormOffsetOpen: (open: boolean) => void;
  handleAdd: () => void;
  t: (key: string) => string;
}) {
  const inp = "h-7 text-[11px] font-semibold text-slate-700 border-slate-300 rounded-md";
  const dimFields = getDimFields(form.shape);

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3 [&_label]:text-[11px] [&_label]:mb-1 [&_label]:!font-bold [&_label]:!uppercase [&_label]:!tracking-wide [&_label]:text-slate-700 [&_input]:!px-2 [&_input]:!py-1 [&_input]:!h-7 [&_input]:!text-[11px] [&_input]:!rounded-md [&_select]:!px-2 [&_select]:!h-7 [&_select]:!text-[11px] [&_select]:!rounded-md [&_select]:!text-slate-700 [&_select]:border-slate-300 [&_select]:bg-white">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{'Amenity Type'}</label>
          <SearchSelect
            value={form.name || ""}
            onChange={(_, value) => setForm((p: Amenity) => ({ ...p, name: value }))}
            options={withSelectPlaceholder(AMENITY_TYPES)}
            placeholder="--Select--"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{'Shape'}</label>
          <SearchSelect
            value={form.shape || ""}
            onChange={(_, value) => setShape(value)}
            options={withSelectPlaceholder(SHAPES)}
            placeholder="--Select--"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{'Count'}</label>
          <AnimatedDigitInput
            value={form.count === 0 ? "" : String(form.count)}
            onChange={(val) => setForm((p: Amenity) => ({ ...p, count: Math.max(1, parseInt(val) || 1) }))}
            allowedPattern={/^[0-9]$/}
            className={inp}
          />
        </div>

        {dimFields.map((df) => (
          <div key={df.key} className="min-w-0">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{getLocalizedDimLabel(form.shape, df.key, df.label, t)}</label>
            <AnimatedDigitInput
              value={(form[df.key] as number) === 0 ? "" : String(form[df.key] as number)}
              onChange={(val) => setMainDim(df.key as DimKey, val)}
              allowedPattern={/^[0-9.]$/}
              className={`${inp} w-full`} placeholder="0"
            />
          </div>
        ))}

        <div>
          <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">{'Offset / Cutout'}</label>
          <SearchSelect
            value={form.hasOffset || ""}
            onChange={(_, value) => handleFormOffsetToggle(value as "Yes" | "No")}
            options={withSelectPlaceholder([{ label: "No", value: "No" }, { label: "Yes", value: "Yes" }])}
            placeholder="--Select--"
          />
          {form.hasOffset === "Yes" && (
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsFormOffsetOpen(true)}
              className="h-auto p-0 text-[9px] text-amber-600 hover:text-amber-700 font-black uppercase flex items-center gap-0.5 mt-1 mx-auto bg-transparent hover:bg-transparent"
            ><EyeIcon className="size-3" /> {'See Offsets'}</Button>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{'Gross Area'}</label>
          <AnimatedDigitInput disabled
            value={`${(form.areaSqM * form.count).toFixed(2)} m²`}
            onChange={() => {}}
            className={`${inp} bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed`}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">{'Net Area (after offsets)'}</label>
          <AnimatedDigitInput disabled
            value={`${(form.netAreaSqM * form.count).toFixed(2)} m²`}
            onChange={() => {}}
            className={`${inp} bg-blue-50 border-blue-200 text-blue-700 font-bold cursor-default`}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
        {editingId && (
          <Button variant="secondary" type="button" onClick={() => { setEditingId(null); setForm(blankAmenity(spacesLength + 1)); }}
            className="h-8 px-4 text-[10px] font-bold uppercase">
            {t("floorDetails.cancel")}
          </Button>
        )}
        <Button variant="primary" type="button" icon={Plus} onClick={handleAdd}
          className="h-8 px-6 text-[10px] font-black uppercase shadow-sm bg-blue-600 hover:bg-blue-700">
          {editingId ? "Update Amenity" : "Add Amenity"}
        </Button>
      </div>
    </div>
  );
}
