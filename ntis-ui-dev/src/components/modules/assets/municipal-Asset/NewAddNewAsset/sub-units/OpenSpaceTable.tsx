'use client';
export interface OpenSpaceTableProps {
  spacesList: OpenSpace[];
  toggleOffset: (id: string, val: 'Yes' | 'No') => void;
  handleEdit: (os: OpenSpace) => void;
  handleDelete: (id: string) => void;
  totalGrossSqM: number;
  totalGrossSqFt: number;
  totalNetSqM: number;
  totalNetSqFt: number;
  t?: (key: string) => string;
}


import type { OpenSpaceDisplayRow } from "@/types/asset/municipal-Asset/new-add-new-asset";
import React, { useMemo } from "react";
import { Edit2, Scissors, Trash2, Layers } from "lucide-react";
import { FloorDetailsTable, type FloorDetailsTableColumn } from "@/components/common";
import { OpenSpace } from "@/hooks/asset-hooks/useOpenSpaceDrawer";

function plainHeader(label: React.ReactNode) {
  const Comp = () => (
    <span className="text-[10px] font-black text-[#1d4ed8] uppercase tracking-wider">{label}</span>
  );
  Comp.displayName = "TableHeader";
  return Comp;
}

export function OpenSpaceTable({
  spacesList,
  toggleOffset,
  handleEdit,
  handleDelete,
  totalGrossSqM,
  totalGrossSqFt,
  totalNetSqM,
  totalNetSqFt,
  t,
}: OpenSpaceTableProps) {
  const displayRows: OpenSpaceDisplayRow[] = useMemo(() => spacesList.flatMap((s: OpenSpace, sIdx: number) =>
    Array.from({ length: Math.max(1, s.count) }).map((_, idx) => ({
      id: `${s.id}-${idx}`,
      space: s,
      idx,
      isGroup: s.count > 1,
      displayNo: s.count > 1 ? `${sIdx + 1}.${idx + 1}` : `${sIdx + 1}`,
    }))
  ), [spacesList]);

  const columns: FloorDetailsTableColumn<OpenSpaceDisplayRow>[] = useMemo(() => [
    {
      key: "no",
      label: t?.("inventory.columns.no") || "No",
      headerRender: plainHeader(t?.("inventory.columns.no") || "No"),
      cellClassName: "text-left font-bold text-slate-800",
      render: ({ displayNo }) => <span>{displayNo}</span>,
    },
    {
      key: "type",
      label: t?.("inventory.columns.type") || "Type",
      headerRender: plainHeader(t?.("inventory.columns.type") || "Type"),
      cellClassName: "text-left font-black text-slate-900 text-[10px] uppercase",
      render: ({ space: s }) => s.name,
    },
    {
      key: "shape",
      label: t?.("subunit.labels.shape") || "Shape",
      headerRender: plainHeader(t?.("subunit.labels.shape") || "Shape"),
      cellClassName: "text-left",
      render: ({ space: s }) => (
        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-bold uppercase">
          {s.shape}
        </span>
      ),
    },
    {
      key: "offsetCutout",
      label: t?.("subunit.labels.offsetCutout") || "Offset / Cutout",
      headerRender: plainHeader(t?.("subunit.labels.offsetCutout") || "Offset / Cutout"),
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: ({ space: s }) => (
        <button
          type="button"
          onClick={() => toggleOffset(s.id, s.hasOffset === "Yes" ? "No" : "Yes")}
          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border flex items-center gap-1 mx-auto transition-colors ${s.hasOffset === "Yes"
            ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
            }`}
        >
          <Scissors className="size-2.5" />
          {s.hasOffset === "Yes" ? `${s.offsetOp === "Add" ? "+" : "−"}${(s.offsetAreaSqM ?? 0).toFixed(2)}m²` : t?.("floorDetails.no") || "No"}
        </button>
      ),
    },
    {
      key: "count",
      label: t?.("inventory.columns.quantity") || "Count",
      headerRender: plainHeader(t?.("inventory.columns.quantity") || "Count"),
      headerClassName: "text-right",
      cellClassName: "text-right font-mono text-slate-800",
      render: ({ space: s, idx }) => (idx === 0 ? s.count : "1"),
    },
    {
      key: "grossArea",
      label: "Gross (m²)",
      headerRender: plainHeader("Gross (m²)"),
      headerClassName: "text-right",
      cellClassName: "text-right font-mono text-slate-800",
      render: ({ space: s }) => (s.areaSqM * s.count).toFixed(2),
    },
    {
      key: "totalAreaSqM",
      label: t?.("subunit.labels.totalAreaSqM") || "Net (m²)",
      headerRender: plainHeader(t?.("subunit.labels.totalAreaSqM") || "Net (m²)"),
      headerClassName: "text-right",
      cellClassName: "text-right font-mono font-bold text-[10px]",
      render: ({ space: s }) => <span className="text-blue-700 font-bold">{(s.netAreaSqM * s.count).toFixed(2)}</span>,
    },
    {
      key: "actions",
      label: t?.("inventory.columns.actions") || "Actions",
      headerRender: plainHeader(t?.("inventory.columns.actions") || "Actions"),
      headerClassName: "text-center",
      cellClassName: "text-center flex gap-1 justify-center",
      render: ({ space: s, idx }) =>
        idx === 0 && (
          <>
            <button onClick={() => handleEdit(s)} className="p-1 hover:bg-blue-50 rounded text-blue-600" title={`Edit ${s.name}`}><Edit2 className="size-3" /></button>
            <button onClick={() => handleDelete(s.id)} className="p-1 hover:bg-red-50 rounded text-red-400" title={`Delete ${s.name}`}><Trash2 className="size-3" /></button>
          </>
        ),
    },
  ], [toggleOffset, handleEdit, handleDelete, t]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-3">
      <div className="flex items-center gap-2 bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF] border border-[#A3CBFA] rounded-xl py-1.5 px-3 m-2.5 shadow-sm">
        <div className="bg-[#1d4ed8] p-1 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
          <Layers className="size-3.5 text-white" />
        </div>
        <span className="text-xs font-bold text-[#1d4ed8] uppercase tracking-widest">
          {'Configured Open Spaces ('}{spacesList.reduce((s: number, o: OpenSpace) => s + o.count, 0)}{')'}
        </span>
      </div>
      <div className="overflow-x-auto max-h-[260px] overflow-y-auto custom-scrollbar">
        <FloorDetailsTable
          data={displayRows}
          columns={columns}
          emptyMessage="No open spaces added yet."

          showExpandColumn={false}
          showBorder={false}
          containerClassName="shadow-none"
          tableClassName="text-xs text-left"
          theadClassName="bg-[#EAF2FD] sticky top-0 border-b border-slate-200 z-10"
          headerCellClassName="border-r-0 px-3 py-2.5"
          cellClassName="border-r-0 px-3 py-2"
          tbodyClassName="divide-y divide-slate-100"
          rowClassName={() => "hover:bg-slate-50 border-b border-slate-100"}
        />
      </div>
      <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
        <span>{'Total: '}{spacesList.reduce((s: number, o: OpenSpace) => s + o.count, 0)} {'open spaces'}</span>
        <div className="flex gap-4">
          <span>{'Gross: '}<span className="text-slate-700">{totalGrossSqM.toFixed(2)} {'m² ('}{totalGrossSqFt.toFixed(2)} {'SqFt)'}</span></span>
          <span>{'Net: '}<span className="text-blue-700">{totalNetSqM.toFixed(2)} {'m² ('}{totalNetSqFt.toFixed(2)} {'SqFt)'}</span></span>
        </div>
      </div>
    </div>
  );
}
