import { Building2, Home, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/common";
import { Drawer } from "@/components/common/Drawer";
import { SubUnitDetailedConfigurator } from "./sub-units/SubUnitDetailedConfigurator";
import { useTranslations } from "next-intl";
import { useChildAssetDrawer } from "@/hooks/asset-hooks/floor-details/useChildAssetDrawer";
import { BulkGeneratorSection } from "./BulkGeneratorSection";
import type { ChildAssetDrawerProps } from "@/types/asset/floor-details.types";

export function ChildAssetDrawer({ isOpen, onClose, floorId }: ChildAssetDrawerProps) {
  const t = useTranslations("addAssetForm");
  
  const drawerState = useChildAssetDrawer(isOpen, floorId, onClose);
  
  if (!isOpen || floorId === null) return null;

  const {
    localUnits,
    bulkType, setBulkType,
    bulkPrefix, setBulkPrefix,
    bulkStartNum, setBulkStartNum,
    bulkCount, setBulkCount,
    activeUnit, setActiveUnit,
    currentFloor,
    floors,
    handleGenerateBulk,
    handleDeleteUnit,
    handleSave,
    handleSaveUnitDetail
  } = drawerState;

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      
      
      hideHeader={!!activeUnit}
      
      
      
      
      title={
        !activeUnit && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
              <Building2 className="size-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                {t("floorDetails.manageSubUnits")}
              </h2>
              <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">
                {t("floorDetails.floorUsage", { floor: currentFloor?.floorName || String((currentFloor as unknown as Record<string, unknown>)?.floor || ""), useType: currentFloor?.typeOfUseName || String((currentFloor as unknown as Record<string, unknown>)?.useType || "") })}
              </p>
            </div>
          </div>
        )
      }
      footer={
        !activeUnit && (
          <>
            <p className="text-[10px] text-slate-500 font-medium">
              {t("floorDetails.unitsAttached", { floor: currentFloor?.floorName || String((currentFloor as unknown as Record<string, unknown>)?.floor || "") })}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}
                className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                {t("floorDetails.cancel")}
              </Button>
              <Button onClick={handleSave}
                className="text-[10px] font-black uppercase tracking-widest">
                {t("floorDetails.saveUnitsConfig")}
              </Button>
            </div>
          </>
        )
      }
    >
        {activeUnit ? (
          <div className="h-full flex flex-col">
            <SubUnitDetailedConfigurator
              key={String(activeUnit.dbId ?? activeUnit.id ?? '')}
              unit={activeUnit}
              parentBuildingName="Current Building"
              onSave={handleSaveUnitDetail}
              onCancel={() => setActiveUnit(null)}
              floors={floors}
            />
          </div>
        ) : (
            <div className="p-4 space-y-4 custom-scrollbar">
              <BulkGeneratorSection
                bulkType={bulkType} setBulkType={setBulkType}
                bulkPrefix={bulkPrefix} setBulkPrefix={setBulkPrefix}
                bulkStartNum={bulkStartNum} setBulkStartNum={setBulkStartNum}
                bulkCount={bulkCount} setBulkCount={setBulkCount}
                handleGenerateBulk={handleGenerateBulk}
              />

              {/* Unit List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)]">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <Home className="size-3.5 text-slate-500" />
                  <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    {t("floorDetails.configuredUnitsCount", { count: localUnits.length })}
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 sticky top-0 border-b border-slate-200">
                      <tr className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="px-3 py-2">{t("floorDetails.unitNumber")}</th>
                        <th className="px-3 py-2">{t("floorDetails.type")}</th>
                        <th className="px-3 py-2 text-center">{t("floorDetails.rooms")}</th>
                        <th className="px-3 py-2">{t("floorDetails.status")}</th>
                        <th className="px-3 py-2 text-right">{t("floorDetails.areaSqFt")}</th>
                        <th className="px-3 py-2 text-right">{t("floorDetails.valueRs") || "Value (₹)"}</th>
                        <th className="px-3 py-2 text-center">{t("floorDetails.action")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {localUnits.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-slate-400 font-medium">
                            {t("floorDetails.noSubUnitsRegistered")}
                          </td>
                        </tr>
                      ) : (
                        localUnits.map((unit) => (
                          <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-1.5 font-bold text-slate-800">{unit.unitNumber}</td>
                            <td className="px-3 py-1.5">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-600 uppercase">
                                {unit.unitType}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-center font-mono text-[10px] font-bold text-slate-700">
                              {t("floorDetails.unitsCount", { count: unit.rooms?.length || 0 })}
                            </td>
                            <td className="px-3 py-1.5">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase border border-emerald-100">
                                {unit.status}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono font-medium">{unit.carpetAreaSqFt}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-700">{unit.baseValue.toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-center flex items-center justify-center gap-1">
                              <Button variant="edit" size="xs" onClick={() => setActiveUnit(unit)}
                                icon={Edit2} title={t("floorDetails.addDetails") || "Configure Details"} />
                              <Button variant="ghost" size="xs" onClick={() => handleDeleteUnit(unit.id)}
                                icon={Trash2} className="text-slate-400 hover:text-red-500 transition-colors" />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        )}
    </Drawer>
  );
}
