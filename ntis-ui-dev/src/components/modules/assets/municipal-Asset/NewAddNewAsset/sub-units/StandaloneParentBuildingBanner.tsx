'use client';

import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/common";
import { StandaloneParentBuildingBannerProps } from "@/types/asset/sub-units.types";

export function StandaloneParentBuildingBanner({
  t,
  parentBuildingName,
  assetType,
  parentBuildingData,
}: StandaloneParentBuildingBannerProps) {
  return (
    <>
      {/* Top Banner indicating Parent */}
      <div className="bg-blue-900 text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-800 rounded-lg">
            <Building2 className="size-6 text-blue-200" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-blue-100 uppercase tracking-widest">{t("standaloneSubUnit.generatingFor")}</h2>
            <p className="text-xl font-black">{parentBuildingName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-200 uppercase tracking-widest font-bold">{t("standaloneSubUnit.assetType")}</p>
          <p className="text-lg font-black text-amber-400">{assetType}</p>
        </div>
      </div>

      {/* Parent Building Registered Details Collapsible Panel */}
      {parentBuildingData && (
        <Card variant="bordered" className="border-blue-100 bg-white/70 shadow-sm">
          <CardContent className="p-3">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
                  <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-black">{t("standaloneSubUnit.registeredInfo")}</span>
                  <span>{t("standaloneSubUnit.viewDetails")}</span>
                </div>
                <span className="text-xs font-bold text-blue-600 group-open:hidden">{t("standaloneSubUnit.showDetails")}</span>
                <span className="text-xs font-bold text-blue-600 hidden group-open:inline">{t("standaloneSubUnit.hideDetails")}</span>
              </summary>
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs animate-in fade-in duration-300">
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("standaloneSubUnit.assetNameCode")}</span>
                  <span className="font-bold text-slate-700">{parentBuildingData.assetName} ({parentBuildingData.assetCode})</span>
                </div>
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("standaloneSubUnit.propertyTaxSurveyNo")}</span>
                  <span className="font-bold text-slate-700">{parentBuildingData.propertyNumber || "—"} / {parentBuildingData.surveyNumber || "—"}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("standaloneSubUnit.wardZone")}</span>
                  <span className="font-bold text-slate-700">{parentBuildingData.ward || "—"} / {parentBuildingData.zone || "—"}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("standaloneSubUnit.addressPinCode")}</span>
                  <span className="font-bold text-slate-700">{parentBuildingData.fullAddress || "—"} - {parentBuildingData.pinCode || "—"}</span>
                </div>

                {/* Render Parent Dynamic Attributes */}
                {parentBuildingData.attributes && Object.keys(parentBuildingData.attributes).length > 0 && (
                  <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 pt-2 border-t border-slate-100">
                    {Object.entries(parentBuildingData.attributes).map(([key, val]) => (
                      <div key={key}>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-bold text-slate-700">
                          {typeof val === 'boolean' ? (val ? "Yes" : "No") : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </>
  );
}
