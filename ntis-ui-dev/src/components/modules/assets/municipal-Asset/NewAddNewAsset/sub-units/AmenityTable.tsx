'use client';

import { Scissors } from "lucide-react";
import { EditButton, DeleteButton, Button, Badge, Table } from "@/components/common";
import { Amenity } from "@/hooks/asset-hooks/useAmenityDrawer";

interface AmenityTableProps {
  spacesList: Amenity[];
  toggleOffset: (id: string, val: "Yes" | "No") => void;
  handleEdit: (os: Amenity) => void;
  handleDelete: (id: string) => void;
  totalGrossSqM: number;
  totalGrossSqFt: number;
  totalNetSqM: number;
  totalNetSqFt: number;
}

export function AmenityTable({
  spacesList,
  toggleOffset,
  handleEdit,
  handleDelete,
  totalGrossSqM,
  totalGrossSqFt,
  totalNetSqM,
  totalNetSqFt,
}: AmenityTableProps) {
  const columns = [
    { key: "name", label: "Name", render: (val: unknown) => <span className="font-bold text-slate-800">{String(val ?? "")}</span> },
    { key: "shape", label: "Shape", render: (val: unknown) => <Badge variant="secondary" size="sm">{String(val ?? "")}</Badge> },
    {
      key: "offset", label: "Offset", render: (_val: unknown, os: Record<string, unknown>) => {
        const item = ((os as { original?: Amenity }).original || os) as Amenity;
        return (
          <Button
            variant={item.hasOffset === "Yes" ? "primary" : "secondary"}
            size="xs"
            type="button"
            onClick={() => toggleOffset(item.id, item.hasOffset === "Yes" ? "No" : "Yes")}
            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 mx-auto ${item.hasOffset === "Yes"
              ? "bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 shadow-none"
              : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 shadow-none"
              }`}
          >
            <Scissors className="size-2.5" />
            {item.hasOffset === "Yes" ? `${item.offsetOp === "Add" ? "+" : "−"}${(item.offsetAreaSqM ?? 0).toFixed(2)}m²` : "No"}
          </Button>
        );
      }
    },
    { key: "count", label: "Count", render: (val: unknown) => <div className="text-right font-mono text-slate-800">{String(val ?? "")}</div> },
    { key: "gross", label: "Gross (m²)", render: (val: unknown) => <div className="text-right font-mono text-slate-800">{String(val ?? "")}</div> },
    { key: "net", label: "Net (m²)", render: (val: unknown) => <div className="text-right font-mono font-bold text-blue-700">{String(val ?? "")}</div> },
    {
      key: "actions", label: "Actions", render: (_val: unknown, os: Record<string, unknown>) => {
        const item = ((os as { original?: Amenity }).original || os) as Amenity;
        return (
          <div className="flex gap-1 justify-center">
            <EditButton onClick={() => handleEdit(item)} />
            <DeleteButton onClick={() => handleDelete(item.id)} />
          </div>
        );
      }
    }
  ];

  const tableData = spacesList.map((os) => ({
    ...os,
    id: os.id,
    name: os.name,
    shape: os.shape,
    offset: os.id,
    count: os.count,
    gross: (os.areaSqM * os.count).toFixed(2),
    net: (os.netAreaSqM * os.count).toFixed(2),
    actions: os.id,
    original: os,
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{'Configured Amenities'}</span>
      </div>
      <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
        <Table
          className="[&_td]:!py-2 [&_th]:!py-2.5 [&_td]:!px-3 [&_th]:!px-3 [&_td]:!text-[11px] [&_th]:!text-[10px] [&_th:nth-child(3)]:!text-center [&_th:nth-child(4)]:!text-right [&_th:nth-child(5)]:!text-right [&_th:nth-child(6)]:!text-right [&_th:nth-child(7)]:!text-center"
          emptyMessage="No amenities added yet."
          columns={columns as Parameters<typeof Table>[0]['columns']}
          data={tableData}
        />
      </div>
      <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
        <span>{'Total: '}{spacesList.reduce((s: number, o: Amenity) => s + o.count, 0)} {'amenities'}</span>
        <div className="flex gap-4">
          <span>{'Gross: '}<span className="text-slate-700">{totalGrossSqM.toFixed(2)} {'m² / '}{totalGrossSqFt.toFixed(2)} {'SqFt'}</span></span>
          <span>{'Net: '}<span className="text-blue-700">{totalNetSqM.toFixed(2)} {'m² / '}{totalNetSqFt.toFixed(2)} {'SqFt'}</span></span>
        </div>
      </div>
    </div>
  );
}
