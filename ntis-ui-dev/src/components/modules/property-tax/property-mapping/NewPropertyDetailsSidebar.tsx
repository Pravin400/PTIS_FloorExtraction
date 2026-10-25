import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Label } from "@/components/common";
import { NewProperty } from "@/types/property-mapping";
import { formatArea } from "./mappingUtils";

interface BasePropertySidebarProps {
  currentProperty: NewProperty | undefined;
  inferredMappingType: string;
  selectedNewIndex: number;
  totalCount: number;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  rvLabel?: string;
}

export function BasePropertySidebar({
  currentProperty,
  inferredMappingType,
  selectedNewIndex,
  totalCount,
  onPrevRecord,
  onNextRecord,
  rvLabel,
}: BasePropertySidebarProps) {
  const t = useTranslations("propertyMapping");
  if (!currentProperty) return null;

  const fields = [
    { label: t("sidebar.fields.newPropertyNo"), val: (currentProperty.fullPropNo as string) || currentProperty.propNo || "", mono: true },
    { label: t("sidebar.fields.ctsNo"), val: currentProperty.cts, mono: true },
    { label: t("sidebar.fields.ownerName"), val: currentProperty.owner, bold: true },
    { label: t("sidebar.fields.address"), val: currentProperty.address },
    { label: t("sidebar.fields.mobile"), val: currentProperty.mobile, mono: true },
    { label: t("sidebar.fields.plotBuiltArea"), val: currentProperty.plotArea || currentProperty.builtUpArea ? `${formatArea(currentProperty.plotArea)} / ${formatArea(currentProperty.builtUpArea)} ${t("sidebar.areaUnit")}` : "" },
    { label: t("sidebar.fields.carpetArea"), val: currentProperty.carpetArea ? `${formatArea(currentProperty.carpetArea)} ${t("sidebar.areaUnit")}` : "", mono: true },
    { label: t("sidebar.fields.floors"), val: currentProperty.floors },
    { label: t("sidebar.fields.useCategory"), val: currentProperty.use, badge: true },
    {
      label: rvLabel || t("sidebar.fields.rateableValue"),
      val: currentProperty.rv ? "₹" + currentProperty.rv.toLocaleString("en-IN") : "",
      mono: true
    },
    {
      label: t("sidebar.fields.totalTax"),
      val: currentProperty.tax ? "₹" + currentProperty.tax.toLocaleString("en-IN") : "",
      mono: true,
      bold: true,
      color: "text-blue-700 font-extrabold"
    }
  ];

  return (
    <aside className="lg:sticky lg:top-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-4 transition-all duration-300">
      <div className="bg-blue-50 border-b border-blue-100 p-4 -mx-4 -mt-4 rounded-t-2xl shadow-xs flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t("sidebar.sectionLabel")}</h3>
          {currentProperty.id !== "dyn-empty" && (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border transition-all duration-200 ${
              currentProperty.status === "Mapped"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : currentProperty.status === "Unmapped"
                ? "bg-slate-100 text-slate-600 border-slate-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {currentProperty.status}
            </span>
          )}
        </div>
        <div className="text-xl font-bold tracking-tight text-slate-800">{currentProperty.propNo}</div>
      </div>

      {/* Auto-detected mapping indicator card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs">
        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
          {t("sidebar.autoDetectedLink")}
        </Label>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex items-center justify-center p-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <span className="font-extrabold text-[12px] font-mono leading-none">🔗</span>
          </div>
          <span className="text-xs font-bold text-slate-700">{inferredMappingType}</span>
        </div>
      </div>

      {/* Field parameters */}
      <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs">
        {fields.map((item, idx) => (
          <div key={idx} className="grid grid-cols-[105px_1fr] py-2.5 px-3 bg-white hover:bg-slate-50/50 transition-colors items-start gap-2.5">
            <span className="text-slate-700 font-black uppercase text-xs tracking-wider pt-0.5">{item.label}</span>
            <span className={`text-right font-semibold text-slate-800 break-words ${
              item.mono ? "font-mono text-xs" : "text-xs"
            } ${item.bold ? "font-black text-slate-900" : ""} ${item.color || ""}`}>
              {item.val}
            </span>
          </div>
        ))}
      </div>

      {/* Next/Prev Navigation */}
      <footer className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1 shrink-0">
        <Button
          variant="secondary"
          size="xs"
          onClick={onPrevRecord}
          disabled={selectedNewIndex === 0}
          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
          icon={ChevronLeft}
        />
        <span className="text-xs font-extrabold text-slate-500">
          {t("sidebar.navigation.recordOf", { current: selectedNewIndex + 1, total: totalCount })}
        </span>
        <Button
          variant="secondary"
          size="xs"
          onClick={onNextRecord}
          disabled={selectedNewIndex === totalCount - 1}
          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
          icon={ChevronRight}
        />
      </footer>
    </aside>
  );
}
