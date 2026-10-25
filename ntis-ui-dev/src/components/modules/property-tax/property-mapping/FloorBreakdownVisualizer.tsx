import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Button, Label, MasterTable, Column } from "@/components/common";
import { FloorDetail, FloorTab } from "@/types/property-mapping";

interface FloorVisualizerProps {
  floorPropertyTabs: FloorTab[];
  selectedFloorProperty: string;
  setSelectedFloorProperty: (val: string) => void;
  floorDataMap: Record<string, FloorDetail[]>;
  hoveredFloorIndex: number | null;
  setHoveredFloorIndex: (idx: number | null) => void;
  money: (val: number) => string;
  stepNumber?: number;
}

export function FloorVisualizer({
  floorPropertyTabs,
  selectedFloorProperty,
  setSelectedFloorProperty,
  floorDataMap,
  hoveredFloorIndex: _hoveredFloorIndex,
  setHoveredFloorIndex: _setHoveredFloorIndex,
  money: _money,
  stepNumber = 4,
}: FloorVisualizerProps) {
  const t = useTranslations("propertyMapping");
  const currentFloorDetails = selectedFloorProperty ? floorDataMap[selectedFloorProperty] || [] : [];
  const areaUnit = t("floorVisualizer.areaUnit");

  const columns: Column<FloorDetail>[] = [
    {
      key: "floor",
      label: t("floorVisualizer.columns.floor"),
      align: "left",
      cellClassName: "py-1.5 px-2.5 font-extrabold uppercase text-xs text-slate-800",
    },
    {
      key: "use",
      label: t("floorVisualizer.columns.useCategory"),
      cellClassName: "py-1.5 px-2.5 text-slate-700",
    },
    {
      key: "construction",
      label: t("floorVisualizer.columns.construction"),
      cellClassName: "py-1.5 px-2.5 text-slate-700",
    },
    {
      key: "carpetAreaSqFeet",
      label: t("floorVisualizer.columns.carpetArea"),
      align: "center",
      cellClassName: "py-1.5 px-2.5 font-bold font-mono text-slate-900",
      render: (val) => `${Number(val)} ${areaUnit}`,
    },
    {
      key: "builtupAreaSqFeet",
      label: t("floorVisualizer.columns.builtUpArea"),
      align: "center",
      cellClassName: "py-1.5 px-2.5 font-bold font-mono text-slate-900",
      render: (val) => `${Number(val)} ${areaUnit}`,
    },
    {
      key: "constructionYear",
      label: t("floorVisualizer.columns.constructionYear"),
      align: "center",
      cellClassName: "py-1.5 px-2.5 text-slate-700 font-semibold font-mono",
      render: (val) => val ? String(val) : "-",
    },
    {
      key: "assessmentYear",
      label: t("floorVisualizer.columns.assessmentYear"),
      align: "center",
      cellClassName: "py-1.5 px-2.5 text-slate-700 font-semibold font-mono",
      render: (val) => val ? String(val) : "-",
    },
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col gap-3">
      <div className="bg-blue-50/70 border border-blue-100/50 py-2.5 px-3.5 rounded-xl border-l-4 border-l-blue-600 mb-1.5">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
            {t("stepLabel", { step: stepNumber })}
          </span>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            {t("floorVisualizer.step5.title")}
          </h3>
        </div>
        <p className="text-xs text-slate-600 mt-0.5 font-semibold">
          {t("floorVisualizer.step5.description")}
        </p>
      </div>

      {floorPropertyTabs.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 font-bold text-xs flex flex-col items-center gap-2">
          <Info size={24} className="text-slate-400" />
          <span>{t("floorVisualizer.emptyState")}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Sibling tabs */}
          <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto pb-px scrollbar-none">
            {floorPropertyTabs.map(tab => {
              const isActive = selectedFloorProperty === tab.key;
              return (
                <Button
                  key={tab.key}
                  type="button"
                  variant={isActive ? "primary" : "ghost"}
                  size="xs"
                  onClick={() => setSelectedFloorProperty(tab.key)}
                  className={`px-4 py-1.5 text-xs font-bold border-t-2 border-x transition-all duration-200 border-none rounded-b-none min-w-0 shrink-0 ${
                    isActive
                      ? (tab.isNew 
                          ? "bg-blue-600 text-white border-transparent -mb-px rounded-t-lg font-extrabold shadow-sm hover:bg-blue-700"
                          : "bg-indigo-650 text-white border-transparent -mb-px rounded-t-lg font-extrabold shadow-sm hover:bg-indigo-700")
                      : "bg-slate-50/50 border-x-transparent border-t-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase ${
                      tab.isNew 
                        ? (isActive ? "bg-blue-800 text-blue-100" : "bg-blue-50 text-blue-700")
                        : (isActive ? "bg-indigo-800 text-indigo-100" : "bg-indigo-50 text-indigo-700")
                    }`}>
                      {tab.isNew ? t("floorVisualizer.tabLabel.new") : t("floorVisualizer.tabLabel.old")}
                    </span>
                    <span className="font-mono text-xs">{tab.displayPropNo}</span>
                  </div>
                </Button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Floor Details Table */}
            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              {t("floorVisualizer.gridLabel")}
            </Label>
            <MasterTable
              columns={columns}
              data={currentFloorDetails}
              getRowKey={(row, idx) => row.floor + idx}
              paginationConfig={{ enabled: false }}
              tableClassName="min-w-full"
            />
          </div>
        </div>
      )}
    </section>
  );
}
