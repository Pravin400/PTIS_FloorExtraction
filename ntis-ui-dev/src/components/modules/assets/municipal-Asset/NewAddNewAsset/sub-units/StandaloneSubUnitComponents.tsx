'use client';

import { Building, LayoutGrid, Edit2 } from "lucide-react";
import { Badge, Button, Card, CardContent, Table } from "@/components/common";
import { useTranslations } from "next-intl";

export function StandaloneParentBuildingBanner({
  parentBuildingName,
  assetType,
}: {
  t: (k: string) => string;
  parentBuildingName: string;
  assetType?: string;
  parentBuildingData?: Record<string, unknown>;
}) {
  const t = useTranslations("addAssetForm");
  return (
    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-xs">
          <Building className="size-6 text-blue-300" />
        </div>
        <div>
          <p className="text-xs text-blue-200 uppercase tracking-widest font-bold">{t("standaloneSubUnit.parentBuilding")}</p>
          <p className="text-xl font-black">{parentBuildingName}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-blue-200 uppercase tracking-widest font-bold">{t("standaloneSubUnit.assetType")}</p>
        <p className="text-lg font-black text-amber-400">{assetType}</p>
      </div>
    </div>
  );
}

export function ParentBuildingDetails({ parentBuildingData }: { parentBuildingData: Record<string, unknown> | undefined }) {
  const t = useTranslations("addAssetForm");
  if (!parentBuildingData) return null;

  return (
    <Card variant="bordered" className="border-blue-100 bg-white/70 shadow-sm">
      <CardContent className="p-3">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
              <Badge variant="default" size="sm">{t("standaloneSubUnit.registeredInfo")}</Badge>
              <span>{t("standaloneSubUnit.viewDetails")}</span>
            </div>
            <span className="text-xs font-bold text-blue-600 group-open:hidden">{t("standaloneSubUnit.showDetails")}</span>
            <span className="text-xs font-bold text-blue-600 hidden group-open:inline">{t("standaloneSubUnit.hideDetails")}</span>
          </summary>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs animate-in fade-in duration-300">
            <div>
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("standaloneSubUnit.assetNameCode")}</span>
              <span className="font-bold text-slate-700">{String(parentBuildingData.assetName ?? "")} ({String(parentBuildingData.assetCode ?? "")})</span>
            </div>
            <div>
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("standaloneSubUnit.propertyTaxSurveyNo")}</span>
              <span className="font-bold text-slate-700">{String(parentBuildingData.propertyNumber || "—")} / {String(parentBuildingData.surveyNumber || "—")}</span>
            </div>
            <div>
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("standaloneSubUnit.wardZone")}</span>
              <span className="font-bold text-slate-700">{String(parentBuildingData.ward || "—")} / {String(parentBuildingData.zone || "—")}</span>
            </div>
            <div>
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("standaloneSubUnit.addressPinCode")}</span>
              <span className="font-bold text-slate-700">{String(parentBuildingData.fullAddress || "—")} - {String(parentBuildingData.pinCode || "—")}</span>
            </div>

            {Boolean(parentBuildingData.attributes && typeof parentBuildingData.attributes === "object" && Object.keys(parentBuildingData.attributes).length > 0) && (
              <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 pt-2 border-t border-slate-100">
                {Object.entries(parentBuildingData.attributes as Record<string, unknown>).map(([key, val]) => (
                  <div key={key}>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-bold text-slate-700">
                      {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val ?? "")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

export function UnitsGrid({ units, assetType, parentBuildingName, setActiveUnit }: { units: Record<string, unknown>[], assetType: string, parentBuildingName: string, setActiveUnit: (u: Record<string, unknown>) => void }) {
  const t = useTranslations("addAssetForm");

  const columns = [
    { key: "subAssetId", label: t("standaloneSubUnit.assetNo"), className: "bg-blue-50/80 border-b border-blue-100 !text-blue-700 text-[10px] font-black uppercase tracking-wider py-2.5 px-4", render: (val: unknown) => <span className="font-mono text-slate-600">{String(val ?? "")}</span> },
    { key: "unitNumber", label: t("standaloneSubUnit.unitNo"), className: "bg-blue-50/80 border-b border-blue-100 !text-blue-700 text-[10px] font-black uppercase tracking-wider py-2.5 px-4", render: (val: unknown) => <span className="font-bold text-slate-800">{String(val ?? "")}</span> },
    { key: "unitName", label: t("standaloneSubUnit.unitName"), className: "bg-blue-50/80 border-b border-blue-100 !text-blue-700 text-[10px] font-black uppercase tracking-wider py-2.5 px-4", render: (val: unknown) => <span className="font-medium">{String(val ?? "")}</span> },
    { key: "roomsCount", label: t("standaloneSubUnit.rooms"), className: "bg-blue-50/80 border-b border-blue-100 !text-blue-700 text-[10px] font-black uppercase tracking-wider py-2.5 px-4 text-center", render: (val: unknown) => <span className="text-center font-mono font-bold text-slate-700 block">{String(val ?? "")}</span> },
    { key: "rentAmountDisplay", label: t("standaloneSubUnit.rent"), className: "bg-blue-50/80 border-b border-blue-100 !text-blue-700 text-[10px] font-black uppercase tracking-wider py-2.5 px-4 text-right", render: (val: unknown) => <span className="text-right font-mono font-bold text-slate-700 block">{String(val ?? "")}</span> },
    { key: "rentTypeDisplay", label: t("standaloneSubUnit.rentType"), className: "bg-blue-50/80 border-b border-blue-100 !text-blue-700 text-[10px] font-black uppercase tracking-wider py-2.5 px-4", render: (val: unknown) => <Badge variant="secondary" size="sm">{String(val ?? "")}</Badge> },
    { key: "securityDepositDisplay", label: t("standaloneSubUnit.secDeposit"), className: "bg-blue-50/80 border-b border-blue-100 !text-blue-700 text-[10px] font-black uppercase tracking-wider py-2.5 px-4 text-right", render: (val: unknown) => <span className="text-right font-mono font-bold text-slate-700 block">{String(val ?? "")}</span> },
    { key: "actions", label: t("standaloneSubUnit.config"), className: "bg-blue-50/80 border-b border-blue-100 !text-blue-700 text-[10px] font-black uppercase tracking-wider py-2.5 px-4 text-center", render: (_val: unknown, row: Record<string, unknown> & { original: Record<string, unknown> }) => (
      <Button
        variant="secondary"
        size="xs"
        icon={Edit2}
        onClick={() => setActiveUnit(((row as { original?: Record<string, unknown> })?.original || row) as Record<string, unknown>)}
        className="px-3 py-1 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-200 hover:border-blue-600 text-[10px] font-bold uppercase tracking-wider mx-auto"
      >
        {t("standaloneSubUnit.detail")}
      </Button>
    )}
  ];

  const tableData = units.map(u => ({
    ...u,
    id: u.id,
    subAssetId: u.subAssetId,
    unitNumber: u.unitNumber,
    unitName: u.unitName,
    roomsCount: ((u.rooms as unknown[])?.length || 0),
    rentAmountDisplay: Number(u.rentAmount || 0).toLocaleString(),
    rentTypeDisplay: u.rentType || "None",
    securityDepositDisplay: Number(u.securityDeposit || 0).toLocaleString(),
    original: u
  }));

  return (
    <Card variant="bordered" className="border-blue-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="bg-blue-600 px-4 py-2 flex items-center gap-2 shrink-0">
        <LayoutGrid className="size-4 text-blue-200" />
        <h3 className="text-xs font-black text-white uppercase tracking-widest">
          {t("standaloneSubUnit.generatedHeader", { assetType, buildingName: parentBuildingName, count: units.length })}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Table className="[&_td]:!py-2 [&_th]:!py-2.5 [&_td]:!px-3 [&_th]:!px-3 [&_td]:!text-[11px] [&_th]:!text-[10px] [&_th:nth-child(4)]:!text-center [&_th:nth-child(5)]:!text-right [&_th:nth-child(7)]:!text-right [&_th:nth-child(8)]:!text-center" data={tableData} columns={columns as unknown as Parameters<typeof Table>[0]["columns"]} emptyMessage={t("standaloneSubUnit.noUnitsYet")} />
      </div>
    </Card>
  );
}
