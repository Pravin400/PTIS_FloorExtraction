import React from "react";
import { Layers, Edit2, Trash2 } from "lucide-react";
import { Button, Card, FloorDetailsTable, type FloorDetailsTableColumn } from "@/components/common";
import type { DirectRoomRegistrationTableProps, SavedFloorRow } from "@/types/asset/floor-details.types";

const FOCUS_RING_RESET = "focus:ring-0! focus:ring-offset-0!";

function plainHeader(label: React.ReactNode) {
  const HeaderComponent = () => (
    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{label}</span>
  );
  HeaderComponent.displayName = 'PlainHeaderDirect';
  return HeaderComponent;
}

export function DirectRoomRegistrationTable({
  savedFloors,
  dropdownOptions,
  isLoading,
  handleEdit,
  handleDelete,
  t
}: DirectRoomRegistrationTableProps) {
  const tableData = savedFloors.map((f, i) => ({ ...f, id: f.id ?? i }));

  const columns: FloorDetailsTableColumn<SavedFloorRow>[] = [
    {
      key: "floor",
      label: t("floorDetails.floor"),
      headerRender: plainHeader(t("floorDetails.floor")),
      cellClassName: "text-left font-bold text-slate-900",
      render: (f) => dropdownOptions?.floorLevels?.find((o: { label?: string; value?: string | number; [key: string]: unknown }) => String(o.value) === String(f.floorId))?.label || f.floorId,
    },
    {
      key: "subFloor",
      label: t("floorDetails.subFloor"),
      headerRender: plainHeader(t("floorDetails.subFloor")),
      cellClassName: "text-left font-semibold text-slate-800",
      render: (f) => String(f.subFloorName || f.subFloorId || "-"),
    },
    {
      key: "conYr",
      label: t("floorDetails.conYr"),
      headerRender: plainHeader(t("floorDetails.conYr")),
      cellClassName: "text-left font-mono font-bold text-slate-800",
      render: (f) => String(f.constructionYear ?? ""),
    },
    {
      key: "conType",
      label: t("floorDetails.conType"),
      headerRender: plainHeader(t("floorDetails.conType")),
      cellClassName: "text-left font-semibold text-slate-800",
      render: (f) => dropdownOptions?.constructionTypes?.find((o: { label?: string; value?: string | number; [key: string]: unknown }) => String(o.value) === String(f.constructionTypeId))?.label || f.constructionTypeId,
    },
    {
      key: "typeOfUse",
      label: t("floorDetails.typeOfUse"),
      headerRender: plainHeader(t("floorDetails.typeOfUse")),
      cellClassName: "text-left font-semibold text-slate-800",
      render: (f) => f.useTypeName || dropdownOptions?.useTypes?.find((o: { label?: string; value?: string | number; [key: string]: unknown }) => String(o.value) === String(f.typeOfUseId))?.label || f.typeOfUseId,
    },
    {
      key: "subTypeOfUse",
      label: t("floorDetails.subTypeOfUse"),
      headerRender: plainHeader(t("floorDetails.subTypeOfUse")),
      cellClassName: "text-left font-semibold text-slate-800",
      render: (f) => String(f.subTypeOfUseName || "-"),
    },
    {
      key: "renter",
      label: t("floorDetails.renter"),
      headerRender: plainHeader(t("floorDetails.renter")),
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (f) => (
        <div className="flex flex-col items-center">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${f.isRented ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            {f.isRented ? t("floorDetails.yes") : t("floorDetails.no")}
          </span>
          {Boolean(f.isRented && f.renterNameEnglish) && (
            <span className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-tight max-w-[120px] truncate" title={String(f.renterNameEnglish || "")}>
              {String(f.renterNameEnglish)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "rooms",
      label: t("floorDetails.rooms"),
      headerRender: plainHeader(t("floorDetails.rooms")),
      headerClassName: "text-center",
      cellClassName: "text-center font-bold text-slate-800",
      render: (f) => String(String(f.unitType).toLowerCase() === "room" ? ((f as Record<string, unknown>).noOfRooms ?? 0) : 0),
    },
    {
      key: "carpetArea",
      label: t("floorDetails.carpetAreaSqFtSqM"),
      headerRender: plainHeader(t("floorDetails.carpetAreaSqFtSqM")),
      headerClassName: "text-center",
      cellClassName: "text-center font-mono font-bold text-[#2d42db]",
      render: (f) => `${Number((f as Record<string, unknown>).carpetAreaSqFeet || 0).toFixed(2)} / ${(Number((f as Record<string, unknown>).carpetAreaSqFeet || 0) / 10.7639).toFixed(2)}`,
    },
    {
      key: "builtupArea",
      label: t("floorDetails.builtupSqFtSqM"),
      headerRender: plainHeader(t("floorDetails.builtupSqFtSqM")),
      headerClassName: "text-center",
      cellClassName: "text-center font-mono font-bold text-emerald-700",
      render: (f) => `${Number((f as Record<string, unknown>).builtUpAreaSqFeet || 0).toFixed(2)} / ${(Number((f as Record<string, unknown>).builtUpAreaSqFeet || 0) / 10.7639).toFixed(2)}`,
    },
    {
      key: "action",
      label: t("floorDetails.action"),
      headerRender: plainHeader(t("floorDetails.action")),
      headerClassName: "text-center",
      cellClassName: "text-center flex items-center justify-center gap-2 py-1.5 px-3",
      render: (f) => (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={Edit2}
            title="Edit Floor Details"
            onClick={() => handleEdit(f)}
            className={`h-auto! w-auto! p-1.5! bg-amber-50! hover:bg-amber-100! rounded-lg! text-amber-600! border! border-amber-100/50! ${FOCUS_RING_RESET}`}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => handleDelete(Number(f.id))}
            disabled={isLoading}
            className={`h-auto! w-auto! p-1.5! bg-rose-50! hover:bg-rose-100! rounded-lg! text-rose-600! border! border-rose-100/50! ${FOCUS_RING_RESET}`}
          />
        </>
      ),
    },
  ];

  return (
    <Card variant="default" padding="none" className="overflow-hidden border-slate-200 rounded-xl shadow-inner bg-slate-50/20">
      <div className="bg-slate-50/70 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Layers className="size-4" /> {t("floorDetails.allFloors", { count: savedFloors.length })}
        </span>
      </div>
      <div className="overflow-x-auto">
        <FloorDetailsTable
          data={tableData}
          columns={columns}
          emptyMessage={t("floorDetails.noFloorDetailsAdded")}
          emptyMessageClassName="text-slate-400 font-bold uppercase tracking-wider text-[11px]"
          showExpandColumn={false}
          showBorder={false}
          containerClassName="shadow-none"
          tableClassName="text-xs whitespace-nowrap bg-white"
          theadClassName="bg-slate-100 border-b border-slate-200"
          headerCellClassName="border-r-0 py-2.5 px-4"
          cellClassName="border-r-0 py-2.5 px-4"
          tbodyClassName="divide-y divide-slate-100"
          rowClassName={() => "hover:bg-slate-50/60 transition-colors bg-white text-slate-800"}
        />
      </div>
    </Card>
  );
}
