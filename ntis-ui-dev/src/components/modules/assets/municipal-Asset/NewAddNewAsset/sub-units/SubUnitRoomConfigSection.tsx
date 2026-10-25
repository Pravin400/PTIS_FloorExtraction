'use client';

import { Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/common";

import { SubUnitRoomConfigSectionProps } from "@/types/asset/sub-units.types";
export function SubUnitRoomConfigSection({
  roomsList,
  openSpacesList,
  area,
  setIsRoomsDrawerOpen,
  setIsOpenSpacesDrawerOpen,
  t
}: SubUnitRoomConfigSectionProps) {
  return (
    <Card variant="bordered" padding="sm" className="shadow-sm border-slate-200/80 bg-white rounded-2xl">
      <CardHeader className="flex items-center gap-2 bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF] border border-[#A3CBFA] rounded-xl py-1 px-2.5 mb-2.5 shadow-sm">
        <div className="bg-[#1d4ed8] p-1 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
          <Layers className="size-3.5 text-white" />
        </div>
        <CardTitle className="text-xs font-bold text-[#1d4ed8] uppercase tracking-widest">{t("subunit.sections.roomWiseConfig")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-end gap-2">
          <Button
            variant="primary"
            type="button"
            icon={Layers}
            onClick={() => setIsRoomsDrawerOpen(true)}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-wider shadow-md shadow-blue-100"
          >
            {t("buttons.addRooms")}
          </Button>
          <Button
            variant="primary"
            type="button"
            icon={Layers}
            onClick={() => setIsOpenSpacesDrawerOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-100"
          >{'Configure Open Space'}</Button>
        </div>

        {(roomsList.length > 0 || openSpacesList.length > 0) && (
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
            <div>
              <span className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">{t("subunit.labels.totalRooms")}</span>
              <span className="font-mono text-xs font-black text-slate-700">{roomsList.reduce((acc, r) => acc + Number(r.count || 0), 0)} {t("subunit.labels.rooms")}</span>
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">{'Open Spaces'}</span>
              <span className="font-mono text-xs font-black text-slate-700">{openSpacesList.reduce((acc, r) => acc + Number(r.count || 0), 0)} {'Spaces'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">{t("subunit.labels.carpetArea")}</span>
              <span className="font-mono text-xs font-black text-emerald-700">
                {t("subunit.labels.carpetAreaSqFtM2", { sqFt: Number(area).toFixed(2), m2: (Number(area) / 10.7639).toFixed(2) })}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">{t("subunit.labels.roomTypesAdded")}</span>
              <span className="text-[10px] font-bold text-slate-600 truncate block">
                {[
                  ...Array.from(new Set(roomsList.map(r => r.roomType))),
                  ...Array.from(new Set(openSpacesList.map(os => os.name || os.roomNo || "Open Space")))
                ].filter(Boolean).join(", ")}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
