'use client';

import type { SubUnit } from '@/types/asset/floor-details.types';


import { Sparkles, Plus, Home, Edit2, Trash2, X, Building2 } from "lucide-react";
import { Input, SearchSelect, Button, FloorDetailsTable, type FloorDetailsTableColumn } from "@/components/common";
import { SubUnitDetailedConfigurator } from "./sub-units/SubUnitDetailedConfigurator";
import type { RoomWiseSubmissionStepProps } from "@/types/asset/floor-details.types";
import { useTranslations } from "next-intl";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";

function plainHeader(label: React.ReactNode) {
  const HeaderComponent = () => (
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
  );
  HeaderComponent.displayName = 'PlainHeaderRoomWise';
  return HeaderComponent;
}

export function RoomWiseSubmissionStep({
  isOpen,
  onClose,
  floorId,
  currentFloor,
  localUnits,
  bulk,
  activeUnit,
  dropdownOptions,
  onBulkChange,
  onGenerateBulk,
  onDeleteUnit,
  onSaveSubUnits,
  setActiveUnit,
  onSaveUnitDetail,
}: RoomWiseSubmissionStepProps) {
  const t = useTranslations("addAssetForm");
  if (!isOpen || floorId === null) return null;
  const unitTypes = dropdownOptions?.unitTypes ?? [];

  const columns: FloorDetailsTableColumn<SubUnit>[] = [
    {
      key: "unitNumber",
      label: t("floorDetails.unitNumber"),
      headerRender: plainHeader(t("floorDetails.unitNumber")),
      cellClassName: "text-left font-bold text-slate-800",
      render: (u) => u.unitNumber,
    },
    {
      key: "type",
      label: t("floorDetails.type"),
      headerRender: plainHeader(t("floorDetails.type")),
      cellClassName: "text-left font-semibold text-slate-600",
      render: (u) => u.unitType,
    },
    {
      key: "status",
      label: t("floorDetails.status"),
      headerRender: plainHeader(t("floorDetails.status")),
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (u) => (
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black uppercase tracking-wide">
          {u.status}
        </span>
      ),
    },
    {
      key: "area",
      label: t("floorDetails.areaSqFt"),
      headerRender: plainHeader(t("floorDetails.areaSqFt")),
      headerClassName: "text-right",
      cellClassName: "text-right font-mono font-bold text-slate-700",
      render: (u) => `${u.carpetAreaSqFt} SqFt`,
    },
    {
      key: "action",
      label: t("floorDetails.action"),
      headerRender: plainHeader(t("floorDetails.action")),
      headerClassName: "text-center w-20",
      cellClassName: "text-center flex items-center justify-center gap-1.5",
      render: (u) => (
        <>
          <Button variant="edit" size="xs" onClick={() => setActiveUnit(u)} icon={Edit2} />
          <Button variant="ghost" size="xs" onClick={() => onDeleteUnit(u.id)} icon={Trash2} className="text-slate-400 hover:text-red-500 transition-colors" />
        </>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300" onClick={onClose} />
      <div className="relative w-full max-w-5xl h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-slate-200">

        {/* Header */}
        <div className="px-4 py-3 bg-[#0f172a] text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-blue-400" />
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider">{t("floorDetails.roomWiseSubmission")}</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t("floorDetails.floor")}: {currentFloor?.floor ?? "N/A"}</p>
            </div>
          </div>
          <Button variant="ghost" size="xs" onClick={onClose} icon={X} className="text-slate-400 hover:text-white hover:bg-slate-800 transition-all" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/50">
          {/* Bulk Generator */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="size-3.5 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t("floorDetails.bulkGenerateUnits")}</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <SearchSelect name="unitType" label={t("floorDetails.type") || "Type"} options={withSelectPlaceholder(unitTypes)} value={bulk.unitType || ""}
                onChange={(_n, v) => onBulkChange({ unitType: v, prefix: `${v.toUpperCase()}-` })}
                placeholder="--Select--" className="h-8 text-xs" />
              <Input label={t("floorDetails.prefix") || "Prefix"} value={bulk.prefix} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onBulkChange({ prefix: e.target.value })} className="h-8 text-xs px-2" />
              <Input label={t("floorDetails.startNum") || "Start #"} type="number" min={1} value={bulk.startNum === 0 ? "" : bulk.startNum} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onBulkChange({ startNum: Math.max(1, Number(e.target.value)) })} className="h-8 text-xs px-2" />
              <Input label={t("floorDetails.count") || "Count"} type="number" min={1} value={bulk.count === 0 ? "" : bulk.count} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onBulkChange({ count: Math.max(1, Number(e.target.value)) })} className="h-8 text-xs px-2 font-bold text-blue-600" />
            </div>
            <div className="flex justify-end pt-1">
              <Button onClick={onGenerateBulk} size="sm" icon={Plus} className="text-[10px] font-black uppercase tracking-wider">{t("floorDetails.generateUnitsCount", { count: bulk.count })}</Button>
            </div>
          </div>

          {/* Configured Units Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)]">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Home className="size-3.5 text-slate-500" />
              <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{t("floorDetails.configuredUnitsCount", { count: localUnits.length })}</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FloorDetailsTable
                data={localUnits}
                columns={columns}
                emptyMessage={t("floorDetails.noSubUnitsRegistered")}
                emptyMessageClassName="text-slate-400 font-bold uppercase tracking-wider text-sm"
                showExpandColumn={false}
                showBorder={false}
                containerClassName="shadow-none"
                tableClassName="text-xs text-left"
                theadClassName="bg-slate-100 border-b border-slate-200"
                headerCellClassName="border-r-0 px-3 py-2"
                cellClassName="border-r-0 px-3 py-2"
                tbodyClassName="divide-y divide-slate-100"
                rowClassName={() => "hover:bg-slate-50/50 transition-colors bg-white"}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-slate-700">{t("floorDetails.cancel")}</Button>
          <Button onClick={() => { onSaveSubUnits(); onClose(); }} className="text-[10px] font-black uppercase tracking-widest">{t("floorDetails.saveConfig")}</Button>
        </div>

        {/* SubUnit Details Configurator modal (rendered only when activeUnit exists) */}
        {activeUnit && (
          <div className="absolute inset-0 bg-slate-50 z-[60] flex flex-col animate-in fade-in duration-200">
            <SubUnitDetailedConfigurator
              key={String(activeUnit.id ?? '')}
              unit={activeUnit}
              parentBuildingName={`${currentFloor?.floor ?? "Ground"} Floor`}
              onSave={onSaveUnitDetail}
              onCancel={() => setActiveUnit(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}