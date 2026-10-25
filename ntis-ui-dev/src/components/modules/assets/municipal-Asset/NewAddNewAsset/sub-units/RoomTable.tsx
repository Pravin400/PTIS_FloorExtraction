'use client';

import { useMemo } from "react";
import { Trash2, Edit2, Scissors, Layers } from "lucide-react";
import { FloorDetailsTable, type FloorDetailsTableColumn } from "@/components/common";
import { RoomDisplayRow, RoomTableProps } from "@/types/asset/sub-units.types";

function plainHeader(label: React.ReactNode) {
  const Comp = () => (
    <span className="text-[10px] font-black text-[#1d4ed8] uppercase tracking-wider">{label}</span>
  );
  Comp.displayName = "TableHeader";
  return Comp;
}

export function RoomTable({
  rooms,
  carpetSqM,
  carpetSqFt,
  builtUpSqM,
  builtUpSqFt,
  toggleOffset,
  handleEdit,
  handleDelete,
  t,
  floorSubtitle,
}: RoomTableProps) {
    const displayRows: RoomDisplayRow[] = useMemo(() => rooms.flatMap((r, sIdx) =>
    Array.from({ length: Math.max(1, Number(r.count) || 1) }).map((_, idx) => ({
      id: `${r.id}-${idx}`,
      room: r,
      idx,
      isGroup: Number(r.count) > 1,
      displayNo: Number(r.count) > 1 ? `${r.roomNo || sIdx + 1}.${idx + 1}` : (r.roomNo || String(sIdx + 1)),
    }))
  ), [rooms]);

  const columns: FloorDetailsTableColumn<RoomDisplayRow>[] = useMemo(() => [
    {
      key: "no",
      label: t("inventory.columns.no"),
      headerRender: plainHeader(t("inventory.columns.no")),
      cellClassName: "text-left font-bold text-slate-800",
      render: ({ idx, isGroup, displayNo }: { idx: number; isGroup?: boolean; displayNo?: string | number }) => (
        <span title={isGroup ? `Room ${idx + 1} of group` : ""}>{displayNo}</span>
      ),
    },
    {
      key: "type",
      label: t("inventory.columns.type"),
      headerRender: plainHeader(t("inventory.columns.type")),
      cellClassName: "text-left font-black text-slate-900 text-[10px] uppercase",
      render: ({ room: r }) => r.roomType || <span className="text-slate-400 font-normal text-[10px]">-</span>,
    },
    {
      key: "shape",
      label: t("subunit.labels.shape"),
      headerRender: plainHeader(t("subunit.labels.shape")),
      cellClassName: "text-left",
      render: ({ room: r }) => (
        r.shape ? (
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-bold uppercase">
            {r.shape}
          </span>
        ) : (
          <span className="text-slate-400 font-normal text-[10px]">-</span>
        )
      ),
    },
    {
      key: "offsetCutout",
      label: t("subunit.labels.offsetCutout"),
      headerRender: plainHeader(t("subunit.labels.offsetCutout")),
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: ({ room: r }) => (
        <button
          type="button"
          onClick={() => toggleOffset(r.id, r.hasOffset === "Yes" ? "No" : "Yes")}
          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border flex items-center gap-1 mx-auto transition-colors ${r.hasOffset === "Yes"
            ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
            }`}
        >
          <Scissors className="size-2.5" />
          {r.hasOffset === "Yes" ? `${r.offsetOp === "Add" ? "+" : "−"}${(r.offsetAreaSqM ?? 0).toFixed(2)}m²` : t("floorDetails.no")}
        </button>
      ),
    },
    {
      key: "outer",
      label: t("subunit.labels.outer"),
      headerRender: plainHeader(t("subunit.labels.outer")),
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: ({ room: r }) => (
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${r.outer === "Yes" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-50 text-slate-500"}`}>
          {r.outer === "Yes" ? "−20%" : t("floorDetails.no")}
        </span>
      ),
    },
    {
      key: "totalAreaSqM",
      label: t("subunit.labels.totalAreaSqM"),
      headerRender: plainHeader(t("subunit.labels.totalAreaSqM")),
      headerClassName: "text-right",
      cellClassName: `text-right font-mono font-bold text-[10px]`,
      render: ({ room: r }) => {
        const base = r.netAreaSqM ?? 0;
        const value = r.minus === "Yes" ? `-${base.toFixed(2)}` : r.outer === "Yes" ? (base * 0.8).toFixed(2) : base.toFixed(2);
        const colorClass = r.minus === "Yes" ? "text-red-700" : r.outer === "Yes" ? "text-blue-700" : "text-slate-900";
        return <span className={colorClass}>{value}</span>;
      },
    },
    {
      key: "actions",
      label: t("inventory.columns.actions"),
      headerRender: plainHeader(t("inventory.columns.actions")),
      headerClassName: "text-center",
      cellClassName: "text-center flex gap-1 justify-center",
      render: ({ room: r, idx }) =>
        idx === 0 && (
          <>
            <button onClick={() => handleEdit(r)} className="p-1 hover:bg-blue-50 rounded text-blue-600" title={`Edit group of ${r.count}`}><Edit2 className="size-3" /></button>
            <button onClick={() => handleDelete(r.id)} className="p-1 hover:bg-red-50 rounded text-red-400" title={`Delete group of ${r.count}`}><Trash2 className="size-3" /></button>
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#1d4ed8] uppercase tracking-widest">
            {t("subunit.labels.addedRooms")} ({rooms.reduce((s: number, r) => s + (Number(r.count) || 0), 0)})
          </span>
          {floorSubtitle && (
            <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200">
              {floorSubtitle}
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto max-h-[260px] overflow-y-auto custom-scrollbar">
        <FloorDetailsTable
          data={displayRows}
          columns={columns}
          emptyMessage={t("subunit.labels.noRoomsAdded")}
          emptyMessageClassName="text-slate-400 text-sm"
          showExpandColumn={false}
          showBorder={false}
          containerClassName="shadow-none"
          tableClassName="text-xs text-left"
          theadClassName="bg-[#EAF2FD] sticky top-0 border-b border-slate-200 z-10"
          headerCellClassName="border-r-0 px-3 py-2.5"
          cellClassName="border-r-0 px-3 py-2"
          tbodyClassName="divide-y divide-slate-100"
          rowClassName={({ room: r }) =>
            `hover:bg-slate-50 border-b border-slate-100 ${r.minus === "Yes" ? "bg-red-50/30" : r.outer === "Yes" ? "bg-blue-50/20" : ""}`
          }
        />
      </div>
      <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
        <span>{t("subunit.labels.totalRooms")}: {rooms.reduce((s: number, r) => s + (Number(r.count) || 0), 0)}</span>
        <div className="flex gap-4">
          <span>{t("subunit.labels.carpet")}: <span className="text-blue-700">{carpetSqM.toFixed(2)}{' m² ('}{carpetSqFt.toFixed(2)}{' SqFt)'}</span></span>
          <span>{t("subunit.labels.builtup")}: <span className="text-emerald-700">{builtUpSqM.toFixed(2)}{' m² ('}{builtUpSqFt.toFixed(2)}{' SqFt)'}</span></span>
        </div>
      </div>
    </div>
  );
}
