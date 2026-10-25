import { Plus, Loader2 } from "lucide-react";
import { SearchSelect} from "@/components/common";
import { AnimatedDigitInput } from "@/components/common/AnimatedDigitInput";
import type { UnitPoolGeneratorProps } from "@/types/asset/floor-details.types";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";

export function UnitPoolGenerator({
  dropdownOptions,
  genType,
  setGenType,
  genFromFloor,
  setGenFromFloor,
  genToFloor,
  setGenToFloor,
  genCountPerFloor,
  setGenCountPerFloor,
  isGenerating,
  handleGenerate,
  TYPE_OPTIONS,
  t
}: UnitPoolGeneratorProps) {
  const fromIdx = (dropdownOptions?.floorLevels || []).findIndex((f: { value: string | number }) => String(f.value) === String(genFromFloor));
  const toIdx = (dropdownOptions?.floorLevels || []).findIndex((f: { value: string | number }) => String(f.value) === String(genToFloor));
  const numFloors = fromIdx !== -1 && toIdx !== -1 ? Math.abs(toIdx - fromIdx) + 1 : 0;
  const totalCount = numFloors * (Number(genCountPerFloor) || 0);

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{t("floorDetails.generateUnits")}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{t("floorDetails.type")}</label>
          <SearchSelect
            value={genType || ""}
            onChange={(_name, value) => setGenType(value)}
            options={withSelectPlaceholder(TYPE_OPTIONS)}
            placeholder="--Select--"
          />
        </div>
        <div className="w-44">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{t("floorDetails.fromFloor") || "From Floor"}</label>
          <SearchSelect
            value={genFromFloor || ""}
            onChange={(_name, value) => setGenFromFloor(value)}
            options={withSelectPlaceholder(dropdownOptions?.floorLevels || [])}
            placeholder="--Select--"
          />
        </div>
        <div className="w-44">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{t("floorDetails.toFloor") || "To Floor"}</label>
          <SearchSelect
            value={genToFloor || ""}
            onChange={(_name, value) => setGenToFloor(value)}
            options={withSelectPlaceholder(dropdownOptions?.floorLevels || [])}
            placeholder="--Select--"
          />
        </div>
        <div className="w-28">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{t("floorDetails.unitsPerFloor") || "Units / Floor"}</label>
          <AnimatedDigitInput
            maxLength={3}
            allowedPattern={/^[0-9]$/}
            value={String(genCountPerFloor)}
            onChange={(val) => {
              const cleaned = String(val).replace(/[^0-9]/g, '').slice(0, 3);
              if (cleaned === "") {
                setGenCountPerFloor("");
              } else {
                const num = Math.min(999, parseInt(cleaned, 10) || 0);
                setGenCountPerFloor(num > 0 ? num : "");
              }
            }}
            className="h-8 text-xs font-bold text-[#2d42db] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="w-28">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{t("floorDetails.totalUnits") || "Total Units"}</label>
          <AnimatedDigitInput
            disabled
            value={String(totalCount || "")}
            onChange={() => {}}
            className="h-8 text-xs font-bold text-slate-500 bg-slate-100 border-slate-200 cursor-not-allowed"
          />
        </div>
        <div className="w-44">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !genType || !genFromFloor || !genToFloor || !genCountPerFloor || Number(genCountPerFloor) < 1}
            className={`w-full h-8 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors shadow-sm ${isGenerating || !genType || !genFromFloor || !genToFloor || !genCountPerFloor || Number(genCountPerFloor) < 1
              ? "bg-blue-300 cursor-not-allowed text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}>
            {isGenerating
              ? <><Loader2 className="size-3.5 animate-spin" /> {t("floorDetails.generating")}</>
              : <><Plus className="size-3.5" strokeWidth={3} /> {t("floorDetails.generateUnitsCount", { count: totalCount || "" })}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
