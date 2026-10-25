'use client';

import { useMemo } from "react";
import { Layers } from "lucide-react";
import { FloorDetailsTable } from "@/components/common";
import { buildStandaloneUnitsTableColumns } from "./standalone-units-table-columns";
import { StandaloneUnitsTableProps } from "@/types/asset/sub-units.types";

const HEADER_GRADIENT = "bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF] border-b border-[#A3CBFA] text-[#1d4ed8]";

export function StandaloneUnitsTable({
  t,
  units,
  dropdownOptions,
  isGenerating,
  onConfigureUnit,
  onDeleteUnit,
}: StandaloneUnitsTableProps) {
  const tableData = useMemo(
    () => units.map((u, i) => ({ ...u, id: u.id ?? u.tempId ?? i })),
    [units]
  );

  const columns = useMemo(
    () => buildStandaloneUnitsTableColumns({ t, dropdownOptions, isGenerating, onConfigureUnit, onDeleteUnit }),
    [t, dropdownOptions, isGenerating, onConfigureUnit, onDeleteUnit]
  );

  return (
    <div className="overflow-hidden border border-slate-200 rounded-xl shadow-inner bg-slate-50/20">
      <div className={`flex items-center justify-between px-4 py-2 ${HEADER_GRADIENT}`}>
        <div className="flex items-center gap-2">
          <div className="bg-[#1d4ed8] p-1 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
            <Layers className="size-3.5 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#1d4ed8]">
              {t("floorDetails.allFloors", { count: units.length })}
            </h4>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto max-h-[350px] custom-scrollbar bg-white">
        <FloorDetailsTable
          data={tableData}
          columns={columns}
          emptyMessage={t("floorDetails.noFloorDetailsAdded") || "NO FLOOR DETAILS ADDED YET."}
          
          showExpandColumn={false}
          showBorder={false}
          containerClassName="shadow-none"
          tableClassName="text-xs whitespace-nowrap bg-white"
          theadClassName={`sticky top-0 z-10 ${HEADER_GRADIENT} text-[10px] font-black uppercase tracking-wider`}
          headerCellClassName="border-r-0 py-2.5 px-4"
          cellClassName="border-r-0 py-2.5 px-4"
          tbodyClassName="divide-y divide-slate-100 bg-white"
          rowClassName={() => "hover:bg-slate-50/60 transition-colors bg-white text-slate-800"}
        />
      </div>
    </div>
  );
}
